import { Button } from "@/components/ui/Button";

import styles from "./route-state.module.css";

export default function NotFound() {
  return (
    <main className={styles.statePage}>
      <section className={styles.statePanel}>
        <h1>No encontramos esta vista</h1>
        <p>
          El documento o la categoria pueden no existir, estar inactivos o haber
          cambiado desde la ultima carga.
        </p>
        <div className={styles.actions}>
          <Button href="/">Volver al inicio</Button>
          <Button href="/documents">Ir a documentos</Button>
        </div>
      </section>
    </main>
  );
}
