import { OverduePaymentsPanel } from "@/components/dashboard/OverduePaymentsPanel";
import { UpcomingPaymentsPanel } from "@/components/dashboard/UpcomingPaymentsPanel";
import { BackLink } from "@/components/navigation/BackLink";
import { getCurrentMonthPaymentStatusData } from "@/server/dashboard/dashboard-compliance";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function PaymentStatusPage() {
  const data = await getPaymentStatusPageData();

  return (
    <div className={styles.page}>
      <BackLink href="/" />

      {data.dataNotice ? (
        <section className="notice-panel">
          <h2>Datos pendientes de conexion</h2>
          <p>{data.dataNotice}</p>
        </section>
      ) : null}

      <section className={styles.listStack}>
        <OverduePaymentsPanel
          categories={data.categories}
          overdue={data.overdue}
          today={data.today}
        />
        <UpcomingPaymentsPanel
          categories={data.categories}
          today={data.today}
          upcoming={data.upcoming}
        />
      </section>
    </div>
  );
}

async function getPaymentStatusPageData() {
  try {
    return {
      ...(await getCurrentMonthPaymentStatusData()),
      dataNotice: null
    };
  } catch (error) {
    return {
      categories: [],
      dataNotice:
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los pagos del mes en curso.",
      overdue: [],
      today: new Date().toISOString().slice(0, 10),
      upcoming: []
    };
  }
}
