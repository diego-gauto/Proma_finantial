import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CategoriesPage() {
  return (
    <Card title="Categorias">
      <EmptyState title="Arbol pendiente">
        La Fase 2 prepara el arbol y la Fase 4 agrega edicion y reglas por nodo.
      </EmptyState>
    </Card>
  );
}
