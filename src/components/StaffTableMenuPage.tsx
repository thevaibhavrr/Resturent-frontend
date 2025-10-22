import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  ArrowLeft, 
  Search, 
  Users, 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  Loader2
} from "lucide-react";
import { getCurrentUser } from "../utils/auth";
import { toast } from "sonner";
import { getMenuItems, getCategories } from "../api/menuApi";
import { saveTableDraft, getTableDraft, clearTableDraft, TableDraft } from "../api/tableDraftApi";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface MenuItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  spiceLevel: number;
  category: string;
  description?: string;
  isAvailable: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface StaffTableMenuPageProps {
  tableId: number;
  tableName: string;
  onBack: () => void;
  onPlaceOrder: (items: CartItem[], persons: number) => void;
}

// Categories will be loaded from API

export function StaffTableMenuPage({ tableId, tableName, onBack, onPlaceOrder }: StaffTableMenuPageProps) {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [persons, setPersons] = useState(1);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [tableDraft, setTableDraft] = useState<TableDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [useCustomPersons, setUseCustomPersons] = useState(persons > 10);

  // Loader function (callable and used on mount)
  const loadMenuData = async () => {
    if (!user?.restaurantId) {
      setError("No restaurant ID found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load categories, menu items, and table draft in parallel
      const [categoriesData, menuItemsData, draftData] = await Promise.all([
        getCategories(user.restaurantId),
        getMenuItems(user.restaurantId),
        getTableDraft(tableId.toString(), user.restaurantId)
      ]);

      setCategories(categoriesData);
      setMenuItems(menuItemsData);
      
      // Load existing draft if available
      if (draftData) {
        setTableDraft(draftData);
        setPersons(draftData.persons);
        
        // Restore cart items and quantities
        const restoredCart: CartItem[] = [];
        const restoredQuantities: Record<string, number> = {};
        
        draftData.cartItems.forEach(item => {
          restoredCart.push({
            id: item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            note: (item as any).note || ""
          });
          restoredQuantities[item.itemId] = item.quantity;
        });
        
        setCart(restoredCart);
        setItemQuantities(restoredQuantities);
        
        toast.success("Table draft loaded successfully");
      }
    } catch (err) {
      console.error("Error loading menu data:", err);
      setError("Failed to load menu data");
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, [user?.restaurantId, tableId]);

  // Removed page-level refresh control per request

  // Auto-save when cart or persons change
  useEffect(() => {
    if (user?.restaurantId && user?.username) {
      const timeoutId = setTimeout(() => {
        autoSaveDraft(cart, persons);
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [cart, persons, user?.restaurantId, user?.username]);

  // Filter menu items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Get quantity for an item
  const getItemQuantity = (itemId: string): number => {
    return itemQuantities[itemId] || 0;
  };

  // Auto-save draft function
  const autoSaveDraft = async (cartItems: CartItem[], personsCount: number) => {
    if (!user?.restaurantId || !user?.username) return;
    
    try {
      setSaving(true);
      const draftData = {
        tableId: tableId.toString(),
        tableName: tableName,
        restaurantId: user.restaurantId,
        persons: personsCount,
        cartItems: cartItems.map(item => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          note: item.note || ""
        })),
        updatedBy: user.username
      };
      
      const savedDraft = await saveTableDraft(draftData);
      setTableDraft(savedDraft);
    } catch (error) {
      console.error("Error auto-saving draft:", error);
    } finally {
      setSaving(false);
    }
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, change: number) => {
    setItemQuantities(prev => {
      const currentQuantity = prev[itemId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      if (newQuantity === 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [itemId]: newQuantity };
    });

    // Also update cart
    setCart(prev => {
      const item = menuItems.find(mi => mi._id === itemId);
      if (!item) return prev;

      const currentQuantity = itemQuantities[itemId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);

      if (newQuantity === 0) {
        return prev.filter(cartItem => cartItem.id !== itemId);
      }

      const existingItem = prev.find(cartItem => cartItem.id === itemId);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: newQuantity }
          : cartItem
        );
      } else {
        return [...prev, { id: item._id, name: item.name, price: item.price, quantity: newQuantity, note: "" }];
      }
    });
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, note } : ci));
  };

  // Add item to cart (legacy function for compatibility)
  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      toast.error(`${item.name} is not available`);
      return;
    }
    updateItemQuantity(item._id, 1);
    toast.success(`${item.name} added to cart`);
  };

  // Update cart item quantity
  const updateQuantity = (itemId: string, change: number) => {
    setCart(prev => {
      const item = prev.find(cartItem => cartItem.id === itemId);
      if (!item) return prev;

      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        return prev.filter(cartItem => cartItem.id !== itemId);
      }

      return prev.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      );
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(cartItem => cartItem.id !== itemId));
    toast.success("Item removed from cart");
  };

  // Calculate totals (no tax for draft)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // No tax in draft

  // Clear draft
  const handleClearDraft = async () => {
    if (!user?.restaurantId || !user?.username) return;
    
    try {
      await clearTableDraft(tableId.toString(), user.restaurantId, user.username);
      setCart([]);
      setPersons(1);
      setItemQuantities({});
      setTableDraft(null);
      toast.success("Draft cleared successfully");
    } catch (error) {
      console.error("Error clearing draft:", error);
      toast.error("Failed to clear draft");
    }
  };

  // Go to bill page
  const handleGoToBill = () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }
    if (persons < 1) {
      toast.error("Please enter number of persons");
      return;
    }

    // Navigate to bill page with cart data
    const billData = {
      table: {
        id: tableId,
        tableName: tableName
      },
      cart: cart,
      persons: persons
    };
    
    navigate("/order-tables/bill", { state: billData });
  };

  return (
    <div className="min-h-screen bg-background ">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 " style={{ marginTop: '100px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{tableName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Select
                  value={persons <= 10 && !useCustomPersons ? String(persons) : "custom"}
                  onValueChange={(v) => {
                    if (v === "custom") {
                      setUseCustomPersons(true);
                    } else {
                      setUseCustomPersons(false);
                      setPersons(parseInt(v));
                    }
                  }}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue placeholder="Persons" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {useCustomPersons && (
                  <Input
                    type="number"
                    min="1"
                    value={persons}
                    onChange={(e) => setPersons(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-8 text-sm px-2"
                    placeholder="Enter"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory("all")}
                  className="gap-2"
                >
                  <span>🍽️</span>
                  All Items
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category._id}
                    variant={activeCategory === category.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category.name)}
                    className="gap-2"
                  >
                    <span>{category.icon || "🍽️"}</span>
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <p className="text-muted-foreground">Loading menu items...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="p-12 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </Card>
            )}

            {/* Menu Items */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                <Card 
                  className={`p-4 hover:shadow-md transition-shadow ${
                    getItemQuantity(item._id) > 0 
                      ? 'border-2 border-primary bg-primary/5' 
                      : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {getItemQuantity(item._id) > 0 && (
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {getItemQuantity(item._id)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <span className="font-bold text-lg">${item.price}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {item.category.replace("-", " ")}
                        </Badge>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-xs ${
                                i < item.spiceLevel ? "text-red-500" : "text-gray-300"
                              }`}
                            >
                              🌶️
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Quantity Controls */}
                      {getItemQuantity(item._id) > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item._id, -1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {getItemQuantity(item._id)}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item._id, 1)}
                                className="h-8 w-8 p-0"
                                disabled={!item.isAvailable}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateItemQuantity(item._id, -getItemQuantity(item._id))}
                              className="h-8 px-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                         
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            onClick={() => updateItemQuantity(item._id, 1)}
                            className="w-full"
                            disabled={!item.isAvailable}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {item.isAvailable ? "Add to Cart" : "Not Available"}
                          </Button>

                        </div>
                      )}
                    </div>
                  </div>
                </Card>
                </motion.div>
              ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredItems.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No items found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or category filter
                </p>
              </Card>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </h3>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cart is empty</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add items from the menu
                    </p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="max-h-96 mb-4">
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                            className="p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 pr-3">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                                <Input
                                  placeholder="Add note (optional)"
                                  value={item.note || ""}
                                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                  className="mt-2 h-8 text-sm"
                                />
                              </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="h-8 w-8"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="h-8 w-8"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeFromCart(item.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Totals */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Place Order Button */}
                    <Button
                      onClick={handleGoToBill}
                      className="w-full"
                      size="lg"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Go to Bill
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
