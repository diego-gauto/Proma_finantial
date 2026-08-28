import type { DocumentRow } from "@/db/types";
import type { ComplianceStatus } from "@/server/compliance/compliance-types";

export interface DashboardAlerts {
  reviewRequiredCount: number;
  errorCount: number;
  missingCount: number;
  duplicateCount: number;
}

export function getDashboardAlerts({
  documents,
  compliance
}: {
  documents: DocumentRow[];
  compliance: ComplianceStatus;
}): DashboardAlerts {
  return {
    reviewRequiredCount: documents.filter(
      (document) => document.processingStatus === "review_required"
    ).length,
    errorCount: documents.filter(
      (document) => document.processingStatus === "error"
    ).length,
    missingCount: compliance.missing.length,
    duplicateCount: compliance.duplicates.length
  };
}
