import type { CategorySpend } from "@/server/dashboard/get-category-spend";

const colors = ["#0f766e", "#2563eb", "#a15c07", "#7c3aed", "#be123c"];

export function CategorySpendPie({ spend }: { spend: CategorySpend }) {
  if (!spend.items.length) {
    return <div className="pie-empty">Sin gastos procesados</div>;
  }

  const segments = spend.items.reduce<{
    cursor: number;
    values: string[];
  }>(
    (state, item, index) => {
      const nextCursor = state.cursor + item.percentage;

      return {
        cursor: nextCursor,
        values: [
          ...state.values,
          `${colors[index % colors.length]} ${state.cursor}% ${nextCursor}%`
        ]
      };
    },
    { cursor: 0, values: [] }
  ).values;

  return (
    <div
      aria-label={`Total gastado ${spend.totalAmount}`}
      className="spend-pie"
      style={{ background: `conic-gradient(${segments.join(", ")})` }}
    />
  );
}
