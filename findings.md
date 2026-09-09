# Findings & Decisions

## Current Findings

## Deploy VPS Promatex Findings

- Documento operativo localizado: `docs/vps-deploy-drive-workflows.md`.
- El prefijo final pedido por usuario es `proma_finanzas` para Indumentaria Promatex.
- Nombres finales:
  - Contenedor PostgreSQL: `proma_finanzas_postgres`.
  - Volumen PostgreSQL: `proma_finanzas_postgres_data`.
  - Base: `proma_finanzas`.
  - Usuario DB: `proma_finanzas_user`.
  - Credencial n8n PostgreSQL a crear/asignar: `Proma Finanzas - Postgres`.
  - Credencial n8n Google Drive a crear/asignar: `Proma Finanzas - Google Drive`.
  - Workflows n8n importados: `Proma Finanzas - Carga inicial`, `Proma Finanzas - Backfill carpetas Drive`, `Proma Finanzas - Renovar watch Drive`, `Proma Finanzas - Sync incremental Drive`.
- Mantener variables reales fuera del repo; solo documentar nombres en `.env.example` o archivos de deploy sin secretos.
- Base remota restaurada desde dump operativo local con conteos: 140 `documents`, 37 `category_nodes`, 13 `payment_rules`, 1 `users`, 245 `drive_items`, 38 `drive_change_events`, 1 `drive_sync_state`, 29 `drive_webhook_notifications`.
- Watch viejo de ngrok limpiado en `drive_sync_state`; conservar `root_folder_id = 1e7vaYaveNP85KyH0wpV6d_MELr60OREg`.
- Archivos de variables reales en VPS:
  - `/root/proma_finanzas/app.env`
  - `/root/proma_finanzas/n8n.env.snippet`
  - `/root/proma_finanzas/db.env`

- `category_nodes` real contiene `id`, `parent_id`, `name`, `active`, `sort_order`, `created_at`, `updated_at`. No necesita columnas nuevas para reglas de pago.
- `payment_rules` real ya contiene los campos necesarios para periodicidad, meses custom, ancla, pago relativo, pago anual fijo, vigencia, tolerancia, avisos y notas.
- La UI actual de `src/app/(app)/categories/[id]/page.tsx` mezcla resumen de categoria, reglas y documentos; para crear/ver historial de reglas eso agrega ruido.
- El formulario actual expone columnas tecnicas: `fiscal_period_kind`, `payment_month`, `payment_month_offset`, `payment_year_offset`, `active_to`.
- `resolveApplicableRule` hoy ignora reglas `no_pattern` antes de resolver herencia. Eso impide usar "Sin control" como bloqueo explicito de herencia.
- `getDueDate` ya puede expresar pagos al mes siguiente con `payment_month_offset` y pagos anuales en mes fijo con `payment_month` + `payment_year_offset`.

## Target Behavior

- "Sin control" debe ser una regla propia activa que bloquea reglas heredadas y no genera faltantes/proximos/vencidos.
- Mensual con pago mes siguiente: periodo enero vence/paga en febrero.
- Bimestral par con pago mes siguiente: febrero vence/paga en marzo; abril en mayo.
- Anual con pago abril del anio siguiente: periodo fiscal 2026 vence/paga en abril 2027.
- Categoria sin regla propia debe seguir heredando si un ancestro aplica a descendientes.

## UI Direction

- Un solo titulo de categoria.
- Boton volver arriba a la izquierda con flecha y hover.
- Sin boxes de metricas.
- Sin documentos en esta vista.
- Nueva regla arriba; historial de reglas abajo.
- Formulario esencial: nombre, periodicidad, bimestre par/impar o meses personalizados, vigente desde mes/anio, pago esperado, dia probable, tolerancia, avisar dias antes, aplicar a descendientes y notas.

## Drive Immediate Sync Findings

- El enfoque corregido usa dos workflows operativos: manual inicial e incremental unico.
- El backfill real de carpetas de Drive se ejecuto correctamente.
- `drive_items` ahora contiene 113 carpetas con `item_type = 'folder'`.
- `category_nodes.drive_folder_id` quedo poblado en 36 de 36 categorias existentes.
- No hay categorias apuntando a carpetas inexistentes.
- No hay `drive_folder_id` duplicados.
- No se crearon categorias de anio por error.
- Las carpetas de anio quedan como `drive_items` tecnicos con `category_node_id` heredado de la categoria padre, para poder clasificar archivos dentro de ellas.
- Google Drive push notification no trae el archivo cambiado; trae headers de canal/recurso/mensaje. El webhook de Next debe aceptar rapido y disparar el incremental que consulta `changes.list`.
- El endpoint inmediato queda en `/api/v1/drive/webhook`. Valida `channel_id`, `channel_token`, `resource_id` y `message_number`.
- Las notificaciones push se guardan en `drive_webhook_notifications`; los eventos reales de archivos/carpetas siguen viviendo en `drive_change_events`.
- La renovacion/registro de `changes.watch` queda como workflow auxiliar n8n `proyecto1DriveWatchRenewal`, porque n8n ya tiene OAuth Google Drive.
