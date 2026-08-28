import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DocumentsPage() {
  return (
    <Card title="Documentos">
      <EmptyState title="Listado pendiente">
        La Fase 2 agrega repositorios y filtros para documentos procesados.
      </EmptyState>
    </Card>
  );
}
