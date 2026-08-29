# Arquitectura inicial

## Decision principal

Construir una app propia con Next.js full-stack en la raiz del repo:

- `src/app/`: rutas, layouts, pantallas, Server Components y Route Handlers.
- `src/server/`: Server Actions, servicios de negocio y validaciones.
- `src/db/`: conexion PostgreSQL, queries tipadas y repositorios.
- `src/components/`: componentes React de UI.
- `docs/`: documentos de producto, arquitectura y planes.
- `skills/`: skills versionables propias del proyecto.
- Metabase sigue disponible para graficos o listados analiticos, pero no es la interfaz principal de gestion.

Esta opcion aprovecha que el usuario ya conoce Next.js y evita mantener dos aplicaciones mientras el producto sigue siendo interno y de baja exposicion publica.

## Evaluacion de alternativas

### Opcion recomendada: Next.js full-stack

Vale la pena usar Next.js aunque no haya SEO. El beneficio aca no es SEO: es productividad, routing, layouts, Server Components, Server Actions, Route Handlers, build integrado y despliegue simple. Para este MVP, un backend separado no parece necesario porque las operaciones son formularios, listados, correcciones y calculos sobre PostgreSQL.

La condicion es no mezclar SQL crudo por todos lados: la logica debe vivir en `src/server/` y `src/db/`, con tests para reglas delicadas como faltantes, duplicados e historico de reglas.

### Opcion descartada por ahora: React puro + Express

React puro con Vite + Express funcionaria, pero agrega dos piezas, dos servidores, CORS, contratos HTTP internos y mas mantenimiento. Tiene sentido si despues se necesita una API publica, mobile app, integraciones externas o workers separados.

### Opcion descartada por ahora: Next.js + NestJS

Es robusta, pero pesada para arrancar este proyecto. NestJS se puede agregar despues si el dominio crece o si la app necesita API independiente.

## Flujo de datos

```mermaid
flowchart LR
  Drive[Google Drive] --> N8N[n8n]
  N8N --> PG[(PostgreSQL)]
  App[Next.js full-stack] <--> PG
  Metabase[Metabase opcional] --> PG
```

## Estrategia de datos para desarrollo

Para la Fase 0 se preparo una base PostgreSQL local con `docker-compose.yml` como entorno aislado posible. Durante la conexion operativa se detecto que ya existe una base financiera local alimentada por n8n, por lo que el desarrollo actual puede apuntar a esa base existente para mostrar datos reales.

La conexion efectiva de cada entorno queda en `.env.local` o en variables del deploy, y no se commitea. Antes de implementar queries nuevas hay que validar que el destino exponga las tablas de negocio esperadas: `documents`, `category_nodes`, `payment_rules` y `users`.

En entornos conectados a la operacion real, la app debe apuntar a la misma base PostgreSQL que alimentan los flujos n8n mediante `DATABASE_URL`. El string esperado tiene esta forma, sin credenciales reales en el repositorio:

```bash
DATABASE_URL=postgresql://APP_USER:APP_PASSWORD@DB_HOST:DB_PORT/DB_NAME
```

La app no crea una copia propia de negocio ni sincroniza datos: solo cambia el destino de conexion por entorno.

El esquema real usa ids `bigint` y separa el periodo fiscal en columnas `fiscal_period_year`, `fiscal_period_month` y `fiscal_period_kind`. La UI puede mostrar un periodo derivado (`2026-01` o `2026`), pero las queries no deben depender de una columna `fiscal_period`.

## Responsabilidades

| Componente | Responsabilidad |
| --- | --- |
| n8n | Detectar comprobantes, extraer datos, clasificar categorias y poblar tablas. |
| PostgreSQL | Fuente de verdad compartida. |
| Next.js server | Auth, validacion, reglas de negocio, CRUD, calculo de faltantes/duplicados. |
| Next.js UI | Operacion diaria: listar, filtrar, corregir, configurar reglas y revisar faltantes. |
| Metabase | Reportes/graficos no bloqueantes para v1. |

## Primeras pantallas

- Login.
- Inicio operativo: alerta de documentos a revisar, faltantes, duplicados, filtros, graficos y listados.
- Documentos: listado filtrable + detalle/correccion en pantalla dividida.
- Categorias: arbol navegable; cada nodo permite configurar reglas de pago.
- Usuarios: alta simple de usuarios.
- Reportes: entrada opcional a Metabase si se conserva.

## Disenio de interfaz

La app debe sentirse como herramienta interna de control: densa, escaneable y rapida. No necesita landing page ni hero. La primera pantalla despues del login es el tablero operativo.

Los filtros superiores combinan periodo fiscal y categoria. Las categorias se presentan como una nube de botones/chips: primero categorias raiz, luego subcategorias segun la seleccion. Cada seleccion actualiza faltantes, duplicados, graficos y listas.

La primera informacion visible debe ser accionable: documentos que requieren intervencion, posibles faltantes y posibles duplicados. Los graficos aparecen despues como apoyo analitico.

## Metabase

Metabase queda como opcional para reportes y referencia visual. Los dashboards recuperados del Proyecto 2 fueron pruebas y no deben embeberse en la app productiva; si se usa Metabase, debe montarse sobre la base vigente de documentos y recrear alli las visualizaciones necesarias. Si esa administracion no queda simple y segura, la app debe resolver los graficos con una libreria propia y mantener Metabase fuera del flujo operativo.

Mientras `metabase_data/` exista, se conserva para posible recuperacion. No se incluye Metabase en `docker-compose.yml` inicial.

## Decisiones abiertas

- Confirmar si Metabase se mantiene como stack separado para reportes recreados sobre la base vigente, o si se reemplaza por graficos propios en la app.
- Definir si la autenticacion sera solo cookie de sesion o JWT con cookie httpOnly. Recomendacion inicial: cookie httpOnly.
