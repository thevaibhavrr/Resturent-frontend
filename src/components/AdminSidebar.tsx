import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  LayoutDashboard,
  TableProperties,
  Users,
  MapPin,
  FileText,
  UtensilsCrossed,
  Tag,
  History,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ShoppingCart,
  DollarSign,
  Printer,
  Bluetooth,
} from "lucide-react";
import { getCurrentUser, logout } from "../utils/auth";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export interface AdminSidebarProps {
  onLogout: () => void;
  menuOpen?: boolean;
  onCloseMenu?: () => void;
}

export function AdminSidebar({
  onLogout,
  menuOpen,
  onCloseMenu,
}: AdminSidebarProps) {
  const location = useLocation();
  const user = getCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [menuManagementOpen, setMenuManagementOpen] = useState(false);
  const [tablesManagementOpen, setTablesManagementOpen] = useState(false);
  const visible = typeof menuOpen === 'boolean' ? menuOpen : isOpen;

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
    // We intentionally only want to run when the pathname changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const toggleMenuManagement = () => {
    setMenuManagementOpen(!menuManagementOpen);
  };

  const toggleTablesManagement = () => {
    setTablesManagementOpen(!tablesManagementOpen);
  };

  const menuItems = [
    {
      id: "admin-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "take-orders",
      label: "Take Orders",
      icon: ShoppingCart,
    },
    {
      id: "manage-tables",
      label: "Manage Tables",
      icon: TableProperties,
      hasChildren: true,
      children: [
        {
          id: "space-management",
          label: "Space Management",
          icon: MapPin,
        },
        {
          id: "table-management",
          label: "Manage Tables",
          icon: TableProperties,
        }
      ]
    },
    {
      id: "user-management",
      label: "User Management",
      icon: Users,
    },
    // {
    //   id: "user-bills",
    //   label: "User Bills",
    //   icon: FileText,
    // },
    {
      id: "menu-management",
      label: "Menu Management",
      icon: UtensilsCrossed,
      hasChildren: true,
      children: [
        {
          id: "category-management",
          label: "Category Management",
          icon: Tag,
        },
        {
          id: "menu-item-management",
          label: "Menu Item Management",
          icon: UtensilsCrossed,
        }
      ]
    },
    {
      id: "bill-history",
      label: "Bill History",
      icon: History,
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
    },
    {
      id: "add-expense",
      label: "Add Expense",
      icon: DollarSign,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
    {
      id: "bluetooth-printer",
      label: "Bluetooth Printer",
      icon: Printer,
    },
  ];

  // Map sidebar item id to route path
  const pathMap: Record<string, string> = {
    "admin-dashboard": "/admin",
    "take-orders": "/admin/order-tables",
    "manage-tables": "/admin/tables",
    "table-management": "/admin/tables",
    "user-management": "/admin/users",
    "space-management": "/admin/locations",
    "menu-management": "/admin/menu",
    "category-management": "/admin/categories",
    "menu-item-management": "/admin/menu",
    "bill-history": "/admin/bills",
    "reports": "/admin/reports",
    "plans": "/admin/plans",
    "settings": "/admin/settings",
    "add-expense": "/admin/expenses/add",
    "bluetooth-printer": "/admin/bluetooth-printer",
  };

  const isMenuItemActive = (item: any) => {
    const currentPath = location.pathname;
    if (pathMap[item.id] === currentPath) return true;
    if (item.hasChildren && item.children) {
      return item.children.some((child: any) => pathMap[child.id] === currentPath);
    }
    return false;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {/* Overlay for mobile */}
      {visible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => (onCloseMenu ? onCloseMenu() : setIsOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
          className={`fixed top-0 left-0 h-screen w-64 bg-card border-r z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
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
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation - Instagram Style */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isMenuItemActive(item);
              const hasChildren = item.hasChildren;
              
              return (
                <div key={item.id} className="flex flex-col">
                  {hasChildren ? (
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-between gap-3 px-3 py-2 h-11 transition-all duration-200 ${
                        isActive 
                          ? "bg-primary/10 text-primary border-r-2 border-primary font-semibold" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={item.id === "menu-management" ? toggleMenuManagement : toggleTablesManagement}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-colors ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          (item.id === "menu-management" && menuManagementOpen) || 
                          (item.id === "manage-tables" && tablesManagementOpen) 
                            ? "rotate-180" : ""
                        }`} 
                      />
                    </Button>
                  ) : (
                    <Link to={pathMap[item.id]} className="w-full" style={{ textDecoration: 'none' }}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-between gap-3 px-3 py-2 h-11 transition-all duration-200 ${
                          isActive 
                            ? "bg-primary/10 text-primary border-r-2 border-primary font-semibold" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg transition-colors ${
                            isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm">{item.label}</span>
                        </div>
                      </Button>
                    </Link>
                  )}

                  {/* Dropdown for Menu Management */}
                  {hasChildren && item.id === "menu-management" && menuManagementOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-2">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === pathMap[child.id];
                        
                        return (
                          <Link key={child.id} to={pathMap[child.id]} className="w-full" style={{ textDecoration: 'none' }}>
                            <Button
                              variant={isChildActive ? "secondary" : "ghost"}
                              className={`w-full justify-start gap-3 px-3 py-2 h-10 transition-all duration-200 ${
                                isChildActive 
                                  ? "bg-primary/10 text-primary border-r-2 border-primary font-semibold" 
                                  : "hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              <div className={`p-1 rounded transition-colors ${
                                isChildActive 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted/50 text-muted-foreground"
                              }`}>
                                <ChildIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm">{child.label}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown for Tables Management */}
                  {hasChildren && item.id === "manage-tables" && tablesManagementOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-2">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === pathMap[child.id];
                        
                        return (
                          <Link key={child.id} to={pathMap[child.id]} className="w-full" style={{ textDecoration: 'none' }}>
                            <Button
                              variant={isChildActive ? "secondary" : "ghost"}
                              className={`w-full justify-start gap-3 px-3 py-2 h-10 transition-all duration-200 ${
                                isChildActive 
                                  ? "bg-primary/10 text-primary border-r-2 border-primary font-semibold" 
                                  : "hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              <div className={`p-1 rounded transition-colors ${
                                isChildActive 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted/50 text-muted-foreground"
                              }`}>
                                <ChildIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm">{child.label}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* User Info & Logout */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-muted">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={handleLogout}
          >
            <div className="p-1 rounded bg-muted">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}