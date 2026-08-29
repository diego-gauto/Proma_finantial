import { describe, expect, it } from "vitest";

import { buildCompactSpendLegend } from "./category-spend-view-model";

describe("buildCompactSpendLegend", () => {
  it("keeps every category with color, amount and percentage", () => {
    const legend = buildCompactSpendLegend({
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
    });

    expect(legend).toEqual([
      {
        amountLabel: "$ 600",
        categoryId: "taxes",
        categoryName: "Obligaciones Fiscales",
        color: "#76d64b",
        paymentCountLabel: "3 pagos",
        percentageLabel: "60.00%"
      },
      {
        amountLabel: "$ 300",
        categoryId: "services",
        categoryName: "Servicios",
        color: "#f3b45d",
        paymentCountLabel: "2 pagos",
        percentageLabel: "30.00%"
      },
      {
        amountLabel: "$ 100",
        categoryId: "other",
        categoryName: "Otros",
        color: "#6f8cff",
        paymentCountLabel: "1 pago",
        percentageLabel: "10.00%"
      }
    ]);
  });

  it("does not truncate long legends because every rendered slice needs a row", () => {
    const legend = buildCompactSpendLegend({
      totalAmount: 3600,
      items: Array.from({ length: 8 }, (_, index) => ({
        amount: 800 - index * 50,
        categoryId: `category-${index}`,
        categoryName: `Categoria ${index}`,
        paymentCount: 1,
        percentage: 12.5
      }))
    });

    expect(legend).toHaveLength(8);
  });
});
