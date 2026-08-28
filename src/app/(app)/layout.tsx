import { AppNav } from "@/components/navigation/AppNav";

export default function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell">
      <AppNav />
      <main className="main">{children}</main>
    </div>
  );
}
