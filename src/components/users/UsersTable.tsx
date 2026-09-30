import type { PublicUser } from "@/server/users/users.repository";
import { formatDisplayDateTime } from "@/shared/format";

import styles from "./UsersTable.module.css";

export function UsersTable({ users }: { users: PublicUser[] }) {
  if (!users.length) {
    return <p className={styles.empty}>No hay usuarios cargados.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mail</th>
            <th>Creado</th>
            <th>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{formatDisplayDateTime(user.createdAt)}</td>
              <td>{formatDisplayDateTime(user.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
