import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="lg:ml-60 mt-16 p-4 lg:p-6">
        <Outlet />
      </main>
      <footer className="lg:ml-60 py-4 px-4 lg:px-6 border-t border-border text-center text-sm text-muted-foreground">
        © 2024 ESTUD.AI — Todos os direitos reservados.
      </footer>
    </div>
  );
}