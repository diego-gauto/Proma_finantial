import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ReportsPage() {
  return (
    <Card title="Reportes">
      <EmptyState title="Reportes opcionales">
        Los reportes externos quedan fuera del flujo principal por ahora.
      </EmptyState>
    </Card>
  );
}
