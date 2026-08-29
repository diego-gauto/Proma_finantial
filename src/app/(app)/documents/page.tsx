import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DocumentsPage() {
  return (
    <Card title="Documentos">
      <EmptyState title="Listado pendiente">
        La Fase 4 agrega el listado filtrable y el detalle para faltantes, duplicados y documentos procesados.
      </EmptyState>
    </Card>
  );
}
