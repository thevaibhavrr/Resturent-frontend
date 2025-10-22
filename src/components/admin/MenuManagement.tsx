import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Edit2, Trash2, UtensilsCrossed, Filter } from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { toast } from "sonner";
import type { MenuItem, MenuCategory } from "../../types/menu";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuItemOrder,
  getCategories,
} from "../../api/menuApi";
import {
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} from "../../api/staffApi";

export function MenuManagement() {
  const user = getCurrentUser();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    isVeg: true,
    preparationTime: "15",
    image: "",
    spiceLevel: "0",
  });

  // Load categories once on mount, and reload items when filterCategory or user changes
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filterCategory]);

  const loadItems = async () => {
    if (!user?.restaurantId) return;
    try {
      setLoading(true);
      const categoryId = filterCategory !== "all" ? filterCategory : undefined;
      const data = await getMenuItems(user.restaurantId, categoryId);
      setItems(data || []);
    } catch (err) {
      console.error("Error loading menu items:", err);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user?.restaurantId) return;
    try {
      const data = await getCategories(user.restaurantId);
      setCategories(data || []);

      // Set default category if none selected and categories exist
      if (data && data.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: data[0]._id || "" }));
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      toast.error("Failed to load categories");
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: categories[0]?._id || "",
      isVeg: true,
      preparationTime: "15",
      image: "",
      spiceLevel: "0",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      categoryId:
        typeof item.categoryId === "string"
          ? item.categoryId
          : item.categoryId?._id || "",
      isVeg: item.isVeg,
      preparationTime: item.preparationTime.toString(),
      image: item.image || "",
      spiceLevel:
        (item as any).spiceLevel !== undefined
          ? (item as any).spiceLevel.toString()
          : "0",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.restaurantId) return;

    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      toast.error("Please fill all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const prepTime = parseInt(formData.preparationTime);
    if (isNaN(prepTime) || prepTime < 0) {
      toast.error("Please enter a valid preparation time");
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price,
        categoryId: formData.categoryId,
        restaurantId: user.restaurantId,
        isVeg: formData.isVeg,
        preparationTime: prepTime,
        image: formData.image,
      };

      if (editingItem) {
        await updateMenuItem(editingItem._id!, itemData);
        toast.success("Item updated successfully");
      } else {
        await createMenuItem(itemData);
        toast.success("Item added successfully");
      }

      setIsDialogOpen(false);
      loadItems();
    } catch (err) {
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!item._id) return;

    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteMenuItem(item._id);
        toast.success("Item deleted successfully");
        loadItems();
      } catch (err) {
        toast.error("Failed to delete item");
      }
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c._id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  // derive filtered items
  const filteredItems = items.filter((it) => {
    if (filterCategory === "all") return true;
    const catId = typeof it.categoryId === "string" ? it.categoryId : it.categoryId?._id;
    return catId === filterCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant menu items
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl">{items.length}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 flex items-center justify-center">
              ₹
            </div>
            <div>
              <p className="text-2xl">
                ₹
                {items.length > 0
                  ? Math.round(
                      items.reduce((sum, item) => sum + item.price, 0) /
                        items.length
                    )
                  : 0}
              </p>
              <p className="text-sm text-muted-foreground">Avg Price</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
              #
            </div>
            <div>
              <p className="text-2xl">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name.replace("-", " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredItems.length} items</Badge>
        </div>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.filter(item => item && item.name).map((item) => (
          <Card key={item._id || item.name} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              <img
                src={item.image || ""}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {typeof item.categoryId === "string"
                        ? getCategoryName(item.categoryId)
                        : (item.categoryId as MenuCategory)?.name || "No Category"}
                    </Badge>
                    {(item as any).spiceLevel > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        🌶️ {(item as any).spiceLevel}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg text-primary">₹{item.price}</span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(item)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No menu items found</p>
          <Button onClick={handleAdd} className="mt-4" variant="outline">
            Add your first menu item
          </Button>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update menu item information"
                : "Create a new menu item"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
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
                    value={formData.spiceLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, spiceLevel: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id || ""}>
                        {cat.name.replace("-", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
