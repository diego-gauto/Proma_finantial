import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function UsersPage() {
  return (
    <Card title="Usuarios">
      <EmptyState title="Alta pendiente">
        Esta seccion va a permitir agregar usuarios sin intervencion tecnica.
      </EmptyState>
    </Card>
  );
}
