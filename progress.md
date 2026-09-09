# Progress Log

## Session: 2026-09-02

### Phase 1: Discovery y pruebas rojas
- **Status:** complete
- Actions taken:
  - Leidas skills: `planning-with-files`, `test-driven-development`, `brainstorming`, `impeccable`, `payment-compliance`.
  - Leidos docs de producto requeridos por `AGENTS.md`.
  - Leidas guias locales de Next para pages/layouts, Server Actions, CSS Modules y forms.
  - Registrado plan actual en `task_plan.md` y hallazgos en `findings.md`.
  - Agregadas pruebas rojas para formulario simplificado y bloqueo de herencia con "Sin control".
  - Implementado parser nuevo, bloqueo de herencia, cierre automatico de regla abierta y UI simplificada.
  - Aplicado SQL `docs/sql/2026-09-02-payment-rules-constraints.sql` sobre PostgreSQL local.
- Files created/modified:
  - `task_plan.md`
  - `findings.md`
  - `progress.md`
  - `src/server/payment-rules/payment-rule-form.ts`
  - `src/server/payment-rules/payment-rule-form.test.ts`
  - `src/server/compliance/resolve-rule.ts`
  - `src/server/compliance/resolve-rule.test.ts`
  - `src/server/compliance/calculate-status.test.ts`
  - `src/db/payment-rules.repository.ts`
  - `src/app/(app)/categories/[id]/rules/actions.ts`
  - `src/app/(app)/categories/[id]/page.tsx`
  - `src/app/(app)/categories/[id]/page.module.css`
  - `src/components/payment-rules/PaymentRuleForm.tsx`
  - `src/components/payment-rules/PaymentRuleForm.module.css`
  - `src/components/payment-rules/PaymentRuleHistory.tsx`
  - `src/components/payment-rules/PaymentRuleHistory.module.css`
  - `docs/sql/2026-09-02-payment-rules-constraints.sql`
  - `docs/data-model.md`
  - `docs/interface.md`

## Test Results

| Test | Input | Expected | Actual | Status |
|---|---|---|---|---|
| Targeted red tests | `pnpm test src/server/payment-rules/payment-rule-form.test.ts src/server/compliance/resolve-rule.test.ts src/server/compliance/calculate-status.test.ts` | Fallas por comportamiento nuevo ausente | 5 fallas esperadas | RED |
| Targeted green tests | `pnpm test src/server/payment-rules/payment-rule-form.test.ts src/server/compliance/resolve-rule.test.ts src/server/compliance/calculate-status.test.ts` | Tests pasan | 22 passed | PASS |
| Full test suite | `pnpm test` | Tests pasan | 27 files, 97 passed | PASS |
| Production build | `pnpm build` | Build pasa | Next build OK | PASS |
| Lint | `pnpm run lint` | Sin errores | ESLint OK | PASS |
| Impeccable detector | `node /home/hpadmin/.agents/skills/impeccable/scripts/detect.mjs --json ...` | Sin hallazgos | `[]` | PASS |

## Error Log

| Timestamp | Error | Attempt | Resolution |
|---|---|---|---|
| 2026-09-02 | `pnpm run dev` en sandbox fallo con `listen EPERM 0.0.0.0:3000` | 1 | Se reintento con permiso elevado; ya existia server del proyecto en `http://localhost:3001`. |
| 2026-09-02 | `git diff` fallo porque el directorio no se reconoce como repo valido aunque existe `.git` montado | 1 | Se verifico con `git rev-parse`; se reporta como limitacion del entorno. |

## Session: 2026-09-04

### Route split for operational lists
- **Status:** complete
- Actions taken:
  - Leidas skills aplicables: `brainstorming`, `planning-with-files`, `test-driven-development`, `impeccable`, `payment-compliance`.
  - Leidos docs requeridos por `AGENTS.md` y guias locales de Next para rutas/CSS.
  - Agregado test rojo para helper de rangos de compliance.
  - Creado `src/server/dashboard/dashboard-compliance.ts` para reutilizar compliance filtrado y status mensual.
  - Se descarto `/compliance` por cambio de pedido: Faltantes/Duplicados quedan como pestania dentro de Inicio.
  - Creada ruta `/payment-status` para Proximos pagos y Vencidos del mes en curso.
  - Inicio ahora tiene pestanias `Estadisticas` y `Faltantes y duplicados` debajo de los filtros compartidos.
  - Los filtros preservan `tab=faltantes` cuando se cambia periodo fiscal o categoria.

## Test Results 2026-09-04

| Test | Result |
|---|---|
| `pnpm test -- src/server/dashboard/dashboard-filters.test.ts src/server/dashboard/dashboard-compliance.test.ts src/server/compliance/get-overdue-payments.test.ts src/server/compliance/get-upcoming-payments.test.ts src/server/dashboard/compliance-issue-view-model.test.ts` | PASS, 33 files / 132 tests |
| `pnpm build` | PASS |
| `pnpm run lint` | PASS |
| Impeccable detector sobre rutas/componentes modificados | PASS, `[]` |

## Session: 2026-09-06

### Drive inmediato - Phase 1 backfill carpetas
- **Status:** complete
- Actions taken:
  - Replanificado el enfoque a dos workflows operativos: manual inicial e incremental unico.
  - Creado workflow manual `proyecto1DriveFolderCategoryBackfill`.
  - Ejecutado el workflow contra Google Drive con n8n CLI usando puerto broker alternativo.
  - Poblado `drive_items` con carpetas Drive.
  - Poblado `category_nodes.drive_folder_id` para todas las categorias existentes.
- Results:
  - Carpetas en `drive_items`: 113.
  - Categorias mapeadas: 36 de 36.
  - Categorias apuntando a carpeta inexistente: 0.
  - `drive_folder_id` duplicados: 0.
  - Categorias de anio creadas por error: 0.
- Files created/modified:
  - `task_plan.md`
  - `progress.md`
  - `scripts/create-drive-folder-category-backfill-workflow.mjs`
  - `docs/n8n/2026-09-06-drive-folder-category-backfill-workflow.json`
  - `src/server/drive/drive-folder-category-backfill-workflow.test.ts`
  - `docs/audits/2026-09-06-drive-folder-category-backfill.md`

## Deploy VPS Promatex - 2026-09-09

### Phase 1: Inventario y nombres
- **Status:** complete
- Actions:
  - Leidos `AGENTS.md`, `docs/vps-deploy-drive-workflows.md`, PRD, arquitectura, modelo de datos, interfaz y plan vigente.
  - Definido prefijo pedido por usuario: `proma_finanzas`.
  - Actualizados `task_plan.md` y `findings.md` con etapa de deploy Promatex.
  - Inventariados contenedores/redes/bases/workflows existentes del VPS.
  - Confirmado que no existian recursos `proma_finanzas_*`.

### Phase 2: Base PostgreSQL
- **Status:** complete
- Actions:
  - Creado contenedor `proma_finanzas_postgres` con imagen `postgres:16`.
  - Creado volumen `proma_finanzas_postgres_data`.
  - Conectado el contenedor a `promatex_default` y `dokploy-network`.
  - Restaurado dump operativo local en base `proma_finanzas`.
  - Corregidas funciones/triggers omitidos por dump parcial por tablas.
  - Limpiado watch viejo de ngrok en `drive_sync_state`.
- Results:
  - Tablas operativas: 8.
  - `covered_fiscal_months` vacios: 0.
  - Conteos: 140 documents, 37 category_nodes, 13 payment_rules, 1 users, 245 drive_items, 38 drive_change_events, 1 drive_sync_state, 29 drive_webhook_notifications.

### Phase 3: Workflows n8n
- **Status:** complete
- Actions:
  - Generados exports temporales con nombres `Proma Finanzas - ...`.
  - Reemplazadas variables por prefijo `PROMA_FINANZAS_*`.
  - Reemplazado webhook incremental a `/webhook/proma-finanzas-drive-incremental-sync`.
  - Importados 4 workflows en n8n, todos inactivos.
- Results:
  - `promaFinanzasCargaInicial`: inactivo.
  - `promaFinanzasDriveFolderBackfill`: inactivo.
  - `promaFinanzasDriveWatchRenewal`: inactivo.
  - `promaFinanzasDriveIncrementalSync`: inactivo.

### Phase 4: Variables
- **Status:** complete
- Actions:
  - Generados secretos y snippets en `/root/proma_finanzas`.
  - Corregido `app.env` despues de detectar `DATABASE_URL` sin password por escape incorrecto.
- Results:
  - `/root/proma_finanzas/app.env` contiene variables para Dokploy/app.
  - `/root/proma_finanzas/n8n.env.snippet` contiene variables para agregar al contenedor n8n.

## Test Results 2026-09-06

| Test | Result |
|---|---|
| `pnpm test src/server/drive/drive-folder-category-backfill-workflow.test.ts` | PASS |

### Drive inmediato - Phase 2 webhook Next + watch Drive
- **Status:** complete
- Actions taken:
  - Creado parser/validador de headers Google Drive push.
  - Creado endpoint `POST /api/v1/drive/webhook`.
  - El endpoint valida canal/token/recurso, registra notificacion y llama al webhook de n8n si esta configurado.
  - Creada y aplicada migracion `docs/sql/2026-09-06-drive-watch-webhook.sql`.
  - Creado workflow auxiliar n8n `proyecto1DriveWatchRenewal` para registrar/renovar `changes.watch`.
  - Importado workflow auxiliar en n8n como inactivo, no archivado y con owner.
- Results:
  - `drive_sync_state` tiene 7 columnas nuevas de watch/webhook.
  - `drive_webhook_notifications` existe.
  - `documents_root` sigue presente en `drive_sync_state`.
  - `proyecto1DriveWatchRenewal`: active=0, isArchived=0, owner `workflow:owner`.
- Files created/modified:
  - `.env.example`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`
  - `docs/data-model.md`
  - `docs/sql/2026-09-06-drive-watch-webhook.sql`
  - `docs/n8n/2026-09-06-drive-watch-renewal-workflow.json`
  - `scripts/create-drive-watch-renewal-workflow.mjs`
  - `src/app/api/v1/drive/webhook/route.ts`
  - `src/server/auth/auth.test.ts`
  - `src/server/env.ts`
  - `src/server/env.test.ts`
  - `src/server/drive/drive-webhook.ts`
  - `src/server/drive/drive-webhook.test.ts`
  - `src/server/drive/drive-webhook-forwarder.ts`
  - `src/server/drive/drive-webhook.repository.ts`
  - `src/server/drive/drive-watch-renewal-workflow.test.ts`

## Test Results 2026-09-06 Phase 2

| Test | Result |
|---|---|
| `pnpm test src/server/drive/drive-webhook.test.ts` | RED esperado por modulo inexistente |
| `pnpm test src/server/env.test.ts` | RED esperado por variables Drive no parseadas |
| `pnpm test src/server/drive/drive-watch-renewal-workflow.test.ts` | RED esperado por export inexistente |
| `pnpm test src/server/env.test.ts src/server/drive/drive-webhook.test.ts` | PASS, 11 tests |
| `pnpm test src/server/drive/drive-watch-renewal-workflow.test.ts` | PASS |
| `pnpm run lint` | PASS |
| `pnpm build` | Primer intento fallo por tipo; segundo intento PASS |
| `pnpm test` | PASS, 37 files / 147 tests |
| `pnpm build` | PASS final |
| `pnpm run lint` | PASS final |

### Drive inmediato - Phase 3 incremental unico llamado por Next
- **Status:** complete
- Actions taken:
  - Modificado `proyecto1DriveIncrementalSync` para usar `Webhook Next`.
  - Eliminados del workflow incremental los nodos `Manual Trigger` y `Cada cinco minutos`.
  - Agregado nodo `Validar token Next` con bearer token obligatorio.
  - Regenerado export `docs/n8n/2026-09-06-drive-incremental-sync-workflow.json`.
  - Reimportado el workflow actualizado en n8n.
  - Verificado en n8n que no quedan cron/manual trigger y que el owner sigue correcto.
- Results:
  - `proyecto1DriveIncrementalSync`: active=0, isArchived=0.
  - Entrada n8n: webhook path `proyecto1-drive-incremental-sync`.
  - Token requerido: `N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN`.
  - Variables aun no configuradas en contenedor n8n: `N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN`, `GOOGLE_DRIVE_WEBHOOK_URL`, `GOOGLE_DRIVE_WEBHOOK_TOKEN`.
- Files created/modified:
  - `task_plan.md`
  - `progress.md`
  - `docs/audits/2026-09-06-drive-incremental-sync.md`
  - `docs/n8n/2026-09-06-drive-incremental-sync-workflow.json`
  - `scripts/create-drive-incremental-sync-workflow.mjs`
  - `src/server/drive/drive-incremental-sync-workflow.test.ts`

## Test Results 2026-09-07 Phase 3

| Test | Result |
|---|---|
| `pnpm test src/server/drive/drive-incremental-sync-workflow.test.ts` | RED esperado por estructura vieja con cron/manual |
| `pnpm test src/server/drive/drive-incremental-sync-workflow.test.ts` | RED esperado por token n8n no obligatorio |
| `pnpm test src/server/drive/drive-incremental-sync-workflow.test.ts` | PASS |
| `pnpm test` | PASS, 37 files / 147 tests |
| `pnpm run lint` | PASS |
| `pnpm build` | PASS |

### Drive inmediato - Phase 4 extraccion completa por archivo nuevo
- **Status:** complete
- Actions taken:
  - Exportado y versionado el workflow manual fuente `proyecto1FinDocs2026`.
  - Modificado `proyecto1DriveIncrementalSync` para reutilizar nodos de descarga, SHA256, PDF text, OCR/Vision, normalizacion y guardado.
  - Agregado SQL `Emitir archivos nuevos a extraer`, que toma cambios ya auditados y devuelve solo archivos creados no duplicados para extraccion.
  - Adaptado `Guardar documento extraido` para persistir `drive_item_id`, `drive_parent_id`, `active` y `last_seen_at`.
  - Ajustada deteccion de duplicados para comparar `content_hash` y `drive_md5_checksum` contra el MD5 informado por Drive.
  - Reimportado el workflow incremental actualizado en n8n.
  - Validado SQL real con transaccion `ROLLBACK`.
- Results:
  - Archivo nuevo simulado bajo carpeta conocida: sincronizo 1 cambio, emitio 1 archivo, guardo documento final `processed`, todo con rollback.
  - Registros residuales de prueba: 0 en `documents`, 0 en `drive_items`, 0 en `drive_change_events`.
  - `proyecto1DriveIncrementalSync`: active=0, isArchived=0, contiene 19 nodos incluyendo extraccion.
  - n8n tiene `OPENAI_FINANZAS_API_KEY`; faltan variables de webhook/watch para activar flujo real.
- Files created/modified:
  - `task_plan.md`
  - `progress.md`
  - `docs/audits/2026-09-06-drive-incremental-sync.md`
  - `docs/n8n/2026-09-06-drive-incremental-sync-workflow.json`
  - `docs/n8n/2026-09-07-manual-processing-workflow-source.json`
  - `scripts/create-drive-incremental-sync-workflow.mjs`
  - `src/server/drive/drive-incremental-sync-workflow.test.ts`

## Test Results 2026-09-07 Phase 4

| Test | Result |
|---|---|
| `pnpm test src/server/drive/drive-incremental-sync-workflow.test.ts` | RED esperado por cadena de extraccion ausente |
| `pnpm test src/server/drive/drive-incremental-sync-workflow.test.ts` | PASS |
| Prueba SQL transaccional con archivo Drive simulado | PASS con ROLLBACK |
| Verificacion de residuos SQL | PASS, 0 registros |
| `pnpm test` | PASS, 37 files / 147 tests |

### Drive inmediato - Phase 5 prueba real end-to-end
- **Status:** complete
- Actions taken:
  - Registrado watch real de Google Drive contra el endpoint Next publico via ngrok.
  - Activados `proyecto1DriveIncrementalSync` y `proyecto1DriveWatchRenewal` en n8n.
  - Corregido `webhookId` del incremental para que n8n publique `/webhook/proyecto1-drive-incremental-sync`.
  - Agregada compuerta `Hay archivos nuevos?` para que el incremental no intente descargar cuando `changes.list` viene vacio.
  - Ajustado fallback OCR/Vision incremental para no romper el workflow: guarda `review_required` con motivo OCR pendiente.
  - Ajustado normalizador incremental para conservar `content_hash`, `content_hash_algorithm` y `drive_md5_checksum` despues de `readPDF`.
  - Ajustado SQL incremental para archivo movido/renombrado y carpeta de categoria movida/renombrada.
  - Subido PDF real de prueba por Google Drive y procesado por push notification real.
  - Enviados a papelera los PDFs E2E temporales y verificado que quedaron inactivos.
  - Desactivados/despublicados los workflows temporales de upload/cleanup.
- Results:
  - Next acepto y forwardeo a n8n con `forward_status = 200`.
  - Incremental real termino `success`.
  - PDF real `04-05-26-e2e-...pdf` quedo con `fiscal_period_month = 5` y `covered_fiscal_months = {4,5}`.
  - El guardado final persistio `content_hash_algorithm = sha256` y `drive_md5_checksum`.
  - PDFs temporales E2E: `active_e2e = 0`, `trashed_e2e = 4`.
  - Workflows operativos finales: `proyecto1DriveIncrementalSync` y `proyecto1DriveWatchRenewal` activos; workflows E2E temporales inactivos.
- Files created/modified:
  - `task_plan.md`
  - `progress.md`
  - `docs/n8n/2026-09-06-drive-incremental-sync-workflow.json`
  - `scripts/create-drive-incremental-sync-workflow.mjs`
  - `src/server/drive/drive-incremental-sync-workflow.test.ts`

## Test Results 2026-09-07 Phase 5

| Test | Result |
|---|---|
| `pnpm test src/server/drive/drive-incremental-sync-workflow.test.ts` | RED esperado por `webhookId` ausente; luego PASS |
| `pnpm test src/server/drive/drive-incremental-sync-workflow.test.ts` | RED esperado por compuerta de archivos nuevos ausente; luego PASS |
| `pnpm test src/server/drive/drive-incremental-sync-workflow.test.ts` | RED esperado por perdida de hash despues de `readPDF`; luego PASS |
| Webhook Next -> n8n sin cambios pendientes | PASS, `forward_status=200`, ejecucion n8n `success` |
| Upload real PDF Drive -> push Google -> Next -> n8n -> documents | PASS |
| Trash real PDFs E2E -> push Google -> documents inactivos | PASS |
| `pnpm test` | PASS, 37 files / 148 tests |
| `pnpm build` | PASS |
