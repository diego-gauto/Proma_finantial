import { describe, expect, it } from "vitest";

import { parsePaymentRuleForm } from "./payment-rule-form";

describe("parsePaymentRuleForm", () => {
  it("parses a monthly rule form into database input", () => {
    expect(
      parsePaymentRuleForm({
        activeFrom: "2026-01-01",
        appliesToDescendants: "on",
        categoryNodeId: "12",
        fiscalPeriodKind: "month",
        graceDays: "5",
        intervalMonths: "1",
        name: "Servicios mensuales",
        notes: "Avisar temprano",
        paymentDay: "15",
        paymentMonth: "",
        paymentMonthOffset: "1",
        paymentYearOffset: "0",
        reminderDaysBefore: "7"
      })
    ).toEqual({
      activeFrom: "2026-01-01",
      activeTo: null,
      appliesToDescendants: true,
      categoryNodeId: "12",
      customPeriodMonths: null,
      fiscalPeriodKind: "month",
      graceDays: 5,
      intervalMonths: 1,
      name: "Servicios mensuales",
      notes: "Avisar temprano",
      paymentDay: 15,
      paymentMonth: null,
      paymentMonthOffset: 1,
      paymentYearOffset: 0,
      reminderDaysBefore: 7
    });
  });

  it("rejects invalid payment days", () => {
    expect(() =>
      parsePaymentRuleForm({
        activeFrom: "2026-01-01",
        categoryNodeId: "12",
        fiscalPeriodKind: "month",
        graceDays: "0",
        intervalMonths: "1",
        name: "Regla",
        paymentDay: "45",
        paymentMonthOffset: "0",
        paymentYearOffset: "0",
        reminderDaysBefore: "0"
      })
    ).toThrow("Dia de pago invalido.");
  });
});
