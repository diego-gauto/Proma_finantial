# Modelo de datos inicial

Este documento condensa lo util de los planes exploratorios anteriores. La decision actual es mantener un modelo simple para v1: un documento procesado representa un pago real, por lo que no se crea una tabla separada `payments` al inicio.

## Tablas principales

### `documents`

Comprobantes reales ya procesados por n8n.

Campos principales:

- `id`
- `drive_file_id`
- `drive_url`
- `file_name`
- `drive_path`
- `category_node_id`: `bigint`, referencia a `category_nodes.id`
- `payment_date`
- `payment_time`
- `fiscal_period_year`
- `fiscal_period_month`
- `covered_fiscal_months`: `integer[]`, meses fiscales cubiertos por el comprobante dentro de `fiscal_period_year`
- `fiscal_period_kind`: `month`, `year` o `unknown`
- `content_hash`: hash normalizado usado para identificar comprobantes repetidos por contenido.
- `content_hash_algorithm`: algoritmo/fuente del hash (`sha256` o `drive_md5`).
- `drive_md5_checksum`: checksum MD5 informado por Google Drive cuando esta disponible.
- `drive_parent_id`: carpeta padre actual en Drive, para detectar movimientos.
- `active`: indica si el comprobante sigue vigente dentro del alcance operativo.
- `removed_at`
- `removed_reason`: `trashed`, `moved_out_of_scope`, `duplicate_discarded` o `manual`.
- `duplicate_of_document_id`: referencia opcional al documento original cuando un archivo se marca como duplicado exacto.
- `review_reason`: motivo operativo de revision, por ejemplo duplicado exacto o restitucion dudosa.
- `last_seen_at`: ultima vez que un flujo de sincronizacion vio el archivo.
- `amount`
- `currency`
- `reason`
- `reference`
- `issuer`
- `payee`
- `user_note`
- `raw_text`
- `extracted_data`
- `processing_status`: `pending`, `processed`, `review_required`, `error`
- `processing_error`
- `created_at`
- `updated_at`

`drive_url` abre el comprobante. `drive_path` conserva la ruta original de Drive para auditoria. La categoria canonica es `category_node_id`, no la ruta en texto.

`drive_file_id` identifica la instancia actual del archivo en Google Drive. `content_hash` identifica el contenido del comprobante y es la referencia principal para detectar re-subidas, copias o duplicados exactos. Como hay documentos historicos cargados antes de tener SHA256 real, `content_hash_algorithm = 'drive_md5'` indica que el valor fue backfilleado desde `md5Checksum`.

La app muestra el periodo fiscal como valor derivado:

- `YYYY-MM` cuando `fiscal_period_kind = 'month'` y existe `fiscal_period_month`.
- `YYYY` cuando `fiscal_period_kind = 'year'` o no existe mes.

No existe una columna fisica `documents.fiscal_period` en la base real; los filtros y calculos deben usar `fiscal_period_year`, `fiscal_period_month`, `covered_fiscal_months` y `fiscal_period_kind`.

Para comprobantes normales, `covered_fiscal_months` tiene un unico valor, por ejemplo `{5}`. Para comprobantes que agrupan varios periodos del mismo anio fiscal, guarda todos los meses cubiertos, por ejemplo `{4,5}`. `fiscal_period_month` se mantiene como periodo principal del documento para compatibilidad y visualizacion.

### `category_nodes`

Arbol autorreferenciado de categorias de profundidad variable.

Campos principales:

- `id`
- `parent_id`: `bigint`, referencia a `category_nodes.id`
- `name`
- `active`
- `sort_order`
- `drive_folder_id`: id de carpeta Drive asociado cuando la categoria se origina en una carpeta conocida.
- `created_at`
- `updated_at`

No se usa tabla `closure` al inicio. Para el tamanio esperado del arbol, una consulta recursiva de PostgreSQL alcanza.

### `payment_rules`

Reglas que indican que periodos fiscales se esperan para una categoria.

Campos principales:

- `id`
- `category_node_id`: `bigint`, referencia a `category_nodes.id`
- `applies_to_descendants`
- `name`
- `interval_months`: `1`, `2`, `3`, `4`, `6`, `12` o nulo para patron custom/sin patron
- `custom_period_months`
- `anchor_period_month`
- `fiscal_period_kind`
- `payment_month`
- `payment_day`
- `payment_year_offset`
- `payment_month_offset`
- `active_from`
- `active_to`
- `grace_days`
- `reminder_days_before`
- `active`
- `notes`
- `updated_at`

Los faltantes se calculan al consultar. No se crea `expected_payments` en v1.

En TypeScript la app puede mapear `interval_months` a etiquetas de UI/servicio (`monthly`, `bimonthly`, `quarterly`, `four_monthly`, `semiannual`, `annual`, `custom`, `no_pattern`), pero la columna real en PostgreSQL es `interval_months`, no `cadence`.

Estas reglas tambien alimentan:

- pagos vencidos no realizados;
- proximos pagos a abonar;
- avisos anticipados configurables.

Una regla sin patron (`interval_months is null` y `custom_period_months is null`) representa una decision explicita de no controlar esa categoria. Esa regla no genera faltantes, vencidos ni proximos pagos, y tambien bloquea una regla heredada desde un ancestro.

Para la interfaz, los campos tecnicos se traducen a opciones operativas:

- bimestral par/impar usa `interval_months = 2` y `anchor_period_month = 2` o `1`;
- pago al mes siguiente usa `payment_month_offset = 1`;
- pago anual en un mes del anio siguiente usa `fiscal_period_kind = 'year'`, `payment_month` y `payment_year_offset = 1`;
- `active_to` se completa automaticamente cuando se crea una nueva regla vigente para la misma categoria.

### `drive_items`

Inventario tecnico de archivos y carpetas vistos por los flujos de sincronizacion de Drive. No representa pagos; sirve para comparar estado anterior contra eventos nuevos.

Campos principales:

- `drive_id`: id real del item en Google Drive.
- `name`
- `mime_type`
- `item_type`: `file` o `folder`
- `parent_drive_id`
- `drive_path`
- `within_root`: indica si el item sigue dentro de la carpeta raiz controlada.
- `trashed`
- `modified_time`
- `md5_checksum`
- `content_hash`
- `content_hash_algorithm`
- `web_view_link`
- `size_bytes`
- `category_node_id`: referencia opcional a `category_nodes.id`.
- `first_seen_at`
- `last_seen_at`
- `last_event_type`
- `raw_metadata`

`documents.drive_item_id` referencia a `drive_items.drive_id`. Esto separa el archivo fisico de los documentos logicos: en patentes, un mismo `drive_item_id` puede alimentar varias filas de `documents` con sufijos logicos en `drive_file_id`.

### `drive_change_events`

Registro tecnico de eventos procesados o pendientes de revision por el listener de Drive.

Campos principales:

- `id`
- `drive_id`
- `change_id`
- `event_type`: `created`, `renamed`, `moved`, `trashed`, `restored`, `removed_from_scope`, `duplicate_candidate`, `metadata_changed` o `reconciled`.
- `item_type`
- `old_parent_drive_id`
- `new_parent_drive_id`
- `old_drive_path`
- `new_drive_path`
- `old_name`
- `new_name`
- `content_hash`
- `related_document_id`
- `review_required`
- `review_reason`
- `processed_at`
- `created_at`
- `raw_change`

### `drive_sync_state`

Cursor y estado de ejecucion por alcance de sincronizacion.

Campos principales:

- `scope`: por ejemplo `documents_root`.
- `root_folder_id`
- `start_page_token`
- `last_change_id`
- `last_successful_sync_at`
- `last_error_at`
- `last_error`
- `watch_channel_id`
- `watch_resource_id`
- `watch_expiration_at`
- `watch_token`
- `webhook_url`
- `last_webhook_at`
- `last_webhook_message_number`
- `updated_at`

### `drive_webhook_notifications`

Registro tecnico de las push notifications recibidas desde Google Drive. No
representa un archivo ni una carpeta: solo indica que Drive notifico cambios
para el canal registrado. El workflow incremental luego consulta `changes.list`
y registra los eventos concretos en `drive_change_events`.

Campos principales:

- `id`
- `scope`
- `channel_id`
- `channel_token_present`
- `resource_id`
- `resource_uri`
- `resource_state`
- `message_number`
- `changed`
- `channel_expiration`
- `received_at`
- `forwarded_at`
- `forward_status`
- `forward_error`
- `raw_headers`

### `users`

Usuarios autenticados con mail y password.

No hay roles diferenciados en v1. Todos los usuarios autenticados ven la misma informacion.

Al inicio se crea un unico usuario inicial con mail y password. Luego la app debe permitir agregar mas usuarios desde pantalla propia.

## Reglas de calculo

- Periodo fiscal y mes/fecha de pago son conceptos distintos.
- Una regla propia del nodo gana sobre una regla heredada de un ancestro.
- Las reglas historicas deben respetarse por periodo usando `active_from` y `active_to`.
- `grace_days` evita marcar como faltante algo que todavia esta dentro del margen normal.
- Duplicado: dos o mas documentos `processed` para el mismo nodo y periodo fiscal cubierto.
- Vencido: periodo esperado sin documento procesado cuya fecha probable de pago mas tolerancia ya paso.
- Proximo pago: periodo esperado sin documento procesado cuya fecha probable de pago esta dentro de la ventana de aviso configurada.

## Posibles extensiones futuras

No implementar al inicio:

- `payments` separado de `documents`.
- `expected_payments`.
- `payment_rule_exceptions`.
- `category_node_closure`.
- Alertas/notificaciones.

Estas tablas solo se agregan si aparece una necesidad real que el modelo simple no resuelva.
