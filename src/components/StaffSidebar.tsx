import { Button } from "./ui/button";
import {
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { getCurrentUser, logout } from "../utils/auth";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { History } from "lucide-react";

interface StaffSidebarProps {
  onLogout: () => void;
  menuOpen?: boolean;
  onCloseMenu?: () => void;
}

export function StaffSidebar({ onLogout, menuOpen, onCloseMenu }: StaffSidebarProps) {
  const user = getCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const visible = typeof menuOpen === 'boolean' ? menuOpen : isOpen;

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setIsOpen((s) => !s);
    window.addEventListener('toggleSidebar', handler as EventListener);
    return () => window.removeEventListener('toggleSidebar', handler as EventListener);
  }, []);

  // Close mobile sidebar when the route changes
  useEffect(() => {
    if (!visible) return;
    if (onCloseMenu) {
      onCloseMenu();
    } else {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {visible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => (onCloseMenu ? onCloseMenu() : setIsOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-card border-r z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          visible ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">{user?.restaurantName}</h2>
              <p className="text-xs text-muted-foreground">Order Tables Panel</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-2">Welcome,</p>
            <p className="font-medium">{user?.username}</p>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate('/order-tables/history')}
            >
              <History className="w-4 h-4" />
              Bill History
            </Button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-muted">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground">Order Tables</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
