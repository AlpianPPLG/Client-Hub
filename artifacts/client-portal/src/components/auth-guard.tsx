import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children, requireAuth = true, requireAdmin = false }: { children: ReactNode, requireAuth?: boolean, requireAdmin?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    setLocation("/");
    return null;
  }

  if (!requireAuth && user) {
    setLocation("/dashboard");
    return null;
  }

  if (requireAdmin && user?.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  return <>{children}</>;
}
