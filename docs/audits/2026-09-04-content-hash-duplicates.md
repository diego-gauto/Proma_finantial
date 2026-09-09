# Auditoria de duplicados por hash de contenido - 2026-09-04

## Alcance

Base revisada:

- Contenedor: `postgres_finanzas_proyecto1`
- Base: `finanzas_documentos`
- Tabla principal: `documents`

## Resultado

- Documentos totales: 139.
- Documentos activos: 139.
- Documentos sin `content_hash`: 0.
- Hashes distintos: 124.
- Grupos con `content_hash` repetido: 5.

Todos los grupos repetidos activos detectados corresponden a comprobantes de `Patentes Vehiculos` donde un mismo PDF fisico se divide en varias filas logicas, una por vehiculo/patente.

Ejemplo de patron:

- Mismo `content_hash`.
- Mismo `physical_drive_file_id` al remover el sufijo logico `#page=N#plate=...`.
- Distintos `drive_file_id` logicos por pagina/patente.
- Distintas categorias hoja: `Patente 500`, `Patente Berlingo`, `Patente Amarok`, `Patente C3`.

## Conclusion

`content_hash` identifica el archivo fisico, no necesariamente una fila unica de `documents`.

Por eso no debe existir una constraint unica sobre `documents.content_hash`. La deteccion de duplicados debe ser logica:

- mismo hash y mismo archivo fisico particionado internamente = caso valido;
- mismo hash y distinto archivo fisico de Drive = posible duplicado/re-subida;
- mismo hash activo ya existente = no crear pago nuevo automaticamente;
- mismo hash solo en documento inactivo/removido = posible restitucion;
- hash nuevo = candidato a documento nuevo.

## Regla Para El Listener

Antes de crear un documento desde un archivo nuevo:

1. Buscar por `drive_file_id`.
2. Si existe, actualizar metadata/ruta/estado del mismo archivo.
3. Si no existe, calcular o leer `content_hash`.
4. Buscar documentos activos por `content_hash`.
5. Si el hash existe solo como particion logica del mismo archivo fisico, permitir las filas derivadas.
6. Si el hash existe con otro archivo fisico activo, crear un caso de revision por duplicado exacto y no contarlo como pago procesado.
7. Si el hash existe en documento inactivo/removido, crear caso de revision por restitucion probable o reactivar segun regla aprobada.

