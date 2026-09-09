import { describe, expect, it } from "vitest";

import { parsePaymentRuleForm } from "./payment-rule-form";

describe("parsePaymentRuleForm", () => {
  it("parses a bimonthly even-month rule paid the following month", () => {
    expect(
      parsePaymentRuleForm({
        activeFromMonth: "2026-02",
        appliesToDescendants: "on",
        bimonthlyParity: "even",
        categoryNodeId: "18",
        graceDays: "5",
        name: "Convenio bimestral",
        paymentDay: "12",
        paymentTiming: "next_month",
        periodicity: "bimonthly",
        reminderDaysBefore: "7"
      })
    ).toEqual({
      activeFrom: "2026-02-01",
      activeTo: null,
      anchorPeriodMonth: 2,
      appliesToDescendants: true,
      categoryNodeId: "18",
      customPeriodMonths: null,
      fiscalPeriodKind: "month",
      graceDays: 5,
      intervalMonths: 2,
      name: "Convenio bimestral",
      notes: null,
      paymentDay: 12,
      paymentMonth: null,
      paymentMonthOffset: 1,
      paymentYearOffset: 0,
      reminderDaysBefore: 7
    });
  });

  it("parses an annual rule paid inside the fiscal period", () => {
    expect(
      parsePaymentRuleForm({
        activeFromMonth: "2026-01",
        categoryNodeId: "9",
        graceDays: "10",
        name: "Dominio",
        paymentDay: "20",
        paymentMonthWithinPeriod: "1",
        paymentTiming: "within_period",
        periodicity: "annual",
        reminderDaysBefore: "15"
      })
    ).toMatchObject({
      activeFrom: "2026-01-01",
      anchorPeriodMonth: 1,
      customPeriodMonths: null,
      fiscalPeriodKind: "month",
      intervalMonths: 12,
      paymentMonth: null,
      paymentMonthOffset: 0,
      paymentYearOffset: 0
    });
  });

  it("parses an annual rule paid after the fiscal period end", () => {
    expect(
      parsePaymentRuleForm({
        activeFromMonth: "2026-01",
        categoryNodeId: "9",
        graceDays: "10",
        monthsAfterPeriodEnd: "6",
        name: "Bienes personales",
        paymentDay: "20",
        paymentTiming: "after_period_end",
        periodicity: "annual",
        reminderDaysBefore: "15"
      })
    ).toMatchObject({
      activeFrom: "2026-01-01",
      anchorPeriodMonth: 12,
      customPeriodMonths: null,
      fiscalPeriodKind: "month",
      intervalMonths: 12,
      paymentMonth: null,
      paymentMonthOffset: 6,
      paymentYearOffset: 0
    });
  });

  it("parses a quarterly rule paid inside the second month of each period", () => {
    expect(
      parsePaymentRuleForm({
        activeFromMonth: "2026-01",
        categoryNodeId: "9",
        graceDays: "5",
        name: "Trimestral interno",
        paymentDay: "15",
        paymentMonthWithinPeriod: "2",
        paymentTiming: "within_period",
        periodicity: "quarterly",
        reminderDaysBefore: "7"
      })
    ).toMatchObject({
      anchorPeriodMonth: 2,
      fiscalPeriodKind: "month",
      intervalMonths: 3,
      paymentMonthOffset: 0,
      paymentYearOffset: 0
    });
  });

  it("parses an explicit no-control rule that does not generate expected payments", () => {
    expect(
      parsePaymentRuleForm({
        activeFromMonth: "2026-01",
        categoryNodeId: "9",
        name: "Sin avisos",
        paymentTiming: "same_month",
        periodicity: "no_pattern"
      })
    ).toMatchObject({
      customPeriodMonths: null,
      fiscalPeriodKind: "month",
      intervalMonths: null,
      paymentMonth: null,
      paymentMonthOffset: 0,
      paymentYearOffset: 0
    });
  });

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
      anchorPeriodMonth: 1,
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

  it("parses comma-separated custom fiscal months", () => {
    expect(
      parsePaymentRuleForm({
        activeFrom: "2026-01-01",
        categoryNodeId: "12",
        customPeriodMonths: "1, 4, 10",
        fiscalPeriodKind: "month",
        graceDays: "0",
        intervalMonths: "",
        name: "Regla custom",
        paymentDay: "10",
        paymentMonthOffset: "1",
        paymentYearOffset: "0",
        reminderDaysBefore: "0"
      }).customPeriodMonths
    ).toEqual([1, 4, 10]);
  });

  it("ignores custom fiscal months when a fixed interval is selected", () => {
    const parsed = parsePaymentRuleForm({
      activeFrom: "2026-01-01",
      categoryNodeId: "12",
      customPeriodMonths: "1, 4, 10",
      fiscalPeriodKind: "month",
      graceDays: "0",
      intervalMonths: "1",
      name: "Regla mensual",
      paymentDay: "10",
      paymentMonthOffset: "1",
      paymentYearOffset: "0",
      reminderDaysBefore: "0"
    });

    expect(parsed.intervalMonths).toBe(1);
    expect(parsed.customPeriodMonths).toBeNull();
  });

  it("rejects custom fiscal months outside the calendar range", () => {
    expect(() =>
      parsePaymentRuleForm({
        activeFrom: "2026-01-01",
        categoryNodeId: "12",
        customPeriodMonths: "1, 13",
        fiscalPeriodKind: "month",
        graceDays: "0",
        intervalMonths: "",
        name: "Regla custom",
        paymentDay: "10",
        paymentMonthOffset: "1",
        paymentYearOffset: "0",
        reminderDaysBefore: "0"
      })
    ).toThrow("Meses custom invalidos.");
  });
});
