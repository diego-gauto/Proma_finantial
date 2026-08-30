import { Button } from "@/components/ui/Button";

import styles from "./UserCreateForm.module.css";

interface UserCreateFormProps {
  action: (formData: FormData) => void | Promise<void>;
}

export function UserCreateForm({ action }: UserCreateFormProps) {
  return (
    <form action={action} className={styles.form}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="email">Mail</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            placeholder="usuario@promatexsrl.com"
            required
            type="email"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Clave inicial</label>
          <input
            autoComplete="new-password"
            id="password"
            minLength={6}
            name="password"
            required
            type="password"
          />
        </div>
        <Button type="submit" variant="primary">
          Crear usuario
        </Button>
      </div>
      <p className={styles.hint}>
        Todos los usuarios tienen el mismo acceso en esta version.
      </p>
    </form>
  );
}
