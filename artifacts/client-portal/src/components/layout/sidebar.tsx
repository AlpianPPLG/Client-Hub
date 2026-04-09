import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Settings,
  LogOut,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Requests", href: "/requests", icon: FileText },
    ...(isAdmin ? [{ name: "Clients", href: "/clients", icon: Users }] : []),
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary hover:opacity-90 transition-opacity">
          <Palette className="h-6 w-6" />
          <span>StudioPortal</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    isActive ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user?.name}</span>
            <span className="truncate text-xs text-muted-foreground capitalize">{user?.role}</span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" onClick={() => logout()}>
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
