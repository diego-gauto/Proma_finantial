# Task Plan: Compliance Issue Resolutions

## Goal
Persist human decisions for calculated missing-payment and duplicate-document issues, then filter those resolved issues out of the dashboard while preserving real documents and historical rules.

## Current Phase
Phase 5

## Phases

### Phase 1: Discovery And Design
- [x] Confirm repo rules and branch.
- [x] Review compliance calculation and dashboard data flow.
- [x] Decide one table for both issue types.
- **Status:** complete

### Phase 2: Test-First Compliance Filtering
- [x] Add failing tests for hiding resolved missing issues.
- [x] Add failing tests for hiding resolved duplicate issues only when document IDs still match.
- [x] Implement minimal pure filtering logic.
- **Status:** complete

### Phase 3: Persistence And Actions
- [x] Add SQL for `compliance_issue_resolutions`.
- [x] Add DB repository/types for listing and creating resolutions.
- [x] Add server action for resolving missing and duplicate rows.
- [x] Apply SQL to configured database.
- **Status:** complete

### Phase 4: Dashboard UI
- [x] Pass resolution action through missing/duplicate cards.
- [x] Add buttons to stop showing a missing/duplicate issue.
- [x] Preserve current dashboard filters after action.
- **Status:** complete

### Phase 5: Verification
- [x] Run targeted tests.
- [x] Run full test suite.
- [x] Run production build.
- [x] Review git diff and report touched files/commands/results.
- **Status:** complete

## Key Questions
1. One table or two? Answer: one table, because both are human resolutions for calculated compliance issues.
2. How to avoid hiding new duplicate changes? Answer: store a fingerprint based on category, period, kind and sorted document IDs.

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use `compliance_issue_resolutions` as one table | Missing and duplicate cases share lifecycle, audit needs, category/period identity, and active/inactive behavior. |
| Keep `calculateComplianceStatus` pure | It remains the source calculation; resolutions are applied as a separate filter before UI. |
| Store duplicate document IDs and fingerprint | If the duplicate set changes, the old resolution no longer suppresses a new issue. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Sandbox command startup failed with `mountinfo path is not absolute` | 1 | Used approved escalated command reads because no file changes could run in sandbox. |
| `apply_patch` failed with same sandbox error | 1 | Used escalated Python file write because patch tool has no escalation path. |
| Full test suite failed after view-model metadata addition | 1 | Updated existing view-model tests to assert new metadata fields. |
| Build failed on `FiscalPeriodKind` import | 1 | Imported `FiscalPeriodKind` from `@/db/types` instead of compliance types. |
