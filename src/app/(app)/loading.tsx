import styles from "./route-state.module.css";

export default function Loading() {
  return (
    <main className={styles.statePage} aria-label="Cargando vista">
      <section className={styles.statePanel}>
        <h1>Cargando datos operativos</h1>
        <p>Preparando la vista con la informacion disponible.</p>
        <div className={styles.skeletonStack} aria-hidden="true">
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonPanel} />
          <div className={styles.skeletonPanel} />
        </div>
      </section>
    </main>
  );
}
