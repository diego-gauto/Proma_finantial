import { Button } from "@/components/ui/Button";
import type { DashboardAlerts } from "@/server/dashboard/get-dashboard-alerts";

export function ReviewRequiredAlert({ alerts }: { alerts: DashboardAlerts }) {
  const total = alerts.reviewRequiredCount + alerts.errorCount;

  if (!total) {
    return (
      <section
        aria-hidden="true"
        className="alert-panel alert-panel-placeholder"
      />
    );
  }

  return (
    <section className="alert-panel" aria-label="Documentos a revisar">
      <div>
        <h2>Hay documentos que requieren intervencion</h2>
        <p>
          {alerts.reviewRequiredCount} en revision y {alerts.errorCount} con
          error de procesamiento.
        </p>
      </div>
      <Button href="/documents/review" variant="primary">
        Revisar
      </Button>
    </section>
  );
}
