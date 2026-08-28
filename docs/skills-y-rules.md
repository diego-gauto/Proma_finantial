# Skills y reglas recomendadas

Documento adaptado desde `/home/hpadmin/proyectos/Proma_production/docs/05-Skills-y-Rules.md`. Se trajeron las practicas utiles y se quitaron reglas del dominio textil que no aplican.

## Diferencia entre AGENTS.md y una skill

- `AGENTS.md` contiene reglas generales del repositorio: stack, alcance, seguridad, testing y convenciones.
- Una skill debe servir para una tarea concreta y repetible. Si solo repite reglas generales, no aporta.

## Donde estan instaladas

Las skills nombradas abajo no estan dentro de este repo salvo la skill local. En esta maquina ya existen globalmente:

- Skills de agente: `/home/hpadmin/.agents/skills/`
- Skills de Codex: `/home/hpadmin/.codex/skills/`
- Skills del sistema: `/home/hpadmin/.codex/skills/.system/`

Ejemplos reales:

- `brainstorming`: `/home/hpadmin/.agents/skills/brainstorming/SKILL.md`
- `planning-with-files`: `/home/hpadmin/.agents/skills/planning-with-files/SKILL.md`
- `writing-plans`: `/home/hpadmin/.agents/skills/writing-plans/SKILL.md`
- `test-driven-development`: `/home/hpadmin/.agents/skills/test-driven-development/SKILL.md`
- `systematic-debugging`: `/home/hpadmin/.agents/skills/systematic-debugging/SKILL.md`
- `impeccable`: `/home/hpadmin/.agents/skills/impeccable/SKILL.md`
- `skill-creator`: `/home/hpadmin/.codex/skills/.system/skill-creator/SKILL.md`

No hace falta instalarlas para usarlas en esta sesion: el entorno ya las expone como disponibles. Cuando una tarea coincide con una skill, el agente debe leer su `SKILL.md` antes de actuar.

## Skills utiles para este proyecto

| Skill | Uso | Prioridad |
| --- | --- | --- |
| `brainstorming` | Aclarar alcance y decisiones de producto antes de modificar comportamiento. | Alta |
| `planning-with-files` | Mantener `task_plan.md`, `findings.md` y `progress.md` en tareas largas. | Alta |
| `writing-plans` | Crear planes implementables por etapas antes de codear. | Alta |
| `test-driven-development` | Diseñar pruebas antes de tocar calculos sensibles. | Alta |
| `systematic-debugging` | Diagnosticar bugs o fallas de tests sin parchear a ciegas. | Alta |
| `api-design-principles` | Revisar Route Handlers, Server Actions y contratos de filtros/listados. | Media |
| `frontend-testing` | Tests de componentes React cuando haya UI interactiva critica. | Media |
| `impeccable` | Pulir UX de pantallas internas densas: tablas, filtros, formularios y estados. | Media |
| `payment-compliance` | Skill local para implementar/revisar faltantes, duplicados, periodos fiscales y reglas historicas. | Alta |

## Reglas locales

- `AGENTS.md` tiene prioridad sobre recomendaciones genericas de skills.
- El PRD tiene prioridad para reglas de negocio.
- Si una skill sugiere cambiar de stack, agregar una libreria grande o ampliar el alcance, pedir confirmacion antes.
- Preguntar dudas de negocio una por una.

## Stack recomendado inicial

- `pnpm`.
- Next.js App Router full-stack en la raiz.
- Server Components, Server Actions y Route Handlers para la capa servidor.
- PostgreSQL desde codigo servidor, nunca desde componentes cliente.
- `docs/`: PRD, arquitectura, planes, decisiones.
- `skills/`: skills propias versionables del proyecto.

## Skill local incluida

La carpeta `skills/payment-compliance/` contiene una skill especifica del dominio. No reemplaza `AGENTS.md`: se usa cuando se trabaja sobre el calculo de faltantes/duplicados o reglas de pago.

Importante: al estar dentro del repo, funciona como referencia versionable del proyecto. Para que Codex la detecte automaticamente en todas las sesiones, habria que instalarla o enlazarla en el directorio global de skills del entorno correspondiente. Mientras tanto, cualquier agente puede leerla directamente como archivo del proyecto.

## Nota de versiones

Al 2026-08-27, la version estable publicada de React en npm es `19.2.8` y la de Next.js es `16.3.3`. Antes de instalar dependencias reales, verificar de nuevo con:

```bash
pnpm view react version
pnpm view next version
```
