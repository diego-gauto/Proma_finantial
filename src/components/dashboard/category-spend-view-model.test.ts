import { describe, expect, it } from "vitest";

import { buildCompactSpendLegend } from "./category-spend-view-model";

describe("buildCompactSpendLegend", () => {
  it("keeps the most relevant categories with color, amount and percentage", () => {
    const legend = buildCompactSpendLegend(
      {
        totalAmount: 1000,
        items: [
          {
            amount: 600,
            categoryId: "taxes",
            categoryName: "Obligaciones Fiscales",
            paymentCount: 3,
            percentage: 60
          },
          {
            amount: 300,
            categoryId: "services",
            categoryName: "Servicios",
            paymentCount: 2,
            percentage: 30
          },
          {
            amount: 100,
            categoryId: "other",
            categoryName: "Otros",
            paymentCount: 1,
            percentage: 10
          }
        ]
      },
      2
    );

    expect(legend).toEqual([
      {
        amountLabel: "$ 600",
        categoryId: "taxes",
        categoryName: "Obligaciones Fiscales",
        color: "#76d64b",
        paymentCountLabel: "3 pagos",
        percentageLabel: "60%"
      },
      {
        amountLabel: "$ 300",
        categoryId: "services",
        categoryName: "Servicios",
        color: "#f3b45d",
        paymentCountLabel: "2 pagos",
        percentageLabel: "30%"
      }
    ]);
  });
});
