import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  Menu,
  History,
  UtensilsCrossed,
  TableProperties,
  Settings,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Upload,
  Palette,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  image: string;
  price: number;
  spiceLevel: number;
  category: string;
}

interface Table {
  id: number;
  tableName: string;
  location: string;
}

interface BillHistoryItem {
  billNumber: string;
  tableId: number;
  tableName: string;
  persons: number;
  grandTotal: number;
  date: string;
  items: Array<{ id: number; name: string; price: number; quantity: number }>;
}

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  gstin: string;
  logo: string;
}

const colorThemes = [
  { name: "Ocean Blue", id: "ocean", primary: "#0891b2" },
  { name: "Sunset Orange", id: "sunset", primary: "#ea580c" },
  { name: "Forest Green", id: "forest", primary: "#15803d" },
  { name: "Royal Purple", id: "royal", primary: "#7c3aed" },
  { name: "Cherry Red", id: "cherry", primary: "#dc2626" },
  { name: "Midnight Dark", id: "midnight", primary: "#f8fafc" },
  { name: "Rose Gold", id: "rose", primary: "#be185d" },
  { name: "Sky Blue", id: "sky", primary: "#0284c7" },
];

interface MainSidebarProps {
  onUpdate: () => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function MainSidebar({ onUpdate, currentTheme, onThemeChange, currentPage, onPageChange }: MainSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // History
  const [history, setHistory] = useState<BillHistoryItem[]>([]);
  
  // Menu Items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    spiceLevel: "0",
    category: "roti",
    image: "",
  });

  // Tables
  const [tables, setTables] = useState<Table[]>([]);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableForm, setTableForm] = useState({
    tableName: "",
    location: "garden",
  });

  // Settings
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({
    name: "Restaurant Name",
    address: "123 Street, City - 400001",
    phone: "+91 1234567890",
    gstin: "22AAAAA0000A1Z5",
    logo: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadMenuItems();
      loadTables();
      loadSettings();
    }
  }, [isOpen]);

  // History Functions
  const loadHistory = () => {
    const stored = localStorage.getItem("billHistory");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const handleDeleteBill = (billNumber: string) => {
    const updated = history.filter((bill) => bill.billNumber !== billNumber);
    localStorage.setItem("billHistory", JSON.stringify(updated));
    setHistory(updated);
    toast.success("Bill deleted successfully");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Menu Item Functions
  const loadMenuItems = () => {
    const stored = localStorage.getItem("menuItems");
    if (stored) {
      setMenuItems(JSON.parse(stored));
    } else {
      const defaultMenuItems = getDefaultMenuItems();
      localStorage.setItem("menuItems", JSON.stringify(defaultMenuItems));
      setMenuItems(defaultMenuItems);
    }
  };

  const handleAddMenuItem = () => {
    setEditingMenuItem(null);
    setMenuForm({
      name: "",
      price: "",
      spiceLevel: "0",
      category: "roti",
      image: "https://images.unsplash.com/photo-1637471631117-ded3d248c468?w=400",
    });
    setIsMenuDialogOpen(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name,
      price: item.price.toString(),
      spiceLevel: item.spiceLevel.toString(),
      category: item.category,
      image: item.image,
    });
    setIsMenuDialogOpen(true);
  };

  const handleSaveMenuItem = () => {
    if (!menuForm.name || !menuForm.price) {
      toast.error("Please fill all required fields");
      return;
    }

    const newItem: MenuItem = {
      id: editingMenuItem?.id || Date.now(),
      name: menuForm.name,
      price: parseFloat(menuForm.price),
      spiceLevel: parseInt(menuForm.spiceLevel),
      category: menuForm.category,
      image: menuForm.image || "https://images.unsplash.com/photo-1637471631117-ded3d248c468?w=400",
    };

    let updatedItems;
    if (editingMenuItem) {
      updatedItems = menuItems.map((item) =>
        item.id === editingMenuItem.id ? newItem : item
      );
      toast.success("Menu item updated successfully");
    } else {
      updatedItems = [...menuItems, newItem];
      toast.success("Menu item added successfully");
    }

    localStorage.setItem("menuItems", JSON.stringify(updatedItems));
    setMenuItems(updatedItems);
    setIsMenuDialogOpen(false);
    onUpdate();
  };

  const handleDeleteMenuItem = (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      const updatedItems = menuItems.filter((item) => item.id !== id);
      localStorage.setItem("menuItems", JSON.stringify(updatedItems));
      setMenuItems(updatedItems);
      toast.success("Menu item deleted successfully");
      onUpdate();
    }
  };

  // Table Functions
  const loadTables = () => {
    const stored = localStorage.getItem("tables");
    if (stored) {
      setTables(JSON.parse(stored));
    } else {
      const defaultTables = getDefaultTables();
      localStorage.setItem("tables", JSON.stringify(defaultTables));
      setTables(defaultTables);
    }
  };

  const handleAddTable = () => {
    setEditingTable(null);
    setTableForm({
      tableName: "",
      location: "garden",
    });
    setIsTableDialogOpen(true);
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setTableForm({
      tableName: table.tableName,
      location: table.location,
    });
    setIsTableDialogOpen(true);
  };

  const handleSaveTable = () => {
    if (!tableForm.tableName) {
      toast.error("Please enter table name");
      return;
    }

    const newTable: Table = {
      id: editingTable?.id || Date.now(),
      tableName: tableForm.tableName,
      location: tableForm.location,
    };

    let updatedTables;
    if (editingTable) {
      updatedTables = tables.map((table) =>
        table.id === editingTable.id ? newTable : table
      );
      toast.success("Table updated successfully");
    } else {
      updatedTables = [...tables, newTable];
      toast.success("Table added successfully");
    }

    localStorage.setItem("tables", JSON.stringify(updatedTables));
    setTables(updatedTables);
    setIsTableDialogOpen(false);
    onUpdate();
  };

  const handleDeleteTable = (id: number) => {
    if (confirm("Are you sure you want to delete this table?")) {
      const updatedTables = tables.filter((table) => table.id !== id);
      localStorage.setItem("tables", JSON.stringify(updatedTables));
      setTables(updatedTables);
      localStorage.removeItem(`table_${id}`);
      toast.success("Table deleted successfully");
      onUpdate();
    }
  };

  // Settings Functions
  const loadSettings = () => {
    const stored = localStorage.getItem("restaurantSettings");
    if (stored) {
      setRestaurantSettings(JSON.parse(stored));
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem("restaurantSettings", JSON.stringify(restaurantSettings));
    toast.success("Settings saved successfully");
  };

  // Hard refresh all data except token and currentUser
  const handleHardRefresh = () => {
    // Save current user data
    const token = localStorage.getItem("token");
    const currentUser = localStorage.getItem("currentUser");
    
    // Clear all localStorage except token and currentUser
    localStorage.clear();
    
    // Restore token and currentUser if they exist
    if (token) localStorage.setItem("token", token);
    if (currentUser) localStorage.setItem("currentUser", currentUser);
    
    // Reload default data
    loadHistory();
    loadMenuItems();
    loadTables();
    loadSettings();
    
    toast.success("All data refreshed successfully!");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRestaurantSettings({
          ...restaurantSettings,
          logo: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-50 shadow-lg"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Navigate and manage</SheetDescription>
            </SheetHeader>

            {/* Navigation Items */}
            <div className="flex-1 py-4">
              <div className="space-y-1 px-3">
                <Button
                  variant={currentPage === "dashboard" ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onPageChange("dashboard");
                    setIsOpen(false);
                  }}
                >
                  <TrendingUp className="w-5 h-5" />
                  Dashboard
                </Button>
                
                <Button
                  variant={currentPage === "tables" ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onPageChange("tables");
                    setIsOpen(false);
                  }}
                >
                  <TableProperties className="w-5 h-5" />
                  Tables
                </Button>

                <div className="px-3 py-2 mt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Management
                  </p>
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onPageChange("history");
                    setIsOpen(false);
                  }}
                >
                  <History className="w-5 h-5" />
                  Order History
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onPageChange("menu");
                    setIsOpen(false);
                  }}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  Menu Items
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onPageChange("table-management");
                    setIsOpen(false);
                  }}
                >
                  <TableProperties className="w-5 h-5" />
                  Manage Tables
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onPageChange("settings");
                    setIsOpen(false);
                  }}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Button>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start" onClick={onUpdate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    onClick={handleHardRefresh}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Hard Refresh (Reset All Data)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* History Dialog */}
      <Dialog open={currentPage === "history"} onOpenChange={(open) => !open && onPageChange("dashboard")}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Order History</DialogTitle>
            <DialogDescription>View all previous bills and orders</DialogDescription>
          </DialogHeader>
          <div>
            {currentPage === "history" && (
                <ScrollArea className="flex-1 px-6">
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No order history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4">
                      {history.map((bill) => (
                        <Card key={bill.billNumber} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm">
                                Bill #{bill.billNumber.slice(-8)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(bill.date)} • {formatTime(bill.date)}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteBill(bill.billNumber)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Table:</span>
                              <span>{bill.tableName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Persons:</span>
                              <span>{bill.persons}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Items:</span>
                              <span>
                                {bill.items.reduce((sum, item) => sum + item.quantity, 0)}
                              </span>
                            </div>
                          </div>
                          <div className="border-t pt-2 flex justify-between items-center">
                            <span className="text-sm">Total:</span>
                            <Badge variant="secondary" className="text-base">
                              ₹{bill.grandTotal.toFixed(2)}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Items Dialog */}
      <Dialog open={currentPage === "menu"} onOpenChange={(open) => !open && onPageChange("dashboard")}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Menu Items</DialogTitle>
            <DialogDescription>Manage your menu items</DialogDescription>
          </DialogHeader>
          <div>
            {currentPage === "menu" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center px-6 py-4 border-b">
                    <div className="text-sm">
                      Total: <Badge variant="secondary">{menuItems.length}</Badge>
                    </div>
                    <Button size="sm" onClick={handleAddMenuItem} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Item
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 px-6">
                    <div className="space-y-2 py-4">
                      {menuItems.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p>{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.category.replace("-", " ")}
                                </Badge>
                                <span className="text-sm text-primary">₹{item.price}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditMenuItem(item)}
                                className="h-8 w-8"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Management Dialog */}
      <Dialog open={currentPage === "table-management"} onOpenChange={(open) => !open && onPageChange("dashboard")}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Tables</DialogTitle>
            <DialogDescription>Add, edit, or remove tables</DialogDescription>
          </DialogHeader>
          <div>
            {currentPage === "table-management" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center px-6 py-4 border-b">
                    <div className="text-sm">
                      Total: <Badge variant="secondary">{tables.length}</Badge>
                    </div>
                    <Button size="sm" onClick={handleAddTable} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Table
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 px-6">
                    <div className="space-y-2 py-4">
                      {tables.map((table) => (
                        <Card key={table.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p>{table.tableName}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {table.location.replace("-", " ")}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditTable(table)}
                                className="h-8 w-8"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteTable(table.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={currentPage === "settings"} onOpenChange={(open) => !open && onPageChange("dashboard")}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Restaurant configuration</DialogDescription>
          </DialogHeader>
          <div>
            {currentPage === "settings" && (
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-6 py-4">
                    {/* Restaurant Info */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Restaurant Information</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="restaurantName">Restaurant Name</Label>
                          <Input
                            id="restaurantName"
                            value={restaurantSettings.name}
                            onChange={(e) =>
                              setRestaurantSettings({
                                ...restaurantSettings,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={restaurantSettings.address}
                            onChange={(e) =>
                              setRestaurantSettings({
                                ...restaurantSettings,
                                address: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={restaurantSettings.phone}
                            onChange={(e) =>
                              setRestaurantSettings({
                                ...restaurantSettings,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="gstin">GSTIN</Label>
                          <Input
                            id="gstin"
                            value={restaurantSettings.gstin}
                            onChange={(e) =>
                              setRestaurantSettings({
                                ...restaurantSettings,
                                gstin: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Logo Upload */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Restaurant Logo</h3>
                      <div className="space-y-3">
                        {restaurantSettings.logo && (
                          <div className="flex justify-center">
                            <img
                              src={restaurantSettings.logo}
                              alt="Restaurant Logo"
                              className="w-24 h-24 object-contain border rounded-lg"
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="logo" className="cursor-pointer">
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload logo
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG up to 5MB
                              </p>
                            </div>
                          </Label>
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Color Theme */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Color Theme</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {colorThemes.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => onThemeChange(theme.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              currentTheme === theme.id
                                ? "border-primary shadow-md"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-6 h-6 rounded-full border"
                                style={{ backgroundColor: theme.primary }}
                              />
                              <span className="text-sm">{theme.name}</span>
                            </div>
                            {currentTheme === theme.id && (
                              <div className="text-xs text-primary">Active</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button onClick={handleSaveSettings} className="w-full">
                      Save Settings
                    </Button>
                  </div>
                </ScrollArea>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Item Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMenuItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
            <DialogDescription>
              {editingMenuItem
                ? "Update the menu item details"
                : "Add a new item to the menu"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={menuForm.name}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, name: e.target.value })
                }
                placeholder="e.g., Butter Roti"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={menuForm.price}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, price: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="spiceLevel">Spice Level (0-100)</Label>
                <Input
                  id="spiceLevel"
                  type="number"
                  min="0"
                  max="100"
                  value={menuForm.spiceLevel}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, spiceLevel: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={menuForm.category}
                onValueChange={(value) =>
                  setMenuForm({ ...menuForm, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roti">Roti</SelectItem>
                  <SelectItem value="paneer">Paneer</SelectItem>
                  <SelectItem value="veg-sabji">Veg Sabji</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="raita">Raita</SelectItem>
                  <SelectItem value="kofta">Kofta</SelectItem>
                  <SelectItem value="drinks">Drinks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={menuForm.image}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, image: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMenuItem}>
              {editingMenuItem ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? "Edit Table" : "Add Table"}
            </DialogTitle>
            <DialogDescription>
              {editingTable
                ? "Update the table details"
                : "Add a new table to the restaurant"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tableName">Table Name *</Label>
              <Input
                id="tableName"
                value={tableForm.tableName}
                onChange={(e) =>
                  setTableForm({ ...tableForm, tableName: e.target.value })
                }
                placeholder="e.g., G-5, FH-5, PH-4"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={tableForm.location}
                onValueChange={(value) =>
                  setTableForm({ ...tableForm, location: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="garden">Garden</SelectItem>
                  <SelectItem value="family-hall">Family Hall</SelectItem>
                  <SelectItem value="party-hall">Party Hall</SelectItem>
                  <SelectItem value="roof-1">Roof 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTable}>
              {editingTable ? "Update" : "Add"} Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Default data functions
function getDefaultMenuItems(): MenuItem[] {
  return [
    { id: 1, name: "Butter Roti", image: "https://images.unsplash.com/photo-1637471631117-ded3d248c468?w=400", price: 25, spiceLevel: 0, category: "roti" },
    { id: 2, name: "Garlic Naan", image: "https://images.unsplash.com/photo-1637471631117-ded3d248c468?w=400", price: 40, spiceLevel: 10, category: "roti" },
    { id: 3, name: "Tandoori Roti", image: "https://images.unsplash.com/photo-1756137949459-8aad8455d040?w=400", price: 20, spiceLevel: 0, category: "roti" },
    { id: 4, name: "Lachha Paratha", image: "https://images.unsplash.com/photo-1637471631117-ded3d248c468?w=400", price: 35, spiceLevel: 0, category: "roti" },
    { id: 5, name: "Paneer Butter Masala", image: "https://images.unsplash.com/photo-1708782340377-882559d544fb?w=400", price: 220, spiceLevel: 40, category: "paneer" },
    { id: 6, name: "Kadai Paneer", image: "https://images.unsplash.com/photo-1708782340377-882559d544fb?w=400", price: 240, spiceLevel: 60, category: "paneer" },
    { id: 7, name: "Paneer Tikka Masala", image: "https://images.unsplash.com/photo-1708782340377-882559d544fb?w=400", price: 250, spiceLevel: 50, category: "paneer" },
    { id: 8, name: "Shahi Paneer", image: "https://images.unsplash.com/photo-1708782340377-882559d544fb?w=400", price: 260, spiceLevel: 30, category: "paneer" },
    { id: 9, name: "Mix Veg Curry", image: "https://images.unsplash.com/photo-1612108438004-257c47560118?w=400", price: 180, spiceLevel: 40, category: "veg-sabji" },
    { id: 10, name: "Aloo Gobi", image: "https://images.unsplash.com/photo-1612108438004-257c47560118?w=400", price: 160, spiceLevel: 30, category: "veg-sabji" },
    { id: 11, name: "Bhindi Masala", image: "https://images.unsplash.com/photo-1612108438004-257c47560118?w=400", price: 170, spiceLevel: 50, category: "veg-sabji" },
    { id: 12, name: "Baingan Bharta", image: "https://images.unsplash.com/photo-1612108438004-257c47560118?w=400", price: 190, spiceLevel: 60, category: "veg-sabji" },
    { id: 13, name: "Veg Spring Roll", image: "https://images.unsplash.com/photo-1583911288204-278762197eca?w=400", price: 150, spiceLevel: 20, category: "starter" },
    { id: 14, name: "Paneer Tikka", image: "https://images.unsplash.com/photo-1619714604882-db1396d4a718?w=400", price: 180, spiceLevel: 50, category: "starter" },
    { id: 15, name: "Hara Bhara Kabab", image: "https://images.unsplash.com/photo-1619714604882-db1396d4a718?w=400", price: 160, spiceLevel: 40, category: "starter" },
    { id: 16, name: "Crispy Corn", image: "https://images.unsplash.com/photo-1583911288204-278762197eca?w=400", price: 140, spiceLevel: 60, category: "starter" },
    { id: 17, name: "Boondi Raita", image: "https://images.unsplash.com/photo-1709620044505-d7dc01c665d2?w=400", price: 80, spiceLevel: 0, category: "raita" },
    { id: 18, name: "Mix Veg Raita", image: "https://images.unsplash.com/photo-1709620044505-d7dc01c665d2?w=400", price: 90, spiceLevel: 10, category: "raita" },
    { id: 19, name: "Cucumber Raita", image: "https://images.unsplash.com/photo-1709620044505-d7dc01c665d2?w=400", price: 70, spiceLevel: 0, category: "raita" },
    { id: 20, name: "Pineapple Raita", image: "https://images.unsplash.com/photo-1709620044505-d7dc01c665d2?w=400", price: 100, spiceLevel: 0, category: "raita" },
    { id: 21, name: "Malai Kofta", image: "https://images.unsplash.com/photo-1743362818809-5291a1566ec1?w=400", price: 240, spiceLevel: 40, category: "kofta" },
    { id: 22, name: "Veg Kofta Curry", image: "https://images.unsplash.com/photo-1743362818809-5291a1566ec1?w=400", price: 220, spiceLevel: 50, category: "kofta" },
    { id: 23, name: "Lauki Kofta", image: "https://images.unsplash.com/photo-1743362818809-5291a1566ec1?w=400", price: 200, spiceLevel: 30, category: "kofta" },
    { id: 24, name: "Paneer Kofta", image: "https://images.unsplash.com/photo-1743362818809-5291a1566ec1?w=400", price: 260, spiceLevel: 40, category: "kofta" },
    { id: 25, name: "Fresh Lime Soda", image: "https://images.unsplash.com/photo-1652922664558-03d0f2932e58?w=400", price: 60, spiceLevel: 0, category: "drinks" },
    { id: 26, name: "Sweet Lassi", image: "https://images.unsplash.com/photo-1568268205735-fbb7cbb46e23?w=400", price: 70, spiceLevel: 0, category: "drinks" },
    { id: 27, name: "Masala Chaas", image: "https://images.unsplash.com/photo-1568268205735-fbb7cbb46e23?w=400", price: 50, spiceLevel: 20, category: "drinks" },
    { id: 28, name: "Fresh Juice", image: "https://images.unsplash.com/photo-1652922664558-03d0f2932e58?w=400", price: 80, spiceLevel: 0, category: "drinks" },
  ];
}

function getDefaultTables(): Table[] {
  return [
    { id: 1, tableName: "G-1", location: "garden" },
    { id: 2, tableName: "G-2", location: "garden" },
    { id: 3, tableName: "G-3", location: "garden" },
    { id: 4, tableName: "G-4", location: "garden" },
    { id: 5, tableName: "FH-1", location: "family-hall" },
    { id: 6, tableName: "FH-2", location: "family-hall" },
    { id: 7, tableName: "FH-3", location: "family-hall" },
    { id: 8, tableName: "FH-4", location: "family-hall" },
    { id: 9, tableName: "PH-1", location: "party-hall" },
    { id: 10, tableName: "PH-2", location: "party-hall" },
    { id: 11, tableName: "PH-3", location: "party-hall" },
    { id: 12, tableName: "R1-1", location: "roof-1" },
    { id: 13, tableName: "R1-2", location: "roof-1" },
    { id: 14, tableName: "R1-3", location: "roof-1" },
    { id: 15, tableName: "R1-4", location: "roof-1" },
  ];
}

export function getRestaurantSettings(): RestaurantSettings {
  const stored = localStorage.getItem("restaurantSettings");
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    name: "Restaurant Name",
    address: "123 Street, City - 400001",
    phone: "+91 1234567890",
    gstin: "22AAAAA0000A1Z5",
    logo: "",
  };
}
