# Findings & Decisions

## Requirements
- Add persistence for user decisions to stop showing calculated missing and duplicate issues.
- Use the persisted decisions when recalculating dashboard compliance data.
- Add UI buttons for "dejar de mostrar faltante" and "dejar de mostrar duplicado".
- Do not mutate real `documents` or historical `payment_rules` to hide one-off operational decisions.

## Research Findings
- `documents` represents real payments/comprobantes; duplicate operational alerts are derived from multiple processed documents with the same category/period/kind.
- Missing issues are derived expected periods without processed documents and are not stored as payments.
- Dashboard data is assembled in `src/server/dashboard/dashboard-compliance.ts`.
- The pure compliance calculation is in `src/server/compliance/calculate-status.ts`.
- Existing issue row IDs already encode issue type, category, fiscal period, and fiscal period kind.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| One table: `compliance_issue_resolutions` | Avoids duplicating repository/action/UI behavior for two issue types with the same lifecycle. |
| Filter after calculation | Keeps generated expectations dynamic and avoids creating `expected_payments`. |
| Fingerprint includes sorted duplicate document IDs | A previously resolved duplicate is shown again if a new document joins the duplicate set. |
| Missing fingerprint includes rule ID | If the applicable rule changes for a period, the old waiver should not blindly hide a newly calculated issue. |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Sandbox failed before command execution | Used escalated reads/writes only as needed, with no destructive commands. |
| `apply_patch` unavailable due sandbox helper failure | Used a scoped escalated Python writer and recorded the deviation. |

## Resources
- `src/server/compliance/calculate-status.ts`
- `src/server/dashboard/dashboard-compliance.ts`
- `src/server/dashboard/compliance-issue-view-model.ts`
- `src/components/dashboard/ComplianceIssueTable.tsx`
- `docs/data-model.md`
