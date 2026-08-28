import type { MonthlySeriesItem } from "@/server/dashboard/get-monthly-series";

export function MonthlyPaymentCountChart({
  series
}: {
  series: MonthlySeriesItem[];
}) {
  const maxCount = Math.max(...series.map((item) => item.paymentCount), 0);

  return (
    <section className="chart-panel">
      <h2>Cantidad de pagos por mes</h2>
      {series.length ? (
        <div className="bar-chart">
          {series.map((item) => (
            <div className="bar-row" key={item.month}>
              <span>{item.month}</span>
              <div>
                <i style={{ width: `${(item.paymentCount / maxCount) * 100}%` }} />
              </div>
              <strong>{item.paymentCount}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Sin pagos procesados para graficar.</p>
      )}
    </section>
  );
}
