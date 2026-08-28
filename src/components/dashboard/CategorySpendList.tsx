import type { CategorySpend } from "@/server/dashboard/get-category-spend";

export function CategorySpendList({ spend }: { spend: CategorySpend }) {
  return (
    <div className="spend-list">
      {spend.items.map((item) => (
        <div className="spend-row" key={item.categoryId}>
          <div>
            <strong>{item.categoryName}</strong>
            <span>{item.paymentCount} pagos</span>
          </div>
          <div>
            <strong>{formatCurrency(item.amount)}</strong>
            <span>{item.percentage}%</span>
          </div>
        </div>
      ))}
      {!spend.items.length ? (
        <p className="muted">No hay documentos procesados para estos filtros.</p>
      ) : null}
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(amount);
}
