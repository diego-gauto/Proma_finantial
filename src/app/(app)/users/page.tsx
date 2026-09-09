import { UserCreateForm } from "@/components/users/UserCreateForm";
import { UsersTable } from "@/components/users/UsersTable";
import { BackLink } from "@/components/navigation/BackLink";
import { Card } from "@/components/ui/Card";
import { listUsers } from "@/server/users/users.repository";

import { createUserAction } from "./actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await listUsers();

  return (
    <div className={styles.page}>
      <BackLink href="/" />
      <section className={styles.summary}>
        <div className={styles.metric}>
          <span>Usuarios activos</span>
          <strong>{users.length}</strong>
        </div>
        <div className={styles.metric}>
          <span>Permisos</span>
          <strong>Unico nivel</strong>
        </div>
      </section>

      <Card title="Agregar usuario">
        <UserCreateForm action={createUserAction} />
      </Card>

      <Card title="Usuarios cargados">
        <UsersTable users={users} />
      </Card>
    </div>
  );
}
