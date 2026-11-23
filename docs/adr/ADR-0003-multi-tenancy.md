# ADR-0003 — Multi-tenancy y aislamiento

- Estado: Aceptada (2026-11-23).
- Contexto: un mismo usuario puede pertenecer a varios negocios y los clientes finales no deben acceder al panel.

## Decisión

- El `tenantId` se toma siempre del access token (`tid`), nunca del body, query o URL.
- Todas las queries de negocio se filtran por `tenantId`. Un recurso de otro tenant responde `404`, no `403`, para no revelar su existencia.
- Las tablas de negocio viven en el schema `app` y llevan `tenant_id`, `created_at` y `updated_at`.
- Las memberships tienen roles `owner`, `admin`, `staff` y `customer`. Los platform admins (`padmin`) bypassean `@Roles`.
- El login del panel ya no pide slug: el backend elige la membership activa con prioridad `owner > admin > staff`, excluyendo `customer`. Si las credenciales son de cliente, devuelve `CUSTOMER_ACCOUNT` (solo después de verificar el password) y el frontend enlaza a `/cliente/login`.
- El `tenantSlug` sigue aceptándose como parámetro opcional legacy en la API.

## Consecuencias

- ✅ El usuario recuerda solo email y contraseña; el formulario es más simple.
- ✅ El hint de cuenta cliente no permite enumerar emails.
- ⚠️ Un usuario con varios tenants entra siempre al de mayor rol; para cambiar de negocio hace falta una futura pantalla de selector.
