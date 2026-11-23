# ADR-0001 — Stack y arquitectura

- Estado: Aceptada (2026-11-23). Reemplaza la idea original de monorepo pnpm + Turborepo.
- Contexto: el plan inicial proponía un monorepo. El proyecto se implementó como dos repos npm independientes con CI propia y deploys separados.

## Decisión

Mantener dos repositorios:

- `opriafe/`: Next.js 16 (App Router, Turbopack, Cache Components), React 19, TypeScript estricto, Tailwind CSS 4, TanStack Query, React Hook Form + Zod. Se publica en Netlify.
- `opria-be/`: NestJS 12 sobre Fastify 5, TypeScript ESM (`nodenext`), Zod 4, Drizzle ORM sobre PostgreSQL 17 (Neon). Se publica en Render.

GitHub Actions corre lint/typecheck/tests/build en cada repo y dispara los deploy hooks cuando las variables `*_DEPLOY_ENABLED` están en `true`. No hay código compartido entre repos; los contratos se documentan en los README y en OpenAPI.

## Consecuencias

- ✅ Ciclos de deploy independientes y CI simple (`npm ci` + scripts de cada repo).
- ✅ Cada repo tiene sus propias reglas de lint y hooks (`.husky/`).
- ⚠️ Cambios de contrato requieren coordinar los dos repos; por eso el backend versiona OpenAPI y el frontend documenta `lib/api.ts`.
- ⚠️ No hay paquetes compartidos: utilidades como fechas o dinero se duplican deliberadamente con tests en cada lado.
