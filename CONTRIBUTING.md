# Contribuir al frontend

## Setup

```bash
npm install
npm run dev     # http://localhost:3000
```

`next dev` fuerza la API local `http://127.0.0.1:3001/v1`, aunque haya un `.env.local` viejo apuntando a producción. Para producción, `NEXT_PUBLIC_API_URL` se inyecta en tiempo de build.

En Windows/PowerShell usá `npm.cmd` si los shims `.ps1` están bloqueados.

## Antes de abrir un PR

```bash
npm run lint
npm run build
```

Los warnings de `react-hooks/incompatible-library` por `form.watch()` son esperados. No hay que commitear `next-env.d.ts` ni `AGENTS.md` generado por Next: si aparecen en el diff, se incluyen para mantener el árbol limpio.

## Commits y hooks

Los hooks de Husky corren `lint-staged` (ESLint sobre `.ts/.tsx`) y validan el mensaje con commitlint. Usá mensajes convencionales en español:

```
feat: agregar filtro por estado en la agenda
fix: dev usa la API local aunque haya ENV de prod
docs: aclarar el flujo de login sin slug
chore: actualizar dependencias
```

## Convenciones de UI

- Textos en español rioplatense.
- Reutilizá `components/ui.tsx` y las clases del sistema visual en `app/globals.css`; no agregues librerías de UI.
- Errores con `ErrorBanner`, confirmaciones con `SuccessBanner`.
- No mezcles sesiones de negocio y cliente: `api`, `customerApi` y `publicApi` son clientes distintos.
- No uses `new Date()` en el render de Client Components (rompe el prerender con Cache Components).

## Plantillas

Usá las plantillas de `.github/ISSUE_TEMPLATE/` y la de PR. El estado general del proyecto vive en `Tareas.md` en la raíz del workspace.
