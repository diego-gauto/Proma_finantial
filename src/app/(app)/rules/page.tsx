import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function RulesPage() {
  return (
    <Card title="Reglas">
      <EmptyState title="Reglas pendientes">
        La Fase 4 agrega CRUD y vigencia historica para reglas de pago.
      </EmptyState>
    </Card>
  );
}
