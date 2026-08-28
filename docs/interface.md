# Interfaz de la app

## Principio de producto

La app es una herramienta interna de control. La pantalla principal debe priorizar intervencion y decisiones rapidas antes que estetica de dashboard decorativo.

Orden de prioridad visual:

1. Documentos que requieren intervencion.
2. Posibles faltantes.
3. Posibles duplicados.
4. Filtros activos.
5. Graficos y estadisticas.
6. Listados de detalle.

## Navegacion principal

- Inicio.
- Documentos.
- Categorias.
- Reglas.
- Usuarios.
- Reportes, opcional si Metabase queda disponible.

## Inicio operativo

Al entrar, el usuario ve una alerta persistente si existen documentos con `processing_status` en `review_required` o `error`.

La pantalla se compone asi:

1. Alerta de documentos a revisar.
2. Card de posibles faltantes.
3. Card de posibles duplicados.
4. Filtros de periodo fiscal y categorias.
5. Grafico de torta por categorias del gasto total.
6. Listado lateral de categorias con monto gastado.
7. Grafico de lineas por mes con importe gastado.
8. Grafico de lineas/barras por mes con cantidad de pagos.
9. Apartado de pagos vencidos no realizados.
10. Apartado de proximos pagos esperados.

## Filtros

Los filtros principales viven arriba del area analitica:

- Periodo fiscal: anio o anio-mes, segun corresponda.
- Categoria: raiz seleccionable.
- Subcategorias: aparecen progresivamente segun la categoria elegida.

Las categorias y subcategorias no se eligen con un select. Se muestran como una nube de botones o chips. Cada eleccion recalcula los datos inferiores.

Regla importante: periodo fiscal y mes/fecha de pago son filtros distintos. No deben mezclarse en un solo selector.

## Categorias

Las categorias se cargan automaticamente desde n8n/Drive. La app no debe usar el alta manual como flujo principal.

La vista de categorias muestra un arbol navegable. Al entrar a un nodo, el usuario puede:

- ver documentos asociados al nodo y descendientes;
- configurar reglas de pago para esa categoria;
- definir fecha probable de pago;
- definir tolerancia;
- definir cuantos dias antes quiere aviso;
- ver reglas heredadas desde categorias superiores;
- editar excepcionalmente nombre, orden, activo y padre si hubo un error de clasificacion.

## Revision de documentos

Cuando el usuario entra a revisar documentos pendientes:

- La pantalla se divide en dos columnas.
- Izquierda: vista del documento o enlace/previsualizacion disponible.
- Derecha: formulario con los datos extraidos.
- Campos completos se muestran como revisables.
- Campos faltantes o dudosos tienen aviso visual claro.
- Campos con valores predefinidos usan select, no input libre.
- Boton principal: guardar correccion y marcar como procesado.

El objetivo es que el usuario compare documento contra datos extraidos sin cambiar de pantalla.

## Reglas de pago

Las reglas se editan desde el nodo de categoria. Deben permitir configurar:

- periodicidad;
- periodo fiscal esperado;
- fecha probable de pago;
- tolerancia;
- dias de aviso previo;
- vigencia historica;
- notas.

Cuando se modifica una regla vigente, la UI debe guiar a cerrar la regla anterior y crear una nueva para no romper calculos historicos.

## Graficos

El primer grafico analitico es una torta de gastos por categoria para el total filtrado. Puede implementarse dentro de la app o usando Metabase solo para esa card si conviene.

A la derecha de la torta, mostrar una lista/tablero compacto con:

- categoria;
- monto gastado;
- porcentaje del total;
- cantidad de pagos.

Debajo, cuando hay periodo seleccionado:

- importe gastado por mes;
- cantidad de pagos por mes.

Estos graficos deben recalcularse con cada cambio de filtro.

## Estados operativos

Ademas de faltantes y duplicados, la app debe mostrar:

- pagos vencidos no realizados;
- proximos pagos a abonar;
- documentos que requieren intervencion.

Estos estados salen de `documents`, `category_nodes` y `payment_rules`; no se crean tablas nuevas en v1.
