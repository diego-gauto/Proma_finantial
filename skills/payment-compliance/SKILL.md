---
name: payment-compliance
description: Use when implementing or reviewing missing-payment, duplicate-document, fiscal-period, or payment-rule logic for this financial dashboard. Not for generic UI or setup tasks.
---

# Payment Compliance Logic

Use this skill only for the compliance core of the app: payment rules, expected fiscal periods, missing documents and duplicates.

## Read Before Work

- `docs/02-prd-app.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/interface.md`

## Core Concepts

- A `document` is evidence of a real payment.
- Do not create `expected_payments` in v1. Expected payments are generated at query/calculation time.
- Fiscal period and payment date/month are different dimensions.
- `processing_status = 'processed'` is the only status that satisfies an expected payment.
- `review_required` and `error` never count as paid until a human confirms the correction.
- Overdue and upcoming payments are views over the same expected-period calculation, filtered by due date and reminder window.

## Missing Documents Algorithm

1. Load active and historical `payment_rules` for the selected date range.
2. For each category node, resolve the applicable rule:
   - prefer a rule directly attached to the node;
   - otherwise use the nearest ancestor rule with `applies_to_descendants = true`;
   - ignore `no_pattern` rules for missing-payment generation.
3. Generate expected fiscal periods between `active_from` and `active_to`, or today when `active_to` is null.
4. Use the rule that was valid for each fiscal period, not merely the rule valid today.
5. Match only processed documents by:
   - `category_node_id`;
   - `fiscal_period`;
   - `fiscal_period_kind`.
6. Apply `grace_days` before marking a recent expected period as missing.

## Overdue And Upcoming

- Overdue: an expected period has no processed document and its probable payment date plus `grace_days` is before today.
- Upcoming: an expected period has no processed document and its probable payment date falls within the configured reminder window.
- These are not separate tables in v1.

## Duplicate Documents Algorithm

A duplicate exists when two or more processed documents match the same:

- category node;
- fiscal period;
- fiscal period kind;
- payment rule context, when available.

Expose links to all involved documents. Do not auto-resolve duplicates in v1.

## Required Tests

Any change to this area must cover:

- monthly rule with existing processed document;
- monthly rule missing after grace period;
- own rule overriding inherited ancestor rule;
- inherited ancestor rule applying to descendants;
- historical rule applying to past periods;
- duplicate processed documents for the same node and period;
- `review_required` and `error` documents not satisfying expected periods.
- overdue and upcoming views derived from the same expected-period data.

## Implementation Shape

- Put pure calculation helpers in `src/server/compliance/`.
- Put database reads in `src/db/`.
- Keep UI formatting separate from compliance calculations.
- Prefer pure functions for period generation and rule resolution so tests do not require a live database.
