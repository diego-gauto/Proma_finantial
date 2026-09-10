import Link from "next/link";

import { logoutAction } from "./logout-action";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/payment-status", label: "Proximos Pagos y Vencidos" },
  { href: "/categories", label: "Categorias" },
  { href: "/users", label: "Usuarios" }
];

export function AppNav() {
  return (
    <header className="topbar">
      <div className="brand">
        <p className="brand-title">Control de pagos</p>
        <p className="brand-subtitle">Operacion interna</p>
      </div>
      <nav className="nav" aria-label="Navegacion principal">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <details className="profile-menu">
        <summary aria-label="Abrir perfil">GP</summary>
        <div className="profile-popover">
          <p>GP</p>
          <form action={logoutAction}>
            <button type="submit">Cerrar sesion</button>
          </form>
        </div>
      </details>
    </header>
  );
}
