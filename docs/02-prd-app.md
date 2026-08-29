# PRD — App de control de pagos y comprobantes

## 1. Contexto

Los flujos de n8n (ver `01-base-datos-y-flujos-n8n.md`) detectan automáticamente comprobantes nuevos en Google Drive, los clasifican en un árbol de categorías derivado de la estructura de carpetas, y los guardan en una base PostgreSQL con tres tablas de negocio: `documents`, `category_nodes`, `payment_rules`, más `users` para autenticación.

Esta app es el consumidor de esos datos: la interfaz donde el gerente (y eventualmente otros usuarios que él agregue) revisa qué se pagó, qué falta, y qué está mal clasificado o dudoso.

**No es responsable de procesar documentos ni de leer Drive.** Eso ya lo hace n8n. La app solo lee/actualiza la base.

## 2. Usuarios y autenticación

- Login con mail y contraseña, tabla `users` propia.
- No hay multi-tenencia: **todos los usuarios autenticados ven exactamente la misma información.** No hay datos privados por usuario ni árboles de categorías distintos.
- Debe existir una pantalla o flujo simple para agregar nuevos usuarios (alta de mail + contraseña), pensada para que el gerente pueda dar acceso a alguien más (ej. un contador) sin intervención técnica. No hace falta un sistema de roles/permisos diferenciados en esta primera versión — todos los usuarios autenticados tienen el mismo nivel de acceso.

## 3. Objetivos del producto (v1)

1. Ver el listado de documentos procesados, con sus datos extraídos, filtrable y buscable.
2. Navegar el árbol de categorías y ver los documentos de cada nodo (incluyendo sus descendientes).
3. Ver qué documentos quedaron en `review_required` o `error` y poder corregirlos a mano.
4. Configurar las reglas de pago (`payment_rules`) por nodo del árbol.
5. Ver los **faltantes** (períodos fiscales esperados sin comprobante) y los **duplicados** (más de un comprobante para el mismo nodo/regla/período).
6. Separar claramente, en toda la interfaz donde aplique, el filtro por **período fiscal** del filtro por **mes de pago** — son conceptos distintos y no deben mezclarse en un solo selector.
7. Tener una pantalla principal operativa que combine alertas, revisión pendiente, faltantes, duplicados, vencidos, próximos pagos, filtros y gráficos.

## 4. Funcionalidades

### 4.1 Listado de documentos

- Tabla/lista con: fecha de pago, período fiscal (formateado como `2026-01` o `2025` según `fiscal_period_kind`), categoría (breadcrumb del árbol, ej. `Servicios > Telefonia fija > Cuenta 032`), motivo, monto, moneda, estado de procesamiento, link a Drive.
- Filtros: por rango de fecha de pago, por período fiscal (año / año+mes), por categoría (incluye descendientes), por estado (`processed`, `review_required`, `error`), por texto libre (motivo, referencia, emisor).
- Cada fila permite abrir el detalle del documento.

### 4.2 Detalle de documento

- Muestra todos los campos de `documents`, incluyendo `raw_text` (colapsado, para auditar la extracción) y `extracted_data`.
- Si el estado es `review_required` o `error`, permite editar manualmente los campos y, al guardar, cambiar el estado a `processed` (confirmación humana).
- Nunca permite editar `category_node_id` libremente sin dejar rastro — si el gerente necesita re-clasificar un documento a mano (caso excepcional, ya que la categoría normalmente viene de la carpeta), debe quedar claro en la interfaz que es una corrección manual.
- Link directo a `drive_url` para abrir el original.
- Para revisión, la pantalla debe mostrar el documento en una mitad y el formulario de datos en la otra. Los campos faltantes o dudosos deben tener aviso visual. Los campos con valores predefinidos deben usar select.

### 4.3 Árbol de categorías

- Vista jerárquica navegable (expandir/colapsar nodos).
- Por nodo: cantidad de documentos, link a ver esos documentos filtrados.
- Edición manual de `sort_order` (orden visual) y `active` (ocultar categoría sin borrar histórico).
- El árbol se puebla solo desde n8n (ver documento 01) — la app no necesita un flujo de alta manual de categorías como camino principal, pero conviene permitir renombrar un nodo o corregir `parent_id` a mano para casos excepcionales (ej. una carpeta se movió en Drive).
- Al entrar a un nodo, debe poder configurarse la regla de pago de esa categoría: periodicidad, fecha probable de pago, tolerancia, aviso previo, vigencia y notas.

### 4.4 Reglas de pago (`payment_rules`)

- CRUD completo sobre `payment_rules`.
- Formulario que refleje los campos del modelo: nodo asociado, `applies_to_descendants`, `interval_months` (con las etiquetas mensual/bimestral/trimestral/cuatrimestral/semestral/anual) o `custom_period_months`, `fiscal_period_kind`, `payment_month`, `payment_day`, offsets, `active_from`/`active_to`, `grace_days`, `reminder_days_before`, `notes`.
- Al desactivar o cambiar una regla vigente, la app debe guiar al usuario a **cerrar la regla anterior (`active_to`) y crear una nueva**, en vez de editar `active_from`/`active_to` de la regla existente de forma que se pierda el histórico. Esto es importante: el cálculo de faltantes pasados depende de la regla vigente en cada período, no de la regla vigente hoy.

### 4.5 Faltantes y duplicados

Esta es la pantalla central del producto.

**Lógica de faltantes** (implementada como consulta, no como tabla — no se fabrican registros de pagos esperados):

1. Para cada nodo con una regla aplicable (propia, o heredada de un ancestro con `applies_to_descendants = true` si el nodo no tiene una propia — resolver primero la regla más específica), generar la serie de períodos fiscales esperados entre `active_from` y `active_to` (o hoy, si `active_to` es nulo), según `interval_months`/`custom_period_months`/`anchor_period_month`.
2. Para cada período esperado, usar la regla que estaba vigente **en ese período** (no la vigente hoy) si hubo más de una regla histórica para el nodo.
3. Buscar si existe un `documents` con `processing_status = 'processed'` para ese nodo y ese `fiscal_period_year`/`fiscal_period_month`/`fiscal_period_kind`.
4. Si no existe → **faltante**. Si existen dos o más → **duplicado**.
5. Aplicar `grace_days` antes de mostrar un período reciente como faltante (para no marcar en rojo algo que todavía está dentro del margen normal de pago).

**Vista:**

- Lista de faltantes agrupada por categoría, con el período esperado y desde cuándo está vencido (considerando `grace_days`).
- Lista de duplicados, agrupada igual, con link a los documentos involucrados.
- Filtro por rango de tiempo y por categoría.
- La pantalla principal debe mostrar primero una card compacta de posibles faltantes y debajo otra de posibles duplicados, antes de los gráficos.
- Además de faltantes generales, la app debe separar pagos vencidos no realizados y próximos pagos a abonar.

### 4.5.1 Pantalla principal y filtros

- Al entrar, si hay documentos con `review_required` o `error`, debe aparecer una alerta visible con acceso directo a revisión.
- Los filtros superiores incluyen período fiscal y categoría.
- La selección de categorías se hace mediante una nube de botones/chips, no mediante un select.
- Al elegir una categoría, aparecen sus subcategorías como nuevos botones seleccionables.
- Cada cambio de filtro recalcula faltantes, duplicados, gráficos, listados y estadísticas.

### 4.6 Gráficos y reportes

- La app debe mostrar gráficos operativos básicos en la pantalla principal.
- El primer gráfico es una torta con las categorías que componen el total de gastos filtrado.
- A la derecha de la torta debe mostrarse un listado de categorías con montos gastados, porcentaje del total y cantidad de pagos.
- Debajo, si hay período seleccionado, mostrar un gráfico por meses del período con importe gastado por mes.
- Debajo o junto al anterior, mostrar cantidad de pagos por mes.
- Los graficos de la pantalla principal se implementan en la app con **Recharts**.
- **Metabase** queda fuera del flujo principal por ahora y solo puede usarse como referencia visual o para reportes externos futuros.
- Los listados complejos de documentos se implementan con **TanStack Table** cuando necesiten orden, filtros, seleccion o paginacion.

## 5. Fuera de alcance en la v1

- Envío de notificaciones/alertas (mail, whatsapp, etc.) — se agrega cuando exista el sistema de envío. La pantalla de faltantes (4.5) es la base sobre la que después se conectan alertas, pero **no** se construye el envío ahora.
- Roles y permisos diferenciados entre usuarios.
- Multi-cliente / multi-empresa.
- Edición manual de `category_nodes` como flujo principal (la fuente de verdad es Drive vía n8n).
- Subida manual de documentos desde la app (el único punto de entrada de documentos es Drive + n8n).

## 6. Requisitos técnicos

- Backend con acceso directo a la base PostgreSQL ya definida en el documento 01. No se requiere que la app tenga su propia copia de datos ni sincronización — lee/escribe directo sobre las mismas tablas que pueblan los flujos n8n.
- Autenticación propia (tabla `users`), sesión persistente, sin necesidad de SSO ni proveedores externos en esta versión.
- Stack no está fijado por este documento — queda a criterio del equipo/agente que construya la app, en función de lo que ya se use en el proyecto.
- Puede soportar que Metabase se conecte a la misma base en modo solo lectura para reportes futuros, sin conflicto con la app.

## 7. Fases sugeridas

1. **Fase 1**: autenticación inicial + shell interno + alerta de documentos a revisar.
2. **Fase 2**: pantalla principal con filtros por período/categoría, faltantes, duplicados y resumen por categorías.
3. **Fase 3**: listado/detalle de documentos + revisión manual en pantalla dividida.
4. **Fase 4**: árbol de categorías + reglas de pago por nodo.
5. **Fase 5**: usuarios, pagos vencidos, próximos pagos y reportes opcionales.
6. **Fase futura**: sistema de envío de alertas y notificaciones por mail/WhatsApp/otro canal. La v1 solo calcula y muestra avisos dentro de la app.
