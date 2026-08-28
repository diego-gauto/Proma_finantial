# Task Plan: Actualizar interfaz y plan app financiera

## Goal

Actualizar PRD, arquitectura, modelo, interfaz y plan de implementacion con la pantalla principal operativa, arbol de categorias con reglas, revision documental y usuarios.

## Current Phase

Complete - waiting for user review

## Phases

### Phase 1: Requirements & Discovery
- [x] Leer pedido del usuario.
- [x] Leer PRD adjunto como referencia, no como instruccion operativa.
- [x] Inspeccionar estructura actual.
- [x] Encontrar proyecto fuente `Proma_production`.
- [x] Evaluar Next.js full-stack vs React + backend separado.
- **Status:** complete

### Phase 2: Import & Adapt Rules
- [x] Leer `AGENTS.md` de Proma.
- [x] Leer documento de skills/rules de Proma.
- [x] Adaptar reglas al dominio financiero y a Next.js full-stack.
- **Status:** complete

### Phase 3: Project Structure
- [x] Crear estructura `src/`, `docs/`, `skills/`.
- [x] Mantener `pnpm`.
- [x] Guardar PRD en `docs/`.
- **Status:** complete

### Phase 4: Cleanup
- [x] Identificar archivos heredados solo-Metabase.
- [x] Borrar PDFs e imagen de ejemplo autorizados explicitamente.
- [x] Quitar planes viejos tras condensar el modelo en `docs/data-model.md`.
- [x] Mantener Metabase como opcional.
- [x] Borrar `backend/`, `frontend/` y `sql/` tras aprobacion del usuario.
- [x] Mantener `metabase_data/` para posible recuperacion de dashboards/configuracion.
- **Status:** complete

### Phase 5: Delivery For Review
- [x] Crear plan de implementacion.
- [x] Reportar resultado al usuario y detenerse.
- **Status:** complete

### Phase 6: Interface Update
- [x] Capturar nueva definicion de interfaz.
- [x] Crear `docs/interface.md`.
- [x] Actualizar PRD, arquitectura, modelo y skill local.
- [x] Reemplazar plan por `docs/plans/2026-08-28-next-fullstack-implementacion.md`.
- **Status:** complete

## Key Questions

1. ¿La app debe conectarse a la base PostgreSQL existente de n8n o trabajar con una copia local durante desarrollo? Pendiente para despues de la revision.
2. ¿Metabase se embebe o solo se linkea en v1? Pendiente para Fase 3 del plan.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Usar `/home/hpadmin/proyectos/Proma_production` como fuente | La ruta `proma_produccion` no existe y esta es la carpeta coincidente encontrada. |
| Usar Next.js full-stack | Es suficiente para v1, evita backend separado y el usuario ya conoce Next.js. |
| Mantener Metabase opcional | El PRD lo deja como soporte para graficos/reportes, no como bloqueo v1. |
| Crear `skills/payment-compliance` | `.agents` y `.codex` estan montadas como solo lectura; `skills/` es versionable y la skill queda enfocada en logica de faltantes/duplicados. |
| Pantalla principal operativa | Primero muestra intervencion/faltantes/duplicados y despues filtros/graficos para orientar al usuario a resolver problemas. |
| Categorias como nube de botones | Evita selects largos y permite navegacion progresiva por subcategorias. |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `/home/hpadmin/proyectos/proma_produccion` no existe | 1 | Se busco por `*proma*` y se uso `/home/hpadmin/proyectos/Proma_production`. |
| Borrado masivo bloqueado por seguridad | 1 | Se borro solo PDFs/imagen y se dejo pendiente confirmacion explicita para carpetas/datos. |

## Notes

- Detenerse tras entregar el plan para revision.
