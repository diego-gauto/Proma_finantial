import type {
  CategoryNodeRow,
  FiscalPeriodKind,
  PaymentRuleCadence,
  ProcessingStatus
} from "@/db/types";

export interface ComplianceRule {
  id: string;
  categoryNodeId: string;
  appliesToDescendants: boolean;
  name: string;
  cadence: PaymentRuleCadence;
  customPeriodMonths: number | null;
  anchorPeriodMonth: number | null;
  fiscalPeriodKind: FiscalPeriodKind;
  paymentMonth: number | null;
  paymentDay: number | null;
  paymentYearOffset: number;
  paymentMonthOffset: number;
  activeFrom: string;
  activeTo: string | null;
  graceDays: number;
  reminderDaysBefore: number;
  active: boolean;
  notes: string | null;
}

export interface ComplianceDocument {
  id: string;
  categoryNodeId: string | null;
  fiscalPeriod: string | null;
  fiscalPeriodKind: FiscalPeriodKind;
  processingStatus: ProcessingStatus;
}

export interface ExpectedPeriod {
  categoryNodeId: string;
  fiscalPeriod: string;
  fiscalPeriodKind: FiscalPeriodKind;
  dueDate: string;
  rule: ComplianceRule;
}

export interface ComplianceStatus {
  expected: ExpectedPeriod[];
  missing: ExpectedPeriod[];
  overdue: ExpectedPeriod[];
  upcoming: ExpectedPeriod[];
  duplicates: Array<{
    categoryNodeId: string;
    fiscalPeriod: string;
    fiscalPeriodKind: FiscalPeriodKind;
    documentIds: string[];
  }>;
}

export type ComplianceCategory = Pick<
  CategoryNodeRow,
  "id" | "parentId" | "name" | "sortOrder"
>;
