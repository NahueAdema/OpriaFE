# ADR-0004 — ORM, migraciones y convenciones de datos

- Estado: Aceptada (2026-11-23).
- Contexto: se necesita un esquema versionado, seguro para multi-tenant y consistente entre API y UI.

## Decisión

- Drizzle ORM con `postgres.js`; el esquema se edita en `src/database/schema/` y las migraciones se generan con `npm run db:generate` y se commitean en `drizzle/`.
- Los import relativos del backend llevan extensión `.js` (ESM `nodenext`).
- Validación en el borde con Zod (`@ZodBody`, `@ZodQuery`, `@ZodParam`) y errores RFC 9457 Problem Details.
- Dinero en centavos en la base y en la API; el frontend convierte a pesos solo en formularios.
- Servicios y staff usan soft delete (`active=false`).
- Horarios semanales: `weekday` ISO (1 = lunes, 7 = domingo) y horas `HH:MM` en la timezone del tenant. Bloqueos: ISO 8601 con offset.
- Anti-doble-reserva: constraint de exclusión Postgres `appointments_no_overlap` más advisory lock por staff; no se reemplaza por chequeos en memoria.

## Consecuencias

- ✅ El esquema y las migraciones viajan juntos en el mismo commit.
- ✅ El motor de disponibilidad es una función pura con tests, sin acceso a la base.
- ⚠️ No editar migraciones ya aplicadas: siempre generar una nueva.
