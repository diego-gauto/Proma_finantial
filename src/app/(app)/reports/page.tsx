import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ReportsPage() {
  return (
    <Card title="Reportes">
      <EmptyState title="Reportes opcionales">
        Metabase queda disponible como apoyo, sin bloquear la operacion diaria.
      </EmptyState>
    </Card>
  );
}
