import React, { useState, useEffect } from "react";
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
import { Loader } from "../ui/loader";
import { getCurrentUser } from "../../utils/auth";
import { toast } from "sonner";
import type { MenuItem, MenuCategory } from "../../types/menu";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
} from "../../api/menuApi";

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
    category: "",
    isVeg: true,
    preparationTime: "15",
    image: "",
    spiceLevel: "0",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageInputType, setImageInputType] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState<string>("");

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
    const firstCategory = categories[0];
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: firstCategory?._id || "",
      category: firstCategory?.name || "",
      isVeg: true,
      preparationTime: "15",
      image: "",
      spiceLevel: "0",
    });
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    setImageInputType("upload");
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    
    // Safely handle spiceLevel with proper fallbacks
    const spiceLevel = (item as any).spiceLevel;
    const safeSpiceLevel = spiceLevel !== undefined && spiceLevel !== null 
      ? spiceLevel.toString() 
      : "0";

    // Extract categoryId and category properly
    let categoryId = "";
    let category = "";
    
    if (typeof item.categoryId === "string") {
      categoryId = item.categoryId;
    } else if (item.categoryId && typeof item.categoryId === "object" && item.categoryId._id) {
      categoryId = item.categoryId._id;
    }
    
    // For category name, check if it's in the item directly or from categoryId object
    if ((item as any).category) {
      category = (item as any).category;
    } else if (typeof item.categoryId === "object" && item.categoryId?.name) {
      category = item.categoryId.name;
    } else if (categoryId) {
      // Find category name by ID
      const foundCategory = categories.find(c => c._id === categoryId);
      category = foundCategory?.name || "";
    }

    setFormData({
      name: item.name || "",
      description: item.description || "",
      price: item.price?.toString() || "",
      categoryId: categoryId,
      category: category,
      isVeg: item.isVeg ?? true,
      preparationTime: item.preparationTime?.toString() || "15",
      image: item.image || "",
      spiceLevel: safeSpiceLevel,
    });
    setImageFile(null);
    const existingImage = item.image || "";
    setImagePreview(existingImage);
    // Determine if existing image is a URL or uploaded file
    if (existingImage && (existingImage.startsWith("http://") || existingImage.startsWith("https://") || existingImage.startsWith("//"))) {
      setImageInputType("url");
      setImageUrl(existingImage);
    } else {
      setImageInputType("upload");
      setImageUrl("");
    }
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    // Validate URL format
    if (url.trim()) {
      const urlPattern = /^(https?:\/\/|data:image\/)/i;
      if (urlPattern.test(url.trim())) {
        setImagePreview(url.trim());
      } else {
        // Try to add https:// if no protocol
        const urlWithProtocol = `https://${url.trim()}`;
        setImagePreview(urlWithProtocol);
      }
    } else {
      setImagePreview("");
    }
  };

  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URL is allowed
    try {
      const urlObj = new URL(url.trim());
      // Allow http and https protocols
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }
      // Allow any URL - backend will do final validation
      return true;
    } catch (e) {
      // If URL parsing fails, try adding https://
      try {
        const urlWithProtocol = `https://${url.trim()}`;
        new URL(urlWithProtocol);
        return true;
      } catch (e2) {
        return false;
      }
    }
  };

  const handleSave = async () => {
    if (!user?.restaurantId) return;

    if (!formData.name.trim() || !formData.price || !formData.category) {
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
      let finalImageUrl = "";
      
      // Handle image based on input type - image is optional
      if (imageInputType === "upload" && imageFile && imagePreview) {
        // Upload image file only if file is selected
        try {
          const uploadResponse = await fetch('/api/upload/image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imagePreview }),
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            finalImageUrl = uploadData.url;
          } else {
            // If upload fails, allow saving without image (optional field)
            console.warn('Image upload failed, saving without image');
            finalImageUrl = "";
          }
        } catch (uploadError) {
          // If upload fails, allow saving without image (optional field)
          console.warn('Image upload error, saving without image:', uploadError);
          finalImageUrl = "";
        }
      } else if (imageInputType === "url" && imageUrl.trim()) {
        // Use provided URL if valid
        if (validateImageUrl(imageUrl.trim())) {
          finalImageUrl = imageUrl.trim();
          // Ensure URL has protocol
          if (!finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
            finalImageUrl = `https://${finalImageUrl}`;
          }
        } else {
          // Invalid URL, but allow saving without image (optional field)
          console.warn('Invalid image URL, saving without image');
          finalImageUrl = "";
        }
      } else if (editingItem && imageInputType === "url" && !imageUrl.trim()) {
        // Keep existing image if URL is cleared during edit
        finalImageUrl = editingItem.image || "";
      } else if (editingItem && imageInputType === "upload" && !imageFile) {
        // Keep existing image if no new file is uploaded during edit
        finalImageUrl = editingItem.image || "";
      }
      // If no image is provided and not editing, finalImageUrl remains empty (which is allowed)

      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price,
        category: formData.category,
        restaurantId: user.restaurantId,
        isVeg: formData.isVeg,
        preparationTime: prepTime,
        image: finalImageUrl,
        spiceLevel: parseInt(formData.spiceLevel) || 0,
      };

      if (editingItem && editingItem._id) {
        await updateMenuItem(editingItem._id, itemData);
        toast.success("Item updated successfully");
      } else {
        await createMenuItem(itemData);
        toast.success("Item added successfully");
      }

      setIsDialogOpen(false);
      loadItems();
    } catch (err) {
      console.error("Error saving item:", err);
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

  const getCategoryName = (item: MenuItem): string => {
    // Check if item has category field directly
    if ((item as any).category) {
      return (item as any).category;
    }
    
    // Handle both string ID and MenuCategory object for categoryId
    const id = typeof item.categoryId === "string" ? item.categoryId : item.categoryId?._id;
    const category = categories.find((c) => c._id === id);
    return category ? category.name : "Unknown Category";
  };

  // derive filtered items
  const filteredItems = items.filter((it) => {
    if (filterCategory === "all") return true;
    
    // Check if item has category field directly
    if ((it as any).category) {
      const categoryName = (it as any).category;
      const selectedCategory = categories.find(cat => cat._id === filterCategory);
      return selectedCategory && categoryName === selectedCategory.name;
    }
    
    // Fallback to categoryId logic
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
                <SelectItem key={cat._id} value={cat._id || ""}>
                  {cat.name?.replace("-", " ").toUpperCase() || "Unnamed Category"}
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
            <div className="h-32 bg-muted relative">
              {/* <img
                src={item.image || "/placeholder-food.jpg"}
                alt={item.name}
                className="w-full h-full object-fill"
                      style={{maxHeight:"200px"}}

                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-food.jpg";
                }}
              /> */}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryName(item)}
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
                <span className="text-lg text-primary">₹{item.price || 0}</span>
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
      {filteredItems.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">No menu items found</p>
          <Button onClick={handleAdd} className="mt-4" variant="outline">
            Add your first menu item
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {loading && <Loader text="Loading menu items..." />}

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
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Item description..."
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
                    min="0"
                    step="0.01"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preparationTime">Prep Time (mins)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    min="0"
                    value={formData.preparationTime}
                    onChange={(e) =>
                      setFormData({ ...formData, preparationTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="isVeg">Food Type</Label>
                  <Select
                    value={formData.isVeg ? "veg" : "non-veg"}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, isVeg: value === "veg" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value: string) => {
                    const selectedCategory = categories.find(cat => cat._id === value);
                    setFormData({ 
                      ...formData, 
                      categoryId: value,
                      category: selectedCategory?.name || ""
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id || ""}>
                        {cat.name?.replace("-", " ").toUpperCase() || "Unnamed Category"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image">Menu Item Image (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  You can add an image later if needed. The item will be saved without an image if none is provided.
                </p>
                
                {/* Image Input Type Toggle */}
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imageInputType"
                      value="upload"
                      checked={imageInputType === "upload"}
                      onChange={(e) => {
                        setImageInputType("upload");
                        setImageUrl("");
                        if (!imageFile) {
                          setImagePreview("");
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Upload Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imageInputType"
                      value="url"
                      checked={imageInputType === "url"}
                      onChange={(e) => {
                        setImageInputType("url");
                        setImageFile(null);
                        if (imageUrl) {
                          setImagePreview(imageUrl);
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enter URL</span>
                  </label>
                </div>

                {/* File Upload Input */}
                {imageInputType === "upload" && (
                  <>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a photo of your menu item (Max 5MB)
                    </p>
                  </>
                )}

                {/* URL Input */}
                {imageInputType === "url" && (
                  <>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter image URL (must be a direct link to an image file)
                    </p>
                  </>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-food.jpg";
                        if (imageInputType === "url") {
                          toast.error("Invalid image URL. Please check the URL and try again.");
                        }
                      }}
                    />
                  </div>
                )}
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