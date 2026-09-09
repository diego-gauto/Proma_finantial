# Task Plan: Deploy VPS Promatex / proma_finanzas

## Goal

Llevar al VPS la app Next.js, la base PostgreSQL separada y los workflows n8n necesarios para Indumentaria Promatex, usando el prefijo `proma_finanzas` para separar todos los recursos de otros proyectos existentes.

## Current Phase

In progress

## Phases

### Phase 1: Inventario y nombres
- [ ] Revisar docs de deploy, schema local, workflows JSON y config de app.
- [ ] Revisar en VPS contenedores, redes Docker, n8n y PostgreSQL existentes.
- [ ] Definir nombres finales `proma_finanzas_*`.
- **Status:** in_progress

### Phase 2: Preparar artefactos versionables
- [ ] Ajustar nombres de workflows/variables/export si hace falta.
- [ ] Preparar compose/schema/scripts/env example para deploy sin secretos reales.
- [ ] Verificar build/tests locales relevantes.
- **Status:** pending

### Phase 3: Base PostgreSQL en VPS
- [ ] Crear contenedor/servicio PostgreSQL separado.
- [ ] Crear/restaurar schema y aplicar migraciones existentes.
- [ ] Verificar tablas, usuario/base y aislamiento.
- **Status:** pending

### Phase 4: App en Dokploy
- [ ] Crear/configurar app Dokploy o preparar repo/source esperado.
- [ ] Configurar variables de entorno reales en VPS/Dokploy.
- [ ] Verificar HTTPS/login/build/start.
- **Status:** pending

### Phase 5: n8n workflows
- [ ] Importar/renombrar workflows con prefijo Promatex.
- [ ] Revisar credenciales PostgreSQL/Drive y tokens.
- [ ] Activar incremental/renewal cuando el dominio real este listo.
- **Status:** pending

### Phase 6: Verificacion end-to-end
- [ ] Ejecutar backfill/carga inicial si corresponde.
- [ ] Registrar watch.
- [ ] Probar subida PDF y eventos Drive.
- **Status:** pending

## Decisions Made

| Decision | Rationale |
|---|---|
| Usar `proma_finanzas` | La empresa es Indumentaria Promatex y el prefijo separa recursos de otros proyectos. |
| Mantener PostgreSQL separado | Evita mezclar datos/volumen/credenciales con bases existentes del VPS. |
| Reusar n8n existente con nombres/credenciales separados | Es el enfoque previsto por `docs/vps-deploy-drive-workflows.md`. |

## Errors Encountered

| Error | Attempt | Resolution |
|---|---|---|
| `jq` intento leer exports n8n como objeto | Inventario de workflows | Los exports son arrays; usar `.[0]` al inspeccionar nombre/nodos. |
| Consulta Dokploy uso snake_case | Inventario de proyectos/apps | El schema usa camelCase con comillas, consultar `"projectId"`, `"applicationId"`, etc. |
| Consulta psql local escapo comillas como `\x27` | Inventario de schema | Usar SQL con comillas simples reales dentro del comando. |
| Shell expandio `DATABASE_URL` antes de cargar `.env.local` | Inventario de schema | Usar comillas simples exteriores para que bash interno cargue env primero. |
| Restore parcial omitio funciones PostgreSQL | Restaurar dump operativo en VPS | Crear `set_updated_at()` y `resolve_category_node()` explicitamente y verificar triggers. |
| Diseno anterior fragmentado en tres workflows | Etapas 5-7 previas | Reemplazado por workflow incremental unico y nuevo plan. |
| `psql -U postgres` fallo | Aplicar migracion etapa 2 | El contenedor usa rol `finanzas_user`; migracion aplicada con ese usuario. |
| Build fallo por tipo de forwarder | Primer `pnpm build` etapa 2 | Se amplio el tipo para representar fallos HTTP de n8n con status numerico. |
| n8n devolvia 404 al webhook incremental | Prueba real etapa 5 | Faltaba `webhookId` en el nodo Webhook; n8n registraba un path interno. |
| n8n devolvia 500 sin cambios pendientes | Prueba real etapa 5 | El Postgres node emitia `{ success: true }`; se agrego IF `Hay archivos nuevos?`. |
| El fallback OCR/Vision rompia el incremental | Prueba real etapa 5 | Se reemplazo en incremental por fallback deterministico que guarda `review_required`. |
| `readPDF` perdia metadata de hash | Prueba real etapa 5 | El normalizador incremental ahora mezcla metadata desde `Preparar metadata con hash`. |
