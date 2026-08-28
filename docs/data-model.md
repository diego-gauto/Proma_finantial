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
- `fiscal_period_kind`: `month`, `year` o `unknown`
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

La app muestra el periodo fiscal como valor derivado:

- `YYYY-MM` cuando `fiscal_period_kind = 'month'` y existe `fiscal_period_month`.
- `YYYY` cuando `fiscal_period_kind = 'year'` o no existe mes.

No existe una columna fisica `documents.fiscal_period` en la base real; los filtros y calculos deben usar `fiscal_period_year`, `fiscal_period_month` y `fiscal_period_kind`.

### `category_nodes`

Arbol autorreferenciado de categorias de profundidad variable.

Campos principales:

- `id`
- `parent_id`: `bigint`, referencia a `category_nodes.id`
- `name`
- `active`
- `sort_order`
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

Los faltantes se calculan al consultar. No se crea `expected_payments` en v1.

En TypeScript la app puede mapear `interval_months` a etiquetas de UI/servicio (`monthly`, `bimonthly`, `quarterly`, `four_monthly`, `semiannual`, `annual`, `custom`, `no_pattern`), pero la columna real en PostgreSQL es `interval_months`, no `cadence`.

Estas reglas tambien alimentan:

- pagos vencidos no realizados;
- proximos pagos a abonar;
- avisos anticipados configurables.

### `users`

Usuarios autenticados con mail y password.

No hay roles diferenciados en v1. Todos los usuarios autenticados ven la misma informacion.

Al inicio se crea un unico usuario inicial con mail y password. Luego la app debe permitir agregar mas usuarios desde pantalla propia.

## Reglas de calculo

- Periodo fiscal y mes/fecha de pago son conceptos distintos.
- Una regla propia del nodo gana sobre una regla heredada de un ancestro.
- Las reglas historicas deben respetarse por periodo usando `active_from` y `active_to`.
- `grace_days` evita marcar como faltante algo que todavia esta dentro del margen normal.
- Duplicado: dos o mas documentos `processed` para el mismo nodo y periodo fiscal.
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
