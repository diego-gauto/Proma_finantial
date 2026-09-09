import Link from "next/link";

import styles from "./BackLink.module.css";

interface BackLinkProps {
  href: string;
}

export function BackLink({ href }: BackLinkProps) {
  return (
    <Link className={styles.backLink} href={href}>
      <span aria-hidden="true" className={styles.icon} />
      Volver
    </Link>
  );
}
