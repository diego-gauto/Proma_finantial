# Next Fullstack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir la app interna de control de pagos con Next.js full-stack, enfocada en revision operativa, reglas por categoria, faltantes, duplicados, vencidos, proximos pagos y analitica basica.

**Architecture:** Una sola app Next.js en la raiz. Server Components cargan datos de PostgreSQL, Server Actions realizan mutations y Route Handlers se reservan para endpoints necesarios. La logica sensible vive en `src/server/`; el acceso a datos en `src/db/`; los componentes visuales en `src/components/`.

**Tech Stack:** pnpm, Node 22, Next.js estable, React estable, TypeScript strict, PostgreSQL, CSS Modules, Recharts, TanStack Table, Vitest. No usar Bootstrap, Tailwind ni librerias CSS/frameworks visuales. Metabase queda fuera del flujo principal por ahora y solo como referencia visual/reportes externos futuros.

---

## Fase 0 - Scaffold y base tecnica

### Task 0.1: Confirmar estrategia de datos

**Files:**
- Read: `docs/02-prd-app.md`
- Read: `docs/interface.md`
- Modify: `docs/architecture.md`
- Modify: `.env.example`

**Step 1: Preguntar una sola decision**

Preguntar si el desarrollo debe conectarse a la base existente alimentada por n8n o a una copia/local seed.

**Step 2: Documentar decision**

Actualizar `docs/architecture.md` con la decision y el string de conexion esperado sin secretos reales.

**Step 3: Verificar**

Revisar que `.env.example` no contenga credenciales reales.

**Step 4: Commit**

```bash
git add docs/architecture.md .env.example
git commit -m "docs: define database strategy"
```

### Task 0.2: Crear app Next.js en la raiz

**Files:**
- Create/Modify: `next.config.ts`
- Create/Modify: `tsconfig.json`
- Create/Modify: `src/app/layout.tsx`
- Create/Modify: `src/app/page.tsx`
- Create/Modify: `src/app/globals.css`
- Modify: `package.json`

**Step 1: Scaffold**

```bash
pnpm create next-app@latest . --ts --app --no-tailwind --eslint --use-pnpm --src-dir
```

Conservar `docs/`, `AGENTS.md`, `.env.example`, `skills/`, `task_plan.md`, `findings.md` y `progress.md`.

**Step 2: Instalar testing**

```bash
pnpm add -D vitest
```

**Step 3: Pantalla inicial minima**

Crear shell interno simple. Si no hay sesion, redirigir a login.

**Step 4: Verificar**

```bash
pnpm run build
```

Expected: build exitoso.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold next fullstack app"
```

### Task 0.3: Configurar PostgreSQL server-only

**Files:**
- Create: `src/server/env.ts`
- Create: `src/db/client.ts`
- Create: `src/db/types.ts`
- Create: `src/server/errors.ts`

**Step 1: Instalar dependencias**

```bash
pnpm add pg zod
pnpm add -D @types/pg
```

**Step 2: Validar env**

Validar `DATABASE_URL` y `SESSION_SECRET`.

**Step 3: Crear pool DB**

Crear pool PostgreSQL importable solo desde servidor.

**Step 4: Tests**

Agregar tests para validacion de env y errores.

**Step 5: Verificar**

```bash
pnpm run test
pnpm run build
```

Expected: tests y build pasan.

## Fase 1 - Auth, usuarios y shell operativo

### Task 1.1: Usuario inicial y login

**Files:**
- Create: `src/server/auth/auth.ts`
- Create: `src/server/users/users.repository.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`
- Create: `src/middleware.ts`

**Step 1: Tests**

Cubrir login correcto, login incorrecto y sesion requerida para rutas internas.

**Step 2: Implementar auth**

Usar cookie httpOnly. Crear mecanismo para setear el primer usuario con mail/password desde seed o comando documentado.

**Step 3: UI login**

Formulario simple de mail y password, con error visible.

**Step 4: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 1.2: Layout interno y navegacion

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/navigation/AppNav.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/styles/tokens.css`

**Step 1: Crear navegacion**

Rutas: Inicio, Documentos, Categorias, Reglas, Usuarios, Reportes opcional.

**Step 2: Crear patrones UI base**

Usar botones, chips, tablas y cards compactas. Evitar landing page y composicion tipo marketing.

**Step 3: Verificar**

```bash
pnpm run build
```

## Fase 2 - Datos base para la pantalla principal

### Task 2.1: Repositorios de documentos y categorias

**Files:**
- Create: `src/db/documents.repository.ts`
- Create: `src/db/categories.repository.ts`
- Create: `src/server/categories/category-tree.ts`
- Create: `src/server/documents/document-filters.ts`

**Step 1: Tests**

Cubrir armado de arbol, breadcrumbs y filtros por categoria con descendientes.

**Step 2: Queries**

Implementar queries para documentos procesados, documentos a revisar, categorias raiz y subcategorias.

**Step 3: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 2.2: Repositorios y calculo de reglas

> Use local skill: `payment-compliance`.

**Files:**
- Create: `src/db/payment-rules.repository.ts`
- Create: `src/server/compliance/resolve-rule.ts`
- Create: `src/server/compliance/generate-expected-periods.ts`
- Create: `src/server/compliance/calculate-status.ts`

**Step 1: Tests**

Cubrir regla propia, regla heredada, regla historica, `grace_days`, vencidos y proximos.

**Step 2: Implementar funciones puras**

Crear calculos independientes de UI y DB.

**Step 3: Verificar**

```bash
pnpm run test
pnpm run build
```

## Fase 3 - Pantalla principal

### Task 3.1: Alertas superiores y cards accionables

**Files:**
- Create: `src/app/(app)/page.tsx`
- Create: `src/components/dashboard/ReviewRequiredAlert.tsx`
- Create: `src/components/dashboard/MissingDocumentsCard.tsx`
- Create: `src/components/dashboard/DuplicateDocumentsCard.tsx`
- Create: `src/server/dashboard/get-dashboard-alerts.ts`

**Step 1: Tests**

Cubrir conteos de `review_required`, `error`, faltantes y duplicados.

**Step 2: UI**

Mostrar primero la alerta de intervencion, luego faltantes y duplicados. Cada item debe llevar a la pantalla correspondiente.

**Step 3: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 3.2: Filtros por periodo y nube de categorias

**Files:**
- Create: `src/components/dashboard/FiscalPeriodFilter.tsx`
- Create: `src/components/dashboard/CategoryCloudFilter.tsx`
- Create: `src/server/dashboard/dashboard-filters.ts`

**Step 1: Tests**

Cubrir serializacion de filtros en URL y seleccion progresiva de subcategorias.

**Step 2: UI**

Periodo fiscal arriba. Categorias como botones/chips. Al seleccionar una categoria, mostrar sus subcategorias disponibles debajo.

**Step 3: Recalculo**

Los filtros deben viajar por query params para que Server Components recalculen los datos.

**Step 4: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 3.3: Resumen por categorias y grafico de torta

**Files:**
- Create: `src/server/dashboard/get-category-spend.ts`
- Create: `src/components/dashboard/CategorySpendPie.tsx`
- Create: `src/components/dashboard/CategorySpendPie.module.css`
- Create: `src/components/dashboard/CategorySpendList.tsx`
- Create: `src/components/dashboard/CategorySpendList.module.css`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Tests**

Cubrir totales por categoria, porcentajes y total filtrado.

**Step 2: Dependencia**

Instalar `recharts` con `pnpm`.

**Step 3: UI**

Mostrar dona de gastos por categoria y a la derecha listado sincronizado con categoria, monto, porcentaje y cantidad de pagos. La dona debe tener tooltip custom, centro dinamico y hover/click alineado con el estilo de referencia de Metabase.

**Step 4: Graficos propios**

No embeber cards recuperadas del Proyecto 2, porque fueron pruebas. Implementar los graficos del tablero operativo con Recharts y mantener Metabase fuera del flujo principal por ahora.

**Step 5: Estilos**

No usar Bootstrap, Tailwind ni frameworks CSS. Los estilos del grafico y listado viven en CSS Modules por componente.

**Step 6: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 3.4: Graficos mensuales

**Files:**
- Create: `src/server/dashboard/get-monthly-series.ts`
- Create: `src/components/dashboard/MonthlyAmountChart.tsx`
- Create: `src/components/dashboard/MonthlyAmountChart.module.css`
- Create: `src/components/dashboard/MonthlyPaymentCountChart.tsx`
- Create: `src/components/dashboard/MonthlyPaymentCountChart.module.css`

**Step 1: Tests**

Cubrir agrupacion por mes para importe gastado y cantidad de pagos.

**Step 2: UI**

Mostrar graficos de linea con Recharts, a ancho completo, para importe gastado por mes y cantidad de pagos por mes. Deben recalcularse para los filtros activos y mostrar meses sin pagos con valor cero cuando exista un periodo anual.

**Step 3: Estilos**

No usar Bootstrap, Tailwind ni frameworks CSS. Los estilos de cada grafico viven en CSS Modules por componente.

**Step 4: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 3.5: Vencidos y proximos pagos

> Use local skill: `payment-compliance`.

**Files:**
- Create: `src/server/compliance/get-overdue-payments.ts`
- Create: `src/server/compliance/get-upcoming-payments.ts`
- Create: `src/components/dashboard/OverduePaymentsPanel.tsx`
- Create: `src/components/dashboard/UpcomingPaymentsPanel.tsx`

**Step 1: Tests**

Cubrir vencido por fecha probable + tolerancia, y proximo por ventana `reminder_days_before`.

**Step 2: UI**

Mostrar apartados separados para pagos vencidos no realizados y proximos pagos esperados.

**Step 3: Verificar**

```bash
pnpm run test
pnpm run build
```

## Fase 4 - Revision de documentos

### Task 4.1: Listado de documentos a revisar

**Files:**
- Create: `src/app/(app)/documentos/revision/page.tsx`
- Create: `src/components/documents/ReviewQueue.tsx`
- Modify: `src/db/documents.repository.ts`

**Step 1: Tests**

Cubrir listado de documentos `review_required` y `error`.

**Step 2: UI**

Lista priorizada con estado, motivo, categoria tentativa y link a revisar.

**Step 3: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 4.2: Pantalla dividida de revision

**Files:**
- Create: `src/app/(app)/documentos/revision/[id]/page.tsx`
- Create: `src/app/(app)/documentos/revision/[id]/actions.ts`
- Create: `src/components/documents/DocumentPreviewPane.tsx`
- Create: `src/components/documents/DocumentReviewForm.tsx`
- Create: `src/server/documents/review-document.ts`

**Step 1: Tests**

Cubrir que solo documentos pendientes de revision/error puedan guardarse como procesados.

**Step 2: UI**

Mitad izquierda: documento o link/previsualizacion. Mitad derecha: formulario con campos completos, faltantes y dudosos. Campos con valores predefinidos usan select.

**Step 3: Server Action**

Validar datos, guardar correccion y marcar como `processed`.

**Step 4: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 4.3: Listado general y detalle de documentos

**Files:**
- Create: `src/app/(app)/documentos/page.tsx`
- Create: `src/app/(app)/documentos/[id]/page.tsx`
- Create: `src/components/documents/DocumentsTable.tsx`
- Create: `src/components/documents/DocumentsTable.module.css`
- Create: `src/components/documents/DocumentFilters.tsx`
- Create: `src/components/documents/DocumentFilters.module.css`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Tests**

Cubrir filtros por fecha de pago, periodo fiscal, categoria, estado y texto libre.

**Step 2: Dependencia**

Instalar `@tanstack/react-table` con `pnpm`.

**Step 3: UI**

Tabla con TanStack Table, breadcrumb, motivo, monto, moneda, estado y link a Drive. La tabla debe prepararse para orden, filtros y paginacion server-side cuando el dataset crezca.

**Step 4: Estilos**

No usar Bootstrap, Tailwind ni frameworks CSS. La tabla y filtros viven en CSS Modules por componente.

**Step 5: Verificar**

```bash
pnpm run test
pnpm run build
```

## Fase 5 - Categorias y reglas por nodo

### Task 5.1: Arbol visual de categorias

**Files:**
- Create: `src/app/(app)/categorias/page.tsx`
- Create: `src/app/(app)/categorias/[id]/page.tsx`
- Create: `src/components/categories/CategoryTree.tsx`
- Create: `src/components/categories/CategoryNodeSummary.tsx`

**Step 1: Tests**

Cubrir arbol recursivo, conteos por nodo y documentos por descendientes.

**Step 2: UI**

Arbol expandible. Entrar a un nodo abre detalle del nodo con documentos, resumen y reglas.

**Step 3: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 5.2: Reglas de pago desde categoria

> Use local skill: `payment-compliance`.

**Files:**
- Create: `src/app/(app)/categorias/[id]/reglas/actions.ts`
- Create: `src/components/payment-rules/PaymentRuleForm.tsx`
- Create: `src/components/payment-rules/PaymentRuleHistory.tsx`
- Create: `src/server/payment-rules/*`

**Step 1: Tests**

Cubrir alta, cierre historico, herencia, regla mas especifica, tolerancia y aviso previo.

**Step 2: UI**

Desde el nodo, configurar periodicidad, fecha probable de pago, tolerancia, cuando avisar, vigencia y notas.

**Step 3: Historial**

Al cambiar una regla vigente, guiar a cerrar regla anterior con `active_to` y crear una nueva.

**Step 4: Verificar**

```bash
pnpm run test
pnpm run build
```

## Fase 6 - Usuarios y reportes opcionales

### Task 6.1: Alta de usuarios

**Files:**
- Create: `src/app/(app)/usuarios/page.tsx`
- Create: `src/app/(app)/usuarios/actions.ts`
- Create: `src/components/users/UserCreateForm.tsx`
- Create: `src/server/users/create-user.ts`

**Step 1: Tests**

Cubrir alta con mail/password, hash de password y no exposicion de password.

**Step 2: UI**

Pantalla simple para agregar usuarios. En v1 todos tienen el mismo acceso.

**Step 3: Verificar**

```bash
pnpm run test
pnpm run build
```

### Task 6.2: Reportes opcionales

**Files:**
- Review: `src/app/(app)/reports/page.tsx`
- Modify: `.env.example`

**Step 1: Confirmar recuperacion**

Mantener Metabase solo como referencia visual/reportes futuros. No usar dashboards del Proyecto 2 en la app productiva.

**Step 2: Implementar fallback**

Mostrar estado de reportes no configurados o link externo a Metabase si queda disponible. No embeber cards en la pantalla principal.

**Step 3: Verificar**

```bash
pnpm run build
```

## Fase 7 - Hardening

### Task 7.1: Estados vacios, errores y responsive

**Files:**
- Review: `src/app/**`
- Review: `src/components/**`

**Step 1: Revisar UI**

Validar estados sin datos, loading, errores de formularios y mobile.

**Step 2: Verificar**

```bash
pnpm run build
```

### Task 7.2: Auditoria de reglas criticas

> Use local skill: `payment-compliance`.

**Files:**
- Review: `src/server/compliance/**`
- Review: `src/db/**`

**Step 1: Tests**

Revisar que los casos obligatorios de la skill `payment-compliance` esten cubiertos.

**Step 2: Verificar**

```bash
pnpm run test
pnpm run build
```

## Detenerse

No ejecutar este plan hasta aprobacion del usuario.
