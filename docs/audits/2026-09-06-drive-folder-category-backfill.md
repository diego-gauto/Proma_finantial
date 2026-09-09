# Phase 1 - Backfill carpetas Drive a categorias

## Workflow

- ID n8n: `proyecto1DriveFolderCategoryBackfill`
- Nombre: `Proyecto 1 - Backfill carpetas Drive categorias`
- Estado: inactivo
- Export versionado: `docs/n8n/2026-09-06-drive-folder-category-backfill-workflow.json`

## Resultado real

El workflow se ejecuto contra Google Drive y PostgreSQL.

- Carpetas guardadas en `drive_items`: 113
- Categorias mapeadas con `category_nodes.drive_folder_id`: 36 de 36
- Categorias con `drive_folder_id` sin `drive_items`: 0
- `drive_folder_id` duplicados: 0
- Categorias de anio creadas por error: 0

## Regla aplicada

El backfill no crea categorias nuevas. Solo recorre carpetas Drive, guarda inventario
tecnico en `drive_items` y completa `category_nodes.drive_folder_id` cuando la ruta
de carpeta coincide con una categoria ya existente.

Las carpetas de anio, por ejemplo `2026`, no se mapean como categorias nuevas. En
`drive_items` heredan `category_node_id` de la categoria padre para que los archivos
dentro puedan clasificarse correctamente.

## Uso posterior

Este mapeo permite que el workflow incremental unico procese de inmediato:

- renombre de carpeta: actualizar `category_nodes.name`;
- movimiento de carpeta: actualizar `category_nodes.parent_id`;
- movimiento de archivo: recalcular categoria por carpeta padre;
- archivo nuevo: resolver categoria desde su carpeta real.
