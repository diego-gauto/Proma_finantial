# Etapa corregida - Sync incremental unico de Drive

## Decision

El diseno operativo queda con dos workflows:

- `proyecto1FinDocs2026`: procesamiento inicial o reproceso manual masivo.
- `proyecto1DriveIncrementalSync`: escucha cambios incrementales de Google Drive y aplica la accion en la misma ejecucion.

Los workflows intermedios creados antes quedaron archivados en n8n:

- `proyecto1DriveListener`
- `proyecto1DriveEventProcessor`
- `proyecto1DriveSingleFileIntake`

## Workflow incremental

- ID n8n: `proyecto1DriveIncrementalSync`
- Nombre: `Proyecto 1 - Sync incremental Google Drive`
- Estado actual: inactivo hasta configurar variables de entorno y URL publica
- Export versionado: `docs/n8n/2026-09-06-drive-incremental-sync-workflow.json`

## Responsabilidad

El workflow incremental:

- recibe el disparo inmediato desde Next por webhook n8n
  `proyecto1-drive-incremental-sync`;
- valida `Authorization: Bearer <token>` contra
  `N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN`;
- inicializa `drive_sync_state.start_page_token` si todavia no existe;
- consulta `changes.list` de Google Drive cuando ya hay cursor;
- actualiza o inserta `drive_items`;
- registra auditoria en `drive_change_events`;
- crea un registro inicial para archivos nuevos reales y luego ejecuta descarga,
  hash, extraccion PDF/OCR/Vision y guardado final en la misma ejecucion;
- marca duplicados por hash como `duplicate_candidate` sin crear otro documento;
- desactiva documentos si el archivo fue enviado a papelera;
- desactiva documentos si el archivo salio del alcance controlado;
- actualiza metadata ante renombres, movimientos o cambios tecnicos.

No tiene cron ni manual trigger como camino operativo. El unico camino normal es:

1. Google Drive push -> Next `/api/v1/drive/webhook`.
2. Next valida/audita -> llama webhook n8n.
3. n8n consulta `changes.list` y aplica eventos.

## Alta y extraccion de documentos nuevos

Cuando aparece un archivo nuevo no duplicado, el mismo workflow:

1. registra el cambio y actualiza `drive_items`;
2. emite ese archivo como candidato a extraccion;
3. descarga el binario desde Drive;
4. calcula SHA256;
5. si es PDF, extrae texto con `readPDF`;
6. normaliza campos usando la misma logica del flujo manual;
7. si falta issuer, intenta OCR/Vision con OpenAI;
8. guarda el documento final como `processed` si tiene confianza suficiente o
   `review_required` si faltan datos.

Campos cubiertos:

- `drive_file_id`
- `drive_item_id`
- `drive_url`
- `file_name`
- `drive_path`
- `drive_parent_id`
- `content_hash`
- `content_hash_algorithm`
- `drive_md5_checksum`
- `covered_fiscal_months` si el nombre permite inferir uno o varios meses fiscales.

El caso `Patentes Vehiculos` conserva la regla del flujo manual: un mismo PDF
fisico puede generar varias filas logicas, una por pagina/patente, usando
sufijos `#page=N#plate=...`.

La deteccion de duplicados compara `content_hash` y `drive_md5_checksum`,
porque los documentos nuevos quedan con SHA256 como hash principal pero Drive
sigue informando MD5 en metadata.

## Verificacion etapa 3

- Export regenerado desde `scripts/create-drive-incremental-sync-workflow.mjs`.
- Workflow importado en n8n.
- Verificado en SQLite n8n:
  - `active = 0`
  - `isArchived = 0`
  - nodos: `Webhook Next`, `Validar token Next`, `Leer estado Drive`,
    `Tiene cursor?`, `Obtener cursor inicial`, `Guardar cursor inicial`,
    `Listar cambios Drive`, `Sincronizar cambios y documentos`.
  - no hay nodos cron ni manual trigger.
  - owner `workflow:owner` en proyecto `B2r3kEns5ZOMRF5S`.

Variables faltantes en el contenedor n8n al 2026-09-07:

- `N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN`
- `GOOGLE_DRIVE_WEBHOOK_URL`
- `GOOGLE_DRIVE_WEBHOOK_TOKEN`

## Verificacion etapa 4

- Export manual fuente versionado en
  `docs/n8n/2026-09-07-manual-processing-workflow-source.json`.
- `proyecto1DriveIncrementalSync` contiene ahora la cadena:
  - `Emitir archivos nuevos a extraer`
  - `Descargar archivo nuevo`
  - `Calcular SHA256`
  - `Preparar metadata con hash`
  - `Es PDF?`
  - `Extraer texto PDF`
  - `Normalizar extracción PDF`
  - `Marcar requiere OCR`
  - `Necesita OCR/Vision issuer?`
  - `Inferir entidad pagadora OCR/Vision`
  - `Guardar documento extraido`
- Validado SQL real con transaccion `ROLLBACK`: sincronizacion, emision de un
  archivo nuevo y guardado final `processed`.
- Verificado que no quedaron registros de prueba en `documents`,
  `drive_items` ni `drive_change_events`.
