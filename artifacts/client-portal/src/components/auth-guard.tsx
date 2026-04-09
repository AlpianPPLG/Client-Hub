import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      setLocation("/");
      return;
    }

    if (!requireAuth && user) {
      setLocation("/dashboard");
      return;
    }

    if (requireAdmin && user?.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [isLoading, user, requireAuth, requireAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user) {
    return null;
  }

  if (requireAdmin && user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
