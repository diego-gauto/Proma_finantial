import Link from "next/link";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/documents", label: "Documentos" },
  { href: "/categories", label: "Categorias" },
  { href: "/rules", label: "Reglas" },
  { href: "/users", label: "Usuarios" },
  { href: "/reports", label: "Reportes" }
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
    </header>
  );
}
