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
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { Settings, Plus, Edit2, Trash2, UtensilsCrossed, TableProperties } from "lucide-react";
import { toast } from "sonner@2.0.3";

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

interface ManagementSidebarProps {
  onUpdate: () => void;
}

export function ManagementSidebar({ onUpdate }: ManagementSidebarProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Menu Item Dialog States
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    spiceLevel: "0",
    category: "roti",
    image: "",
  });

  // Table Dialog States
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableForm, setTableForm] = useState({
    tableName: "",
    location: "garden",
  });

  useEffect(() => {
    if (isOpen) {
      loadMenuItems();
      loadTables();
    }
  }, [isOpen]);

  const loadMenuItems = () => {
    const stored = localStorage.getItem("menuItems");
    if (stored) {
      setMenuItems(JSON.parse(stored));
    } else {
      // Initialize with default menu items
      const defaultMenuItems = getDefaultMenuItems();
      localStorage.setItem("menuItems", JSON.stringify(defaultMenuItems));
      setMenuItems(defaultMenuItems);
    }
  };

  const loadTables = () => {
    const stored = localStorage.getItem("tables");
    if (stored) {
      setTables(JSON.parse(stored));
    } else {
      // Initialize with default tables
      const defaultTables = getDefaultTables();
      localStorage.setItem("tables", JSON.stringify(defaultTables));
      setTables(defaultTables);
    }
  };

  // Menu Item Functions
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
      // Also remove table data from localStorage
      localStorage.removeItem(`table_${id}`);
      toast.success("Table deleted successfully");
      onUpdate();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 left-4 z-50 shadow-lg rounded-full w-12 h-12"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-[450px]">
          <SheetHeader>
            <SheetTitle>Restaurant Management</SheetTitle>
            <SheetDescription>
              Manage menu items and tables
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="menu" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="menu">Menu Items</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
            </TabsList>

            {/* Menu Items Tab */}
            <TabsContent value="menu" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm">
                  Total: <Badge variant="secondary">{menuItems.length}</Badge>
                </h3>
                <Button size="sm" onClick={handleAddMenuItem} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-240px)]">
                <div className="space-y-2 pr-4">
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
            </TabsContent>

            {/* Tables Tab */}
            <TabsContent value="tables" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm">
                  Total: <Badge variant="secondary">{tables.length}</Badge>
                </h3>
                <Button size="sm" onClick={handleAddTable} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Table
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-240px)]">
                <div className="space-y-2 pr-4">
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
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

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

// Default menu items
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

// Default tables
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
