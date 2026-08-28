# Findings & Decisions

## Requirements

- Guardar `/home/hpadmin/Descargas/02-prd-app.md` dentro de `docs/`.
- Traer `AGENTS.md` y las skills/reglas utiles del proyecto fuente.
- Armar estructura necesaria para comenzar una app propia.
- Cambiar el foco: antes Metabase era central; ahora la app propia consume PostgreSQL y Metabase queda como apoyo opcional.
- Eliminar lo que ya no es necesario.
- Crear plan de implementacion y detenerse para revision.
- Usar `pnpm`.
- Usar React estable; Next.js es aceptado y conocido por el usuario, pero SEO no es prioridad.
- Evaluar si conviene Next.js o React puro con Express.
- Evaluar si hace falta backend separado o si alcanzan Server Components/Server Actions.
- Preguntar dudas una por una.
- Actualizar interfaz: categorias en arbol, reglas por nodo, usuarios, pantalla principal con filtros por periodo/categoria, nubes de botones, alertas, faltantes, duplicados, graficos y revision documental dividida.

## Research Findings

- El PRD define una app consumidora de datos: no procesa Drive ni documentos; eso queda en n8n.
- Tablas centrales: `documents`, `category_nodes`, `payment_rules`, `users`.
- Funciones v1: auth, documentos, detalle/correccion, arbol de categorias, reglas de pago, faltantes/duplicados.
- Metabase no bloquea v1; puede embeberse o linkearse mas adelante.
- La ruta `proma_produccion` no existe. La carpeta encontrada es `/home/hpadmin/proyectos/Proma_production`.
- Proma tiene `AGENTS.md` y `docs/05-Skills-y-Rules.md`; no tiene carpeta `.agents` o `.codex` versionada.
- React estable verificado en npm: `19.2.8`.
- Next.js estable verificado en npm: `16.3.3`.
- Next.js full-stack alcanza para v1: auth, consultas, Server Actions, Route Handlers y UI interna pueden vivir en una sola app.
- React puro + Express agrega complejidad operativa sin aportar mucho para el MVP.
- NestJS/Express separado solo conviene si aparece API publica, mobile app, workers externos o integraciones que requieran independencia.
- Los planes viejos contenian informacion de modelo, no planes de implementacion vigentes. Se condenso lo util en `docs/data-model.md` y se borraron.
- `metabase_data` contiene una base local de Metabase. No es necesaria para empezar la app, pero se conserva porque el usuario no sabe si puede recuperar algo de Metabase.
- `sql/` contenia vistas viejas de Metabase basadas en esquemas anteriores. Se borro tras aprobacion del usuario.
- `.agents` y `.codex` existen como carpetas de solo lectura montadas por el entorno; no se puede escribir ahi desde el repo.
- La primera skill creada era demasiado parecida a reglas generales. Se reemplazo por `skills/payment-compliance`, enfocada en la logica no obvia de faltantes, duplicados, periodos fiscales y reglas historicas.
- La pantalla principal debe priorizar documentos que requieren intervencion, posibles faltantes y duplicados antes de mostrar graficos.
- Las categorias se muestran como arbol en su seccion y como nube de botones/chips en filtros del dashboard.
- Desde cada nodo de categoria se configuran reglas de pago: periodicidad, fecha probable, tolerancia, aviso previo, vigencia y notas.
- La revision documental debe dividir pantalla: documento a la izquierda, formulario de datos a la derecha.
- Pagos vencidos y proximos pagos son derivados de las reglas y el calculo de esperados; no requieren tabla nueva en v1.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js full-stack en la raiz | Reduce piezas, evita backend separado y mantiene la comodidad del usuario. |
| Server Actions/Route Handlers antes que Express | Suficiente para operaciones internas y CRUD sobre PostgreSQL. |
| Metabase opcional | Evita duplicar graficos en v1 y conserva valor de lo existente. |
| No importar reglas textiles de Proma | Son de otro dominio y generarian ruido/peligro. |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Ruta fuente con nombre distinto | Se uso `Proma_production`, documentado como supuesto. |
| `.agents` y `.codex` no editables | Se creo una carpeta versionable `skills/` propia. |
| Skill local especifica | `payment-compliance` aporta un procedimiento concreto; las reglas generales quedan en `AGENTS.md`. |
| Borrado masivo bloqueado | Se dividio la limpieza; luego se borraron `backend/`, `frontend/` y `sql/`, conservando `metabase_data/`. |
| Interface documentada | Se creo `docs/interface.md` para separar decisiones UX del PRD y del plan. |

## Resources

- PRD fuente: `/home/hpadmin/Descargas/02-prd-app.md`
- Proyecto fuente: `/home/hpadmin/proyectos/Proma_production`
- React versions: https://react.dev/versions
- React npm: https://www.npmjs.com/package/react
- Next npm: https://www.npmjs.com/package/next

## Visual/Browser Findings

- No se usaron imagenes ni PDFs visuales en esta tarea.
