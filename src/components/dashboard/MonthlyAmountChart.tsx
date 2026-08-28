import type { MonthlySeriesItem } from "@/server/dashboard/get-monthly-series";

export function MonthlyAmountChart({ series }: { series: MonthlySeriesItem[] }) {
  const maxAmount = Math.max(...series.map((item) => item.amount), 0);

  return (
    <section className="chart-panel">
      <h2>Importe por mes de pago</h2>
      {series.length ? (
        <div className="bar-chart">
          {series.map((item) => (
            <div className="bar-row" key={item.month}>
              <span>{item.month}</span>
              <div>
                <i style={{ width: `${(item.amount / maxAmount) * 100}%` }} />
              </div>
              <strong>{formatAmount(item.amount)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Elegí un periodo o esperá documentos procesados.</p>
      )}
    </section>
  );
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0
  }).format(amount);
}
