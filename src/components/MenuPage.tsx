import { useState, useRef, useEffect } from "react";
import { FoodCard } from "./FoodCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { 
  ArrowLeft, 
  Search, 
  Users, 
  Trash2,
  Save,
  Edit2,
  Check,
  X
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";

interface MenuItem {
  id: number;
  name: string;
  image: string;
  price: number;
  spiceLevel: number;
  category: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface MenuPageProps {
  tableId: number;
  tableName: string;
  persons: number;
  onBack: () => void;
  onPlaceOrder: (items: CartItem[], persons: number) => void;
  existingCart?: CartItem[];
  existingTotal?: number;
}

export function MenuPage({ tableId, tableName, persons: initialPersons, onBack, onPlaceOrder, existingCart = [], existingTotal = 0 }: MenuPageProps) {
  const user = getCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>(existingCart);
  const [persons, setPersons] = useState(initialPersons);
  const [isEditingPersons, setIsEditingPersons] = useState(false);
  const [tempPersons, setTempPersons] = useState(persons.toString());
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const draftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMenuItems();
    loadCategories();
  }, []);

  const loadMenuItems = () => {
    if (!user) return;
    const key = getRestaurantKey("menuItems", user.restaurantId);
    const stored = localStorage.getItem(key);
    if (stored) {
      setMenuItems(JSON.parse(stored));
    }
  };

  const loadCategories = () => {
    if (!user) return;
    const key = getRestaurantKey("categories", user.restaurantId);
    const stored = localStorage.getItem(key);
    if (stored) {
      setCategories(JSON.parse(stored));
    }
  };

  const scrollToDraft = () => {
    draftRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Save to localStorage whenever cart or persons change
  useEffect(() => {
    if (!user) return;
    const newTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const status = cart.length > 0 ? "occupied" : "available";
    const lastOrderTime = cart.length > 0 ? "Just now" : "-";
    
    const tableData = {
      persons: persons,
      totalAmount: newTotal + existingTotal,
      status: status,
      cartItems: cart,
      lastOrderTime: lastOrderTime,
    };
    
    const tableKey = getRestaurantKey(`table_${tableId}`, user.restaurantId);
    localStorage.setItem(tableKey, JSON.stringify(tableData));
  }, [cart, persons, tableId, existingTotal, user]);

  const handleAddToCart = (item: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, item];
    });
  };

  const handleRemoveFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: number, change: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const handleSavePersons = () => {
    const newPersons = parseInt(tempPersons);
    if (!isNaN(newPersons) && newPersons >= 0) {
      setPersons(newPersons);
    }
    setIsEditingPersons(false);
  };

  const handleCancelEditPersons = () => {
    setTempPersons(persons.toString());
    setIsEditingPersons(false);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + existingTotal;

  const categoryButtons = [
    { id: "all", label: "All" },
    ...categories.map((cat) => ({
      id: cat,
      label: cat.replace(/-/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    })),
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl">Table {tableName}</h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {isEditingPersons ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={tempPersons}
                        onChange={(e) => setTempPersons(e.target.value)}
                        className="w-16 h-6 px-2 py-0 text-sm"
                        min="0"
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSavePersons}>
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEditPersons}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span>{persons} persons</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6" 
                        onClick={() => {
                          setIsEditingPersons(true);
                          setTempPersons(persons.toString());
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {categoryButtons.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(category.id)}
                  className="shrink-0"
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Food Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {filteredItems.map((item) => {
            const cartItem = cart.find(c => c.id === item.id);
            return (
              <FoodCard
                key={item.id}
                {...item}
                currentQuantity={cartItem?.quantity || 0}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {menuItems.length === 0 
                ? "No menu items available. Please contact admin to add menu items."
                : "No items found"}
            </p>
          </div>
        )}

        {/* Draft / Cart Section */}
        <div ref={draftRef} className="mt-8">
          <Card className="p-6">
            <h2 className="text-2xl mb-4">Draft Order</h2>
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No items in cart</p>
                  <p className="text-sm text-muted-foreground mt-2">Add items from menu to start ordering</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p>{item.name}</p>
                          <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-background rounded-lg px-2 py-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              className="h-6 w-6 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              className="h-6 w-6 p-0"
                            >
                              +
                            </Button>
                          </div>
                          <span className="w-20 text-right">₹{item.price * item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">New Items:</span>
                      <span>₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span>
                    </div>
                    {existingTotal > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Previous Order:</span>
                        <span>₹{existingTotal}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl mt-3">
                      <span>Total Amount:</span>
                      <span className="text-primary">₹{totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button className="flex-1 gap-2" size="lg" variant="outline">
                      <Save className="w-5 h-5" />
                      Save Draft
                    </Button>
                    <Button 
                      className="flex-1" 
                      variant="default" 
                      size="lg"
                      onClick={() => onPlaceOrder(cart, persons)}
                    >
                      Place Order
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
