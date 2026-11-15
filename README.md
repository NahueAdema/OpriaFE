# Opria · Frontend

Frontend de Opria: landing pública, espacio de clientes (cuenta, buscador de
negocios y turnos propios) y panel del negocio (perfil, servicios, equipo,
horarios, disponibilidad y agenda de turnos). La reserva pública sigue
funcionando como invitado. Consume la API de `opria-be` (NestJS + Fastify) con
autenticación JWT y refresh tokens opacos.

## Stack

- Next.js 16 (App Router, Turbopack, Cache Components) + React 19.
- TypeScript estricto y Tailwind CSS 4.
- TanStack Query para estado del servidor.
- React Hook Form + Zod para formularios.
- `lucide-react` para iconografía y `date-fns`/`@date-fns/tz` para fechas.

## Requisitos

- Node.js 20+.
- El backend de Opria corriendo y accesible (por defecto
  `http://127.0.0.1:3001/v1`).

## Variables de entorno

Copiá `.env.example` a `.env.local` y ajustá la URL de la API:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/v1
```

`NEXT_PUBLIC_API_URL` se inyecta en tiempo de build. Si cambiás la URL, volvé a
compilar (`npm run build`) antes de `npm run start`. En desarrollo, `next dev`
la toma al arrancar.

> El backend solo permite los orígenes configurados en `CORS_ORIGINS`. Para
> desarrollo local, levantá el frontend en `http://localhost:3000`.

## Comandos

```bash
npm install
npm run dev      # desarrollo en http://localhost:3000
npm run lint     # ESLint (Next 16)
npm run build    # build de producción
npm run start    # servir el build (por defecto en :3000)
```

## Rutas

| Ruta               | Descripción                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `/`                | Landing pública; separa los accesos de negocio y de cliente.       |
| `/login`           | Inicio de sesión del negocio (panel).                              |
| `/registro`        | Registro de un negocio nuevo (abre la pestaña "Crear cuenta").     |
| `/cliente`         | Portal de clientes: buscador con filtros de ciudad y servicio.     |
| `/cliente/login`   | Inicio de sesión de la cuenta de cliente.                          |
| `/cliente/registro`| Registro de una cuenta de cliente.                                 |
| `/cliente/turnos`  | Turnos del cliente: próximos, historial y cancelación.             |
| `/dashboard`       | Resumen, métricas y checklist de puesta en marcha.                 |
| `/business`        | Perfil, contacto y políticas de reserva del tenant.                |
| `/services`        | Alta, edición y desactivación de servicios (precio, seña, buffer). |
| `/staff`           | Equipo: perfil, servicios asignados, horario semanal y bloqueos.   |
| `/availability`    | Slots reservables por servicio, fecha y profesional.               |
| `/agenda`          | Calendario mensual y agenda diaria; confirmar/rechazar turnos.     |
| `/cuenta`          | Datos de la cuenta, cambio de contraseña y cierre de sesión.       |
| `/reservar`        | Buscador público de negocios con filtros.                          |
| `/reservar/[slug]` | Reserva pública (invitado o cliente con sesión).                   |

Todas las rutas del panel viven en el grupo `(app)`, que exige sesión de
negocio. `/cliente/turnos` exige sesión de cliente. Son públicas `/`,
`/cliente`, `/cliente/login`, `/cliente/registro`, `/login`, `/registro` y
`/reservar/*`.

### Separación de accesos

- **Negocio**: `/login` (ingresar) y `/registro` (crear cuenta) llevan al panel.
  La landing enlaza "Negocios" y los CTAs "Empezar gratis" a estas rutas.
- **Cliente**: `/cliente` es el portal del cliente y enlaza al buscador. Con
  `/cliente/registro` y `/cliente/login` el cliente crea una cuenta, y
  `/cliente/turnos` lista sus reservas y permite cancelarlas. La reserva como
  invitado sigue disponible en el flujo público.
- El buscador público vive en `components/public/business-search.tsx` y se
  reutiliza en `/cliente` y `/reservar`. Permite buscar por nombre y filtrar por
  ciudad y servicio (`GET /public/businesses/filters`).

## Autenticación

Hay dos sesiones independientes que pueden convivir en el mismo navegador:

- **Negocio**: `localStorage` bajo `opria.auth.v1` (`lib/auth-storage.ts`).
- **Cliente**: `localStorage` bajo `opria.customer.v1`
  (`lib/customer-auth-storage.ts`).

Ninguna usa cookies ni SSR autenticado. `components/auth-provider.tsx`
(`useAuth`) y `components/customer-auth-provider.tsx` (`useCustomerAuth`)
exponen cada sesión con `useSyncExternalStore` sobre un store externo, para que
la hidratación sea estable y no dispare `setState` dentro de efectos.

`lib/api.ts` mantiene tres clientes separados:

- `api` (staff) usa `apiFetch` y nunca toma el token de cliente.
- `customerApi` usa `customerFetch` y nunca cae al token de negocio.
- `publicApi` no envía credenciales.

Ante un `401`, cada cliente refresca su token una sola vez (con deduplicación de
refreshes concurrentes) y reintenta. Si el refresh falla, limpia su sesión y
redirige a `/login` (negocio) o `/cliente/login` (cliente).

`/cuenta` permite cambiar la contraseña del negocio. La API revoca las demás
sesiones y conserva la actual, así el panel sigue funcionando sin volver a
ingresar.

## Cuentas de cliente

- `/cliente/registro` pide nombre, email, teléfono y contraseña
  (`POST /customer-auth/register`). El email es único y la contraseña se guarda
  con Argon2.
- `/cliente/login` inicia sesión (`POST /customer-auth/login`). El token de
  cliente lleva el claim `typ: 'customer'`: el panel de negocio lo rechaza y el
  área de cliente rechaza tokens de staff.
- `/cliente/turnos` vive bajo un guard de cliente
  (`app/cliente/turnos/customer-guard.tsx`) y lista los turnos de la cuenta con
  datos del negocio. Separa próximos de historial y muestra "Cancelar turno"
  solo cuando `canCancel` es verdadero.
- La cancelación respeta `cancellationHours` del negocio: dentro de la ventana
  la API responde `409` y la UI muestra el motivo.
- Al reservar con sesión iniciada, `/reservar/[slug]` precarga nombre, teléfono
  y email desde la cuenta y usa `POST /customer/appointments`, que vincula el
  turno a `customer_id`. La reserva de invitado sigue usando
  `POST /public/businesses/:slug/appointments`.
- Los turnos viejos de invitado no se vinculan retroactivamente por email.

## Contratos de la API

El cliente (`lib/api.ts`) cubre:

- `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`,
  `/auth/change-password`.
- `GET|PATCH /business`.
- `GET|POST /services`, `PATCH|DELETE /services/:id`.
- `GET|POST /staff`, `PATCH|DELETE /staff/:id`.
- `PUT /staff/:id/services`.
- `GET|PUT /staff/:id/working-hours`.
- `GET|POST /staff/:id/time-blocks`, `DELETE /staff/:id/time-blocks/:blockId`.
- `GET /availability?serviceId=&date=YYYY-MM-DD&staffId=`.
- `GET /appointments?from=&to=&status=&staffId=&serviceId=&limit=`.
- `PATCH /appointments/:id/status` (confirmar, rechazar, completar, etc.;
  acepta un `reason` opcional).

`publicApi` (sin credenciales) cubre el flujo público:

- `GET /public/businesses?q=&city=&service=`.
- `GET /public/businesses/filters` (ciudades y servicios disponibles).
- `GET /public/businesses/:slug`.
- `GET /public/businesses/:slug/calendar?serviceId=&from=&to=`.
- `GET /public/businesses/:slug/availability?serviceId=&date=`.
- `POST /public/businesses/:slug/appointments` (reserva de invitado).

`customerApi` (token de cliente) cubre la cuenta:

- `POST /customer-auth/register`, `/customer-auth/login`,
  `/customer-auth/refresh`, `/customer-auth/logout`.
- `GET /customer-auth/me`.
- `GET /customer/appointments?limit=`.
- `POST /customer/appointments`.
- `POST /customer/appointments/:id/cancel`.

Los errores de la API llegan como Problem Details (RFC 9457) y se exponen con
`ApiError` (`status`, `detail`, `errors[]`).

## Turnos y agenda

- `/agenda` combina un calendario mensual (días con turnos pendientes o
  confirmados) con la agenda diaria. Click en un día → lista de turnos; click en
  un turno → modal con detalle y acciones.
- Estados: `pending`, `confirmed`, `rejected`, `cancelled`, `completed` y
  `no_show`. Las acciones disponibles salen de `lib/appointments.ts`
  (`APPOINTMENT_ACTIONS`); el backend valida la transición igual.
- Un turno `pending` o `confirmed` bloquea el horario. Rechazar un `pending` lo
  libera y el slot vuelve a aparecer en `/reservar`.
- Las etiquetas, tonos y agrupación por día viven en `lib/appointments.ts`; no
  dupliques esos mapas en las páginas.
- El badge de pendientes del shell (`components/shell.tsx`) se actualiza al
  confirmar o rechazar (`invalidateQueries` de `appointments`).

## Reserva pública

- `/reservar` busca negocios por nombre (mínimo 2 caracteres) y permite filtrar
  por ciudad y servicio sin escribir nada.
- `/reservar/[slug]` muestra perfil, servicios, calendario de días con
  disponibilidad, slots del día y el formulario de reserva.
- Como invitado se piden nombre, teléfono, email opcional y notas. Con sesión de
  cliente iniciada, los datos salen de la cuenta y el turno se vincula a ella.
- Al enviar, el turno queda `pending` y se muestra la pantalla de confirmación
  con la seña informativa. No hay pago online.
- El flujo público no permite elegir profesional: el backend asigna el primero
  libre.

## Convenciones de datos

- El dinero se envía y recibe en **centavos** (`priceCents`, `depositValue`).
  En la UI se muestra y edita en pesos (`lib/utils.ts`).
- Las horas de los horarios semanales son `HH:MM` en la timezone del negocio.
- Los bloqueos viajan como ISO 8601 con offset; el formulario usa
  `datetime-local` y convierte con la timezone del tenant.
- La fecha de disponibilidad es un día de calendario (`YYYY-MM-DD`) en la
  timezone del negocio; los slots de la respuesta son instantes UTC y se
  muestran en la timezone del negocio.
- Los servicios y el staff usan soft delete: "desactivar" pone `active=false`.

## Notas de desarrollo

- Usá `npm.cmd` en Windows/PowerShell si los shims `.ps1` están bloqueados.
- No uses `new Date()` durante el render de un Client Component: con Cache
  Components rompe el prerender. Inicializá fechas en un efecto o en un
  handler, o usá estado derivado.
- Evitá `setState` directo dentro de `useEffect`; la regla
  `react-hooks/set-state-in-effect` de Next 16 lo marca. Preferí estado
  derivado o un store externo.
- `form.watch()` de React Hook Form dispara un warning de React Compiler
  (`react-hooks/incompatible-library`). Es esperado y no rompe el build.
- Next 16 valida que las navegaciones internas muestren UI instantánea
  (`instant`). El panel y `/cliente/turnos` son client-side (sesión en
  `localStorage`, datos después del montaje), así que no pueden cumplirla:
  `next.config.ts` usa
  `experimental.instantInsights.validationLevel: 'manual-warning'`,
  `app/(app)/layout.tsx` y `app/cliente/turnos/layout.tsx` declaran
  `instant = false`. Solo las rutas que optan explícitamente se validan
  (`/cliente`, `/cliente/login`, `/cliente/registro`, `/login`, `/registro`,
  `/reservar`, `/reservar/[slug]`). La landing (`app/page.tsx`) es Client
  Component y no puede exportar `instant`; tampoco se valida.

## Deploy

El build es estático/cliente y puede hostearse en cualquier plataforma que
sirva Next.js (Vercel, Netlify, etc.). Configurá `NEXT_PUBLIC_API_URL` con la
URL pública del backend antes de compilar.
