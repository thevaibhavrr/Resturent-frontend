import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Plus, Edit2, Trash2, Tag, MoveVertical } from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import { toast } from "sonner";
import type { MenuCategory } from "../../types/menu";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder
} from "../../api/menuApi";
import { getMenuItems } from "../../api/menuApi";

export function CategoryManagement() {
  const user = getCurrentUser();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    if (!user?.restaurantId) return;
    try {
      setLoading(true);
      const data = await getCategories(user.restaurantId);
      setCategories(data);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryItemCount = async (categoryId: string): Promise<number> => {
    if (!user?.restaurantId) return 0;
    try {
      const items = await getMenuItems(user.restaurantId, categoryId);
      return items.length;
    } catch (err) {
      console.error("Error getting item count:", err);
      return 0;
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (category: MenuCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.restaurantId) {
      toast.error("Restaurant ID not found");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      if (editingCategory) {
        if (!editingCategory._id) {
          toast.error("Category ID not found");
          return;
        }
        const updateData = {
          name: formData.name,
          description: formData.description,
          restaurantId: user.restaurantId
        };
        console.log('Updating category with data:', updateData);
        const response = await updateCategory(editingCategory._id, updateData);
        console.log('Update response:', response);
        toast.success("Category updated successfully");
      } else {
        await createCategory({
          name: formData.name,
          description: formData.description,
          restaurantId: user.restaurantId
        });
        toast.success("Category added successfully");
      }
      
      setIsDialogOpen(false);
      await loadCategories();
    } catch (err: any) {
      console.error("Error saving category:", err);
      toast.error(err?.response?.data?.error || err?.message || "Failed to save category");
    }
  };

  const handleDelete = async (category: MenuCategory) => {
    if (!category._id) {
      toast.error("Category ID not found");
      return;
    }
    
    try {
      const itemCount = await getCategoryItemCount(category._id);
      if (itemCount > 0) {
        toast.error(`Cannot delete category with ${itemCount} menu items. Please remove them first.`);
        return;
      }

      if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
        await deleteCategory(category._id);
        toast.success("Category deleted successfully");
        await loadCategories();
      }
    } catch (err: any) {
      console.error("Error deleting category:", err);
      toast.error(err?.message || "Failed to delete category");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Category Management</h1>
          <p className="text-muted-foreground">
            Manage menu categories for your restaurant
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Total Categories</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category._id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Tag className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Display Order: {category.displayOrder}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(category)}
                  className="h-8 w-8"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(category)}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <Card className="p-12 text-center">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No categories yet</p>
          <Button onClick={handleAdd} className="mt-4" variant="outline">
            Add your first category
          </Button>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category details"
                : "Create a new menu category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Starter, Main Course, Desserts"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? "Update" : "Add"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}