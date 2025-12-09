import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Warehouse, History, LogOut, User } from "lucide-react";

const navItems = [
  { path: "/", label: "Борлуулалт", icon: ShoppingCart },
  { path: "/warehouse", label: "Агуулах", icon: Warehouse },
  { path: "/history", label: "Түүх", icon: History },
];

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline font-semibold text-lg">
              Агуулах
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`gap-2 ${isActive ? "font-medium" : ""}`}
                    data-testid={`nav-${item.path === "/" ? "sales" : item.path.slice(1)}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span data-testid="text-username">{user.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Гарах"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
