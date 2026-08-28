export type FiscalPeriodKind = "month" | "year" | "unknown";

export type ProcessingStatus =
  | "pending"
  | "processed"
  | "review_required"
  | "error";

export type PaymentRuleCadence =
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "four_monthly"
  | "semiannual"
  | "annual"
  | "custom"
  | "no_pattern";

export interface DocumentRow {
  id: string;
  driveFileId: string | null;
  driveUrl: string | null;
  fileName: string | null;
  drivePath: string | null;
  categoryNodeId: string | null;
  paymentDate: string | null;
  paymentTime: string | null;
  fiscalPeriod: string | null;
  fiscalPeriodKind: FiscalPeriodKind;
  amount: string | null;
  currency: string | null;
  reason: string | null;
  reference: string | null;
  issuer: string | null;
  payee: string | null;
  userNote: string | null;
  rawText: string | null;
  extractedData: unknown;
  processingStatus: ProcessingStatus;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryNodeRow {
  id: string;
  parentId: string | null;
  name: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRuleRow {
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
