import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HomePage() {
  return (
    <Card title="Inicio operativo">
      <EmptyState title="Base operativa lista">
        La proxima etapa conecta documentos, categorias y calculos del tablero.
      </EmptyState>
    </Card>
  );
}
