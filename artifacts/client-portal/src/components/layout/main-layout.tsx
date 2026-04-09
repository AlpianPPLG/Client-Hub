import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { AuthGuard } from "../auth-guard";

export function MainLayout({ children, requireAdmin = false }: { children: ReactNode, requireAdmin?: boolean }) {
  return (
    <AuthGuard requireAdmin={requireAdmin}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
