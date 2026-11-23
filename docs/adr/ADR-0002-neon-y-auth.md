# ADR-0002 — Neon como base de datos y autenticación propia

- Estado: Aceptada (2026-11-23). Reemplaza el ADR original «Supabase = Postgres + Storage + auth propio».
- Contexto: el plan inicial usaba Supabase. Se adoptó Neon PostgreSQL 17 con connection string pooled; no se usa Storage ni Supabase Auth.

## Decisión

- `DATABASE_URL` apunta al pooler de Neon en dev y prod (misma base). `DatabaseService` desactiva prepared statements cuando detecta el sufijo `-pooler`, porque PgBouncer en modo transacción no los soporta.
- `DATABASE_URL_DIRECT` (sin pooler) se usa solo para migraciones con `drizzle-kit`.
- Auth propia: Argon2id para passwords, JWT HS256 de acceso y refresh tokens opacos hasheados con SHA-256 y rotados por familia.
- Dos realms separados: `users` (staff del negocio, token con `tid`/`role`) y `customers` (clientes finales, token con `typ: 'customer'`). Un token nunca sirve para el otro lado.

## Consecuencias

- ✅ No hace falta Docker para desarrollar: dev y prod comparten datos reales.
- ⚠️ Hay que tener cuidado con datos de prueba: los e2e con base usan sufijos únicos y limpian después.
- ⚠️ Cambiar la URL requiere actualizar los secretos de Render y GitHub Actions, no solo `.env`.
