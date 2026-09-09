# Guia de despliegue en VPS: app por Dokploy, PostgreSQL separado, n8n y Google Drive

## Objetivo

Llevar al VPS la aplicacion Next.js y los workflows n8n necesarios para:

- procesar la carga inicial de documentos existentes en Google Drive;
- recibir eventos de Google Drive por HTTPS;
- procesar cambios inmediatamente con un unico workflow incremental;
- permitir cambiar luego dominio, base de datos y cuenta Gmail/Drive del cliente solo modificando variables de entorno y credenciales.

Enfoque decidido:

- la app Next.js se despliega desde Dokploy;
- PostgreSQL se levanta como un contenedor nuevo y separado de las bases existentes del VPS;
- se usa el n8n existente del VPS, pero con workflows y credenciales separadas para este proyecto;
- si en el futuro se necesita aislamiento total, se puede levantar un segundo n8n con volumen y dominio propios.

El diseno final recomendado queda asi:

```text
Google Drive del cliente
  -> https://app.tu-dominio.com/api/v1/drive/webhook
  -> App Next.js en Dokploy
  -> n8n existente en el VPS
  -> PostgreSQL nuevo del proyecto
  -> Dashboard Next.js lee PostgreSQL
```

## Componentes

### App Next.js

Se despliega como una app nueva en Dokploy.

Recibe el webhook publico de Google Drive en:

```text
/api/v1/drive/webhook
```

Valida canal, token y recurso. Si la notificacion es valida, llama al workflow incremental de n8n.

La app no lee Drive y no procesa PDFs. Eso sigue siendo responsabilidad de n8n.

### n8n

Se puede usar el n8n existente del VPS sin afectar los flujos actuales, siempre que se separen:

- nombres de workflows;
- credenciales PostgreSQL;
- credenciales Google Drive;
- tokens de webhooks;
- variables de entorno;
- carpeta/proyecto visual dentro de n8n, si la version instalada lo soporta.

Si n8n tiene folders/proyectos disponibles, agrupar estos workflows en un folder/proyecto llamado por ejemplo `Finanzas - Control de pagos`. Si no lo tiene, usar nombres prefijados y tags:

```text
Finanzas / Proyecto 1 / Carga inicial
Finanzas / Proyecto 1 / Backfill carpetas Drive
Finanzas / Proyecto 1 / Renovar watch Drive
Finanzas / Proyecto 1 / Sync incremental Drive
```

Debe tener estos workflows del proyecto:

| Workflow | Archivo | Uso |
|---|---|---|
| `proyecto1FinDocs2026` | exportado desde n8n actual | Carga inicial manual de comprobantes existentes. |
| `proyecto1DriveFolderCategoryBackfill` | `docs/n8n/2026-09-06-drive-folder-category-backfill-workflow.json` | Mapea carpetas Drive existentes contra categorias. |
| `proyecto1DriveWatchRenewal` | `docs/n8n/2026-09-06-drive-watch-renewal-workflow.json` | Registra/renueva el watch de Google Drive contra HTTPS publico. |
| `proyecto1DriveIncrementalSync` | `docs/n8n/2026-09-06-drive-incremental-sync-workflow.json` | Procesa cambios nuevos de Drive. Lo llama Next.js. |

### PostgreSQL

Debe ser una base compartida entre n8n y la app, pero separada de otras bases ya existentes en el VPS.

Recomendacion:

- contenedor nuevo: `postgres_finanzas_cliente1`;
- volumen nuevo: `postgres_finanzas_cliente1_data`;
- base nueva: `finanzas_documentos`;
- usuario nuevo: `finanzas_user`;
- puerto externo distinto si hace falta exponerlo al host, por ejemplo `5435:5432`.

No choca con otros PostgreSQL del VPS mientras no se reutilice el mismo volumen ni el mismo puerto externo.

La app lee/escribe `documents`, `category_nodes`, `payment_rules`, `users` y tablas tecnicas de Drive.

## Variables de entorno

No versionar valores reales. Los nombres deben mantenerse iguales entre entornos.

### App Next.js

```env
DATABASE_URL=postgresql://finanzas_user:password_seguro@postgres_finanzas_cliente1:5432/finanzas_documentos
SESSION_SECRET=generar-un-secreto-largo-de-32-o-mas-caracteres

GOOGLE_DRIVE_WEBHOOK_CHANNEL_ID=documents-root-prod
GOOGLE_DRIVE_WEBHOOK_TOKEN=generar-token-largo-compartido-con-n8n
GOOGLE_DRIVE_WEBHOOK_URL=https://app.tu-dominio.com/api/v1/drive/webhook

N8N_DRIVE_INCREMENTAL_WEBHOOK_URL=https://n8n.tu-dominio.com/webhook/proyecto1-drive-incremental-sync
N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN=generar-token-largo-compartido-con-n8n
```

Si Dokploy conecta la app a la misma red Docker donde estan n8n y PostgreSQL, se puede usar host interno:

```env
DATABASE_URL=postgresql://finanzas_user:password_seguro@postgres_finanzas_cliente1:5432/finanzas_documentos
N8N_DRIVE_INCREMENTAL_WEBHOOK_URL=http://n8n:5678/webhook/proyecto1-drive-incremental-sync
```

Si no comparten red, usar URLs/puertos alcanzables desde la app. Para PostgreSQL, evitar exponer la base a Internet salvo que se limite por firewall.

### n8n

```env
GOOGLE_DRIVE_WEBHOOK_TOKEN=el-mismo-valor-que-en-next
GOOGLE_DRIVE_WEBHOOK_URL=https://app.tu-dominio.com/api/v1/drive/webhook

N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN=el-mismo-valor-que-en-next

OPENAI_FINANZAS_API_KEY=
OPENAI_FINANZAS_MODEL=gpt-4.1-mini-2025-04-14
```

La conexion PostgreSQL del proyecto en n8n debe configurarse como credencial nueva, no como `DATABASE_URL` global de n8n. Esa credencial apunta a:

```text
host: postgres_finanzas_cliente1
port: 5432
database: finanzas_documentos
user: finanzas_user
password: password_seguro
```

Si n8n no comparte red Docker con el contenedor PostgreSQL, usar el host/puerto alcanzable desde n8n, por ejemplo `IP_PRIVADA_O_HOST_DEL_VPS:5435`.

Atencion: las variables `GOOGLE_DRIVE_WEBHOOK_TOKEN`, `GOOGLE_DRIVE_WEBHOOK_URL` y `N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN` son globales dentro del proceso n8n. Si el n8n existente ya usa esos mismos nombres para otro proyecto, hay dos opciones:

- renombrar las variables en estos workflows antes de importarlos, por ejemplo `FINANZAS_GOOGLE_DRIVE_WEBHOOK_URL`;
- levantar un segundo n8n separado para aislamiento total.

`GOOGLE_DRIVE_WEBHOOK_CHANNEL_ID` lo puede definir la app para validar el canal esperado. El workflow `proyecto1DriveWatchRenewal` guarda en `drive_sync_state` el canal real registrado contra Google.

## Etapas de despliegue

### Etapa 1: Preparar dominios y HTTPS

1. Crear DNS para la app en Dokploy:

```text
app.tu-dominio.com -> VPS
```

2. Crear DNS para n8n si se quiere exponer editor o webhooks n8n:

```text
n8n.tu-dominio.com -> VPS
```

3. En Dokploy, crear la app y asociar `app.tu-dominio.com` con SSL.

Recomendacion simple:

- `https://app.tu-dominio.com` apunta a la app Next.js administrada por Dokploy.
- `https://n8n.tu-dominio.com` apunta al n8n existente si ya se usa con HTTPS.
- Si Dokploy y n8n comparten red Docker, Next puede llamar a n8n por host interno.
- Si no comparten red, Next llama a n8n por HTTPS publico.

### Etapa 2: Crear PostgreSQL separado

Crear un contenedor nuevo de PostgreSQL para este proyecto, separado de los que ya existen en el VPS.

Ejemplo Docker Compose conceptual:

```yaml
services:
  postgres_finanzas_cliente1:
    image: postgres:15
    container_name: postgres_finanzas_cliente1
    restart: unless-stopped
    environment:
      POSTGRES_DB: finanzas_documentos
      POSTGRES_USER: finanzas_user
      POSTGRES_PASSWORD: password_seguro
    volumes:
      - postgres_finanzas_cliente1_data:/var/lib/postgresql/data
    ports:
      - "5435:5432"

volumes:
  postgres_finanzas_cliente1_data:
```

Notas:

- `5435:5432` solo es necesario si la app/n8n no pueden llegar por red Docker interna.
- Si todo comparte red Docker, no exponer `ports`; alcanza con el nombre del contenedor.
- Usar un volumen nuevo evita mezclar datos con otros proyectos.
- Usar usuario/base propios evita tocar credenciales existentes.

Despues:

1. Crear/restaurar las tablas del proyecto.
2. Aplicar las migraciones SQL existentes en este repo si la base esta vacia o incompleta:

```text
docs/sql/2026-09-02-payment-rules-constraints.sql
docs/sql/2026-09-03-payment-rules-updated-at.sql
docs/sql/2026-09-04-documents-covered-fiscal-months.sql
docs/sql/2026-09-04-documents-drive-identity-fields.sql
docs/sql/2026-09-04-drive-listener-state.sql
docs/sql/2026-09-06-drive-watch-webhook.sql
```

Antes de reiniciar carga inicial, respaldar como minimo:

```sql
copy payment_rules to '/tmp/payment_rules_backup.csv' csv header;
copy users to '/tmp/users_backup.csv' csv header;
```

Si se migra la base actual completa, no vaciar tablas salvo decision explicita. `payment_rules` y `users` no deben perderse.

### Etapa 3: Desplegar la app Next.js en Dokploy

1. Crear una app nueva en Dokploy.
2. Conectar el repositorio o subir el codigo al VPS segun el metodo que se use en Dokploy.
3. Configurar build/install:

```bash
pnpm install --frozen-lockfile
pnpm build
```

4. Configurar start command:

```bash
pnpm start
```

5. Cargar variables de entorno de la app en Dokploy.
6. Asociar dominio/SSL.
7. Verificar que la app responde por HTTPS.
8. Crear o verificar usuario inicial:

```bash
pnpm seed:user
```

Ejemplo de `DATABASE_URL` si Dokploy comparte red Docker con la base:

```env
DATABASE_URL=postgresql://finanzas_user:password_seguro@postgres_finanzas_cliente1:5432/finanzas_documentos
```

Ejemplo si Dokploy no comparte red Docker y se usa el puerto del host:

```env
DATABASE_URL=postgresql://finanzas_user:password_seguro@IP_PRIVADA_O_HOST_DEL_VPS:5435/finanzas_documentos
```

### Etapa 4: Preparar n8n existente en el VPS

Usar el n8n existente, pero sin mezclarlo con los flujos actuales.

1. Configurar variables de entorno de n8n para este proyecto.
2. Configurar credencial PostgreSQL nueva apuntando a `postgres_finanzas_cliente1`.
3. Configurar credencial Google Drive OAuth2 nueva con la cuenta Gmail que corresponda al ambiente.
4. Crear un folder/proyecto/tag visual si la version de n8n lo permite.
5. Nombrar workflows y credenciales con prefijo claro, por ejemplo:

```text
Finanzas Cliente 1 - Postgres
Finanzas Cliente 1 - Google Drive
Finanzas Cliente 1 - Sync incremental Drive
```

Para pruebas iniciales puede usarse tu Gmail/dominio. Para pasar al cliente, se cambia:

- credencial Google Drive OAuth2 en n8n;
- `GOOGLE_DRIVE_WEBHOOK_URL`;
- tokens compartidos si se quiere rotarlos;
- dominio publico de la app.

Si se prefiere aislamiento total, levantar otro n8n separado:

- contenedor propio;
- volumen propio;
- dominio propio, por ejemplo `n8n-finanzas.tu-dominio.com`;
- variables y credenciales propias.

No es obligatorio para este caso.

### Etapa 5: Importar workflows n8n

Importar estos workflows:

```bash
n8n import:workflow --input=docs/n8n/2026-09-06-drive-folder-category-backfill-workflow.json
n8n import:workflow --input=docs/n8n/2026-09-06-drive-watch-renewal-workflow.json
n8n import:workflow --input=docs/n8n/2026-09-06-drive-incremental-sync-workflow.json
```

El workflow manual inicial `proyecto1FinDocs2026` debe exportarse desde el n8n actual e importarse en el VPS.

Despues de importar:

1. revisar credenciales de cada nodo;
2. asignar tags/folder/proyecto de n8n si corresponde;
3. publicar/activar `proyecto1DriveIncrementalSync`;
4. publicar/activar `proyecto1DriveWatchRenewal`;
5. dejar manuales/iniciales desactivados salvo cuando se ejecuten a mano.

Si n8n avisa que los cambios requieren reinicio, reiniciar n8n.

### Etapa 6: Configurar carpeta raiz de Drive

En `drive_sync_state` debe existir el scope:

```text
documents_root
```

con `root_folder_id` igual al ID de la carpeta raiz que se va a controlar en Google Drive.

Cuando se use la cuenta Gmail del cliente:

1. compartir o crear la carpeta raiz en el Drive del cliente;
2. obtener el ID real de esa carpeta;
3. actualizar `drive_sync_state.root_folder_id`;
4. asegurar que la credencial Google Drive OAuth2 de n8n tenga acceso a esa carpeta.

Ejemplo:

```sql
insert into drive_sync_state (scope, root_folder_id)
values ('documents_root', 'ID_CARPETA_RAIZ_DRIVE')
on conflict (scope) do update set
  root_folder_id = excluded.root_folder_id,
  updated_at = now();
```

### Etapa 7: Ejecutar carga inicial

Orden recomendado para un ambiente nuevo:

1. Ejecutar workflow manual inicial `proyecto1FinDocs2026`.
2. Ejecutar `proyecto1DriveFolderCategoryBackfill`.
3. Verificar:

```sql
select count(*) from documents;
select count(*) from category_nodes;
select count(*) from drive_items;
select count(*) from category_nodes where drive_folder_id is not null;
```

4. Verificar que no quedaron arreglos vacios:

```sql
select count(*)
from documents
where covered_fiscal_months is not null
  and cardinality(covered_fiscal_months) = 0;
```

Debe dar `0`.

### Etapa 8: Registrar watch de Google Drive

Ejecutar manualmente `proyecto1DriveWatchRenewal`.

Ese workflow llama a `changes.watch` y guarda en `drive_sync_state`:

- `watch_channel_id`;
- `watch_resource_id`;
- `watch_expiration_at`;
- `watch_token`;
- `webhook_url`.

Verificar:

```sql
select
  watch_channel_id is not null as has_channel,
  watch_resource_id is not null as has_resource,
  watch_expiration_at,
  webhook_url
from drive_sync_state
where scope = 'documents_root';
```

Google Drive exige HTTPS publico para el webhook. Por eso `GOOGLE_DRIVE_WEBHOOK_URL` debe usar el dominio real:

```text
https://app.tu-dominio.com/api/v1/drive/webhook
```

### Etapa 9: Probar escucha inmediata

1. Subir un PDF nuevo dentro de la carpeta raiz controlada.
2. Esperar la push notification de Google Drive.
3. Verificar auditoria:

```sql
select id, forwarded_at is not null as forwarded, forward_status, forward_error, received_at
from drive_webhook_notifications
order by id desc
limit 5;
```

Debe verse `forwarded = true` y `forward_status = 200`.

4. Verificar documento:

```sql
select
  id,
  file_name,
  processing_status,
  fiscal_period_year,
  fiscal_period_month,
  covered_fiscal_months,
  content_hash_algorithm,
  drive_md5_checksum is not null as has_drive_md5,
  active
from documents
order by id desc
limit 5;
```

Para un archivo tipo `04-05-26.pdf`, debe quedar:

```text
fiscal_period_year = 2026
fiscal_period_month = 5
covered_fiscal_months = {4,5}
```

### Etapa 10: Pruebas de eventos Drive

Probar estos casos en el VPS antes de entregar:

| Caso | Resultado esperado |
|---|---|
| Crear carpeta vacia | No crea categoria ni documento. |
| Subir PDF nuevo en carpeta conocida | Crea/actualiza `drive_items`, crea `documents`, procesa hash y periodo fiscal. |
| Subir PDF en carpeta nueva con archivo | Crea las categorias necesarias al guardar el documento. |
| Subir archivo con mismo hash que uno activo | Marca candidato duplicado/revision segun workflow. |
| Mover archivo a otra categoria | Actualiza `documents.category_node_id`, `drive_parent_id` y `drive_path`. |
| Renombrar archivo | Actualiza `file_name` y auditoria. |
| Mandar archivo a papelera | Marca `active=false`, `removed_reason='trashed'`. |
| Restaurar archivo | Reactiva si corresponde y limpia remocion. |
| Mover archivo fuera de raiz | Marca `active=false`, `removed_reason='moved_out_of_scope'`. |
| Renombrar carpeta con categoria mapeada | Actualiza `category_nodes.name`. |
| Mover carpeta con categoria mapeada | Actualiza `category_nodes.parent_id`. |

### Etapa 11: Cambio futuro a dominio y Gmail del cliente

Para pasar de prueba con tu dominio/cuenta al cliente:

1. Cambiar DNS/HTTPS:

```env
GOOGLE_DRIVE_WEBHOOK_URL=https://app.dominio-cliente.com/api/v1/drive/webhook
```

2. Cambiar credencial Google Drive OAuth2 de n8n a la cuenta Gmail del cliente.
3. Actualizar `drive_sync_state.root_folder_id` con la carpeta raiz real del Drive del cliente.
4. Regenerar tokens compartidos si se quiere separar ambientes:

```env
GOOGLE_DRIVE_WEBHOOK_TOKEN=nuevo-token
N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN=nuevo-token
```

5. Actualizar variables en app y n8n.
6. Reiniciar app y n8n.
7. Ejecutar `proyecto1DriveWatchRenewal`.
8. Hacer una prueba real subiendo un PDF.

## Checklist de salida

- [ ] App responde por HTTPS.
- [ ] `/auth/login` es publico y el resto requiere sesion.
- [ ] n8n tiene credencial PostgreSQL correcta.
- [ ] n8n tiene credencial Google Drive OAuth2 correcta.
- [ ] `DATABASE_URL` de app y n8n apuntan a la misma base.
- [ ] `GOOGLE_DRIVE_WEBHOOK_URL` apunta al dominio HTTPS actual.
- [ ] `N8N_DRIVE_INCREMENTAL_WEBHOOK_URL` es alcanzable desde la app.
- [ ] `GOOGLE_DRIVE_WEBHOOK_TOKEN` coincide entre app y n8n.
- [ ] `N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN` coincide entre app y n8n.
- [ ] `proyecto1DriveIncrementalSync` esta activo.
- [ ] `proyecto1DriveWatchRenewal` esta activo o ejecutable para renovar.
- [ ] `proyecto1DriveWatchRenewal` fue ejecutado despues de cambiar dominio/cuenta/carpeta.
- [ ] Una subida real a Drive crea o actualiza `documents`.
- [ ] Un archivo a papelera queda `active=false`.
- [ ] No hay `covered_fiscal_months` vacios.

## Notas importantes

- Google Drive no manda el archivo cambiado en el webhook. Solo avisa que hay cambios. Por eso Next llama a n8n, y n8n consulta `changes.list`.
- El watch de Google Drive vence. Hay que renovar antes de `watch_expiration_at`.
- El dominio de prueba puede ser tu dominio, pero al pasar al cliente hay que volver a ejecutar `proyecto1DriveWatchRenewal`.
- Si cambia la cuenta Gmail/Drive, tambien cambia el `root_folder_id` y debe revalidarse el backfill.
- No borrar historico de `documents`, `category_nodes` ni `payment_rules` para limpiar pruebas; marcar inactivo o usar una base separada de staging.
