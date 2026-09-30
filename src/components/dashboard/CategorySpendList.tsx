import type { CategorySpend } from "@/server/dashboard/get-category-spend";
import { formatMoney } from "@/shared/format";

import { getCategoryColor } from "./chart-colors";
import styles from "./CategorySpendList.module.css";

export function CategorySpendList({ spend }: { spend: CategorySpend }) {
  return (
    <div className={styles.list}>
      {spend.items.map((item, index) => (
        <div className={styles.row} key={item.categoryId}>
          <div>
            <strong>
              <span
                aria-hidden="true"
                className={styles.swatch}
                style={{ backgroundColor: getCategoryColor(index) }}
              />
              {item.categoryName}
            </strong>
            <span>{item.paymentCount} pagos</span>
          </div>
          <div>
            <strong>{formatMoney(item.amount)}</strong>
            <span>{item.percentage}%</span>
          </div>
        </div>
      ))}
      {!spend.items.length ? (
        <p className="muted">No hay documentos procesados para estos filtros.</p>
      ) : null}
    </div>
  );
}
