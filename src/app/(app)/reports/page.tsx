import { BackLink } from "@/components/navigation/BackLink";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getServerEnv } from "@/server/env";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const env = getServerEnv();
  const metabaseUrl = env.METABASE_SITE_URL;

  return (
    <div className={styles.page}>
      <BackLink href="/" />
      <Card title="Reportes opcionales">
        <div className={styles.status}>
          <h3>{metabaseUrl ? "Metabase configurado" : "Metabase no configurado"}</h3>
          <p>
            Metabase queda como herramienta externa para exploracion o reportes
            futuros. La app no embebe dashboards productivos en el flujo
            principal.
          </p>
          {metabaseUrl ? (
            <div className={styles.actions}>
              <Button href={metabaseUrl} variant="primary">
                Abrir Metabase
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Configuracion esperada">
        <dl className={styles.details}>
          <div>
            <dt>URL</dt>
            <dd>{metabaseUrl ?? "Definir METABASE_SITE_URL"}</dd>
          </div>
          <div>
            <dt>Uso en v1</dt>
            <dd>Referencia visual y reportes externos, sin embed en Inicio.</dd>
          </div>
          <div>
            <dt>Datos</dt>
            <dd>Debe apuntar a la misma base vigente de documentos.</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
