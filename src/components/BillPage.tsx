import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  Printer, 
  ShoppingCart,
  Users,
  Clock,
  DollarSign
} from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";
import { toast } from "sonner";
import { getMenuItems, getCategories } from "../api/menuApi";
import { clearTableDraft } from "../api/tableDraftApi";

interface MenuItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  description: string;
  category: string;
  spiceLevel: number;
  isAvailable: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface BillPageProps {
  tableId: number;
  tableName: string;
  initialCart: CartItem[];
  initialPersons: number;
  onBack: () => void;
}

export function BillPage({ 
  tableId, 
  tableName, 
  initialCart, 
  initialPersons, 
  onBack 
}: BillPageProps) {
  const user = getCurrentUser();
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [persons, setPersons] = useState(initialPersons);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Load menu data
  useEffect(() => {
    const loadMenuData = async () => {
      if (!user?.restaurantId) return;

      try {
        const [categoriesData, menuItemsData] = await Promise.all([
          getCategories(user.restaurantId),
          getMenuItems(user.restaurantId)
        ]);

        setCategories(categoriesData);
        setMenuItems(menuItemsData);
      } catch (error) {
        console.error("Error loading menu data:", error);
        toast.error("Failed to load menu data");
      }
    };

    loadMenuData();
  }, [user?.restaurantId]);

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      toast.error(`${item.name} is not available`);
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item._id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { id: item._id, name: item.name, price: item.price, quantity: 1 }];
      }
    });
    toast.success(`${item.name} added to cart`);
  };

  // Update item quantity
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

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax for final bill
  const total = subtotal + tax;

  // Persist bill to localStorage history
  const persistBillHistory = () => {
    if (!user?.restaurantId) return;
    try {
      const key = getRestaurantKey("billHistory", user.restaurantId);
      const stored = localStorage.getItem(key);
      const history = stored ? JSON.parse(stored) : [];
      const billRecord = {
        billNumber: `${Date.now()}`,
        tableId,
        tableName,
        persons,
        grandTotal: total,
        date: new Date().toISOString(),
        items: cart,
      };
      const updated = [billRecord, ...history];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist bill history", e);
    }
  };

  // Save only
  const handleSaveOnly = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      // Clear the draft
      if (user?.restaurantId && user?.username) {
        await clearTableDraft(tableId.toString(), user.restaurantId, user.username);
      }

      // Save bill to history
      persistBillHistory();

      toast.success("Bill saved successfully!");
      
      // Navigate back
      onBack();
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error("Failed to save bill");
    }
  };

  // Save and print bill
  const handleSaveAndPrint = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      // Clear the draft
      if (user?.restaurantId && user?.username) {
        await clearTableDraft(tableId.toString(), user.restaurantId, user.username);
      }

      // Save bill to history
      persistBillHistory();

      // Print the bill (you can implement actual printing logic here)
      window.print();

      toast.success("Bill saved and printed successfully!");

      // Navigate back
      onBack();
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error("Failed to save bill");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4" style={{ marginTop: '100px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Bill - {tableName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Input
                  type="number"
                  min="1"
                  value={persons}
                  onChange={(e) => setPersons(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
              </div>
              <Badge variant="secondary" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                {cart.length} items
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bill Items */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Bill Items</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowAddItems(!showAddItems)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showAddItems ? "Hide Menu" : "Add Items"}
                </Button>
              </div>

              {/* Current Cart Items */}
              <ScrollArea className="h-96">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items in bill
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            {/* Add Items Section */}
            {showAddItems && (
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Add More Items</h3>
                
                {/* Search and Category Filter */}
                <div className="flex gap-4 mb-4">
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Menu Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <div key={item._id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">₹{item.price}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToCart(item)}
                        disabled={!item.isAvailable}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Bill Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Bill Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Table: {tableName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{persons} {persons === 1 ? 'person' : 'people'}</span>
                </div>
              </div>

              <div className="space-y-2 my-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleSaveOnly}
                  className="w-full"
                  size="lg"
                  disabled={cart.length === 0}
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Only
                </Button>
                <Button
                  onClick={handleSaveAndPrint}
                  variant="outline"
                  className="w-full"
                  disabled={cart.length === 0}
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Save & Print
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}