import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/documents", label: "Documentos" },
  { href: "/categories", label: "Categorias" },
  { href: "/rules", label: "Reglas" },
  { href: "/users", label: "Usuarios" }
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("fd_session");

  if (!session?.value) {
    redirect("/auth/login");
  }

  return (
    <div className="app-shell">
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
      <main className="main">
        <section className="panel">
          <div className="panel-header">
            <h1>Inicio operativo</h1>
          </div>
          <div className="panel-body">
            <p className="muted">
              Base tecnica lista para conectar autenticacion, documentos,
              categorias, reglas y calculos operativos.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
