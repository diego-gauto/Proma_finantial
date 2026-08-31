"use client";

import { Button } from "@/components/ui/Button";

import styles from "./route-state.module.css";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className={styles.statePage}>
      <section className={styles.statePanel} role="alert">
        <h1>No se pudo cargar esta vista</h1>
        <p>
          La operacion no se completo. Podés reintentar sin salir de la
          pantalla.
        </p>
        <div className={styles.actions}>
          <Button onClick={reset} type="button" variant="primary">
            Reintentar
          </Button>
          <Button href="/">Volver al inicio</Button>
        </div>
      </section>
    </main>
  );
}
