// import React, { useState, useEffect, useRef } from "react";
// import { Button } from "./ui/button";
// import { Input } from "./ui/input";
// import { Card } from "./ui/card";
// import { Badge } from "./ui/badge";
// import { ScrollArea } from "./ui/scroll-area";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
// import { 
//   ArrowLeft, 
//   Search, 
//   Users, 
//   ShoppingCart,
//   Plus,
//   Minus,
//   Trash2,
//   Check,
//   Loader2,
//   Printer,
//   ArrowDown,
//   ArrowUp
// } from "lucide-react";
// import { getCurrentUser } from "../utils/auth";
// import { toast } from "sonner";
// import { getMenuItems, getCategories } from "../api/menuApi";
// import { saveTableDraft, getTableDraft, clearTableDraft, TableDraft } from "../api/tableDraftApi";
// import { useNavigate } from "react-router-dom";
// import { motion, useScroll, useMotionValueEvent, useSpring } from "framer-motion";

// interface MenuItem {
//   _id: string;
//   name: string;
//   image: string;
//   price: number;
//   spiceLevel: number;
//   category: string;
//   description?: string;
//   isAvailable: boolean;
// }

// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
//   note?: string;
//   spiceLevel?: number;
//   spicePercent?: number;
//   isJain?: boolean;
// }

// interface Category {
//   _id: string;
//   name: string;
//   description?: string;
//   icon?: string;
// }

// interface StaffTableMenuPageProps {
//   tableId: number;
//   tableName: string;
//   onBack: () => void;
//   onPlaceOrder: (items: CartItem[], persons: number) => void;
// }

// // Categories will be loaded from API

// export function StaffTableMenuPage({ tableId, tableName, onBack, onPlaceOrder }: StaffTableMenuPageProps) {
//   const user = getCurrentUser();
//   const navigate = useNavigate();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeCategory, setActiveCategory] = useState("recent");
//   const [cart, setCart] = useState<CartItem[]>([]);
//   const [persons, setPersons] = useState(1);
//   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
//   const [tableDraft, setTableDraft] = useState<TableDraft | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [useCustomPersons, setUseCustomPersons] = useState(persons > 10);
//   const [selectedSpicePercent, setSelectedSpicePercent] = useState<Record<string, number>>({}); // per-menu-item (1-100)
//   const [selectedIsJain, setSelectedIsJain] = useState<Record<string, boolean>>({}); // per-menu-item
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
//   const [showScrollToTop, setShowScrollToTop] = useState(false);
//   const menuEndRef = useRef<HTMLDivElement>(null);
//   const cartSectionRef = useRef<HTMLDivElement>(null);

//   // Get recent items from localStorage
//   const getRecentItems = (): string[] => {
//     if (!user?.restaurantId) return [];
//     const key = `recentItems_${user.restaurantId}`;
//     const stored = localStorage.getItem(key);
//     return stored ? JSON.parse(stored) : [];
//   };

//   // Save item to recent items
//   const saveToRecentItems = (itemId: string) => {
//     if (!user?.restaurantId) return;
//     const key = `recentItems_${user.restaurantId}`;
//     const recent = getRecentItems();
//     const updated = [itemId, ...recent.filter(id => id !== itemId)].slice(0, 20); // Keep last 20 items
//     localStorage.setItem(key, JSON.stringify(updated));
//   };

//   const setSpicePercent = (itemId: string, percent: number) => {
//     setSelectedSpicePercent(prev => ({ ...prev, [itemId]: percent }));
//     // Update cart items with this itemId to have the new spice percent
//     setCart(prev => prev.map(ci => {
//       if (ci.id === itemId) {
//         const level = Math.min(5, Math.max(1, Math.round(percent / 20)));
//         return { ...ci, spicePercent: percent, spiceLevel: level };
//       }
//       return ci;
//     }));
//   };

//   const setIsJain = (itemId: string, isJain: boolean) => {
//     setSelectedIsJain(prev => ({ ...prev, [itemId]: isJain }));
//   };
//   const lastYRef = useRef(0);
//   const { scrollY } = useScroll();
//   const localHeaderY = useSpring(0, { stiffness: 400, damping: 36 });

//   useMotionValueEvent(scrollY, 'change', (latest) => {
//     const last = lastYRef.current;
//     if (latest > last && latest > 10) {
//       localHeaderY.set(-100);
//     } else {
//       localHeaderY.set(0);
//     }
//     lastYRef.current = latest;
//   });

//   // Loader function (callable and used on mount)
//   const loadMenuData = async () => {
//     if (!user?.restaurantId) {
//       setError("No restaurant ID found");
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       // Load categories, menu items, and table draft in parallel
//       const [categoriesData, menuItemsData, draftData] = await Promise.all([
//         getCategories(user.restaurantId),
//         getMenuItems(user.restaurantId),
//         getTableDraft(tableId.toString(), user.restaurantId)
//       ]);

//       setCategories(categoriesData);
//       setMenuItems(menuItemsData);
      
//       // Load existing draft if available
//       if (draftData) {
//         setTableDraft(draftData);
//         setPersons(draftData.persons);
        
//         // Restore cart items and quantities
//         const restoredCart: CartItem[] = [];
//         const restoredQuantities: Record<string, number> = {};
        
//         draftData.cartItems.forEach(item => {
//           restoredCart.push({
//             id: item.itemId,
//             name: item.name,
//             price: item.price,
//             quantity: item.quantity,
//             note: (item as any).note || "",
//             spiceLevel: (item as any).spiceLevel ?? 0,
//             spicePercent: (item as any).spicePercent ?? 50,
//             isJain: (item as any).isJain ?? false
//           });
//           restoredQuantities[item.itemId] = item.quantity;
//         });
        
//         setCart(restoredCart);
//         setItemQuantities(restoredQuantities);
        
//         toast.success("Table draft loaded successfully");
//       }
//     } catch (err) {
//       console.error("Error loading menu data:", err);
//       setError("Failed to load menu data");
//       toast.error("Failed to load menu data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadMenuData();
//   }, [user?.restaurantId, tableId]);

//   // Removed page-level refresh control per request

//   // Restore spice percent and jain status from cart items
//   useEffect(() => {
//     const restoredSpice: Record<string, number> = {};
//     const restoredJain: Record<string, boolean> = {};
    
//     cart.forEach(item => {
//       if (item.spicePercent !== undefined) {
//         restoredSpice[item.id] = item.spicePercent;
//       }
//       if (item.isJain !== undefined) {
//         restoredJain[item.id] = item.isJain;
//       }
//     });
    
//     setSelectedSpicePercent(prev => ({ ...prev, ...restoredSpice }));
//     setSelectedIsJain(prev => ({ ...prev, ...restoredJain }));
//   }, [cart.length]); // Only when cart items count changes

//   // Auto-save when cart or persons change
//   useEffect(() => {
//     if (user?.restaurantId && user?.username) {
//       const timeoutId = setTimeout(() => {
//         autoSaveDraft(cart, persons);
//       }, 1000); // Debounce for 1 second

//       return () => clearTimeout(timeoutId);
//     }
//   }, [cart, persons, user?.restaurantId, user?.username]);

//   // Filter menu items based on search and category
//   const filteredItems = menuItems.filter(item => {
//     const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
//     let matchesCategory = true;
    
//     if (activeCategory === "recent") {
//       const recentItems = getRecentItems();
//       matchesCategory = recentItems.includes(item._id);
//     } else if (activeCategory !== "all") {
//       matchesCategory = item.category === activeCategory;
//     }
    
//     return matchesSearch && matchesCategory;
//   });

//   // Scroll to cart section (draft section at bottom)
//   const scrollToCart = () => {
//     cartSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   // Scroll to top handler
//   const scrollToTop = () => {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   // Show/hide scroll buttons based on position
//   useEffect(() => {
//     const handleScroll = () => {
//       const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//       const windowHeight = window.innerHeight;
//       const documentHeight = document.documentElement.scrollHeight;
      
//       // Get cart section position
//       const cartSection = cartSectionRef.current;
//       if (cartSection) {
//         const cartRect = cartSection.getBoundingClientRect();
//         const cartTop = cartRect.top + scrollTop;
//         const cartBottom = cartTop + cartRect.height;
        
//         // If we're past the cart section, show scroll to top
//         if (scrollTop + windowHeight > cartBottom - 100) {
//           setShowScrollToTop(true);
//           setShowScrollToBottom(false);
//         } else {
//           // If we're not at the cart section yet, show scroll to cart
//           setShowScrollToTop(false);
//           setShowScrollToBottom(scrollTop + windowHeight < cartTop - 100);
//         }
//       } else {
//         // Fallback: show scroll to bottom if cart section not found
//         setShowScrollToBottom(scrollTop + windowHeight < documentHeight - 100);
//         setShowScrollToTop(false);
//       }
//     };

//     window.addEventListener('scroll', handleScroll);
//     handleScroll(); // Check initial position
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, [cart.length]); // Re-check when cart changes

//   // Get quantity for an item
//   const getItemQuantity = (itemId: string): number => {
//     return itemQuantities[itemId] || 0;
//   };

//   // Auto-save draft function
//   const autoSaveDraft = async (cartItems: CartItem[], personsCount: number) => {
//     if (!user?.restaurantId || !user?.username) return;
    
//     try {
//       setSaving(true);
//       const draftData = {
//         tableId: tableId.toString(),
//         tableName: tableName,
//         restaurantId: user.restaurantId,
//         persons: personsCount,
//         cartItems: cartItems.map(item => ({
//           itemId: item.id,
//           name: item.name,
//           price: item.price,
//           quantity: item.quantity,
//           note: item.note || "",
//           spiceLevel: item.spiceLevel ?? 0,
//           spicePercent: item.spicePercent ?? 50,
//           isJain: item.isJain ?? false
//         })),
//         updatedBy: user.username
//       };
      
//       const savedDraft = await saveTableDraft(draftData);
//       setTableDraft(savedDraft);
//     } catch (error: any) {
//       console.error("Error auto-saving draft:", error);
      
//       // Check if error is subscription expired
//       if (error?.response?.data?.subscriptionExpired) {
//         toast.error("Subscription Expired!", {
//           description: error.response.data.error || "Please recharge your plan to continue using the system.",
//           duration: 5000,
//         });
//       } else {
//         toast.error("Failed to save draft", {
//           description: "Please try again",
//         });
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Update item quantity
//   const updateItemQuantity = (itemId: string, change: number) => {
//     setItemQuantities(prev => {
//       const currentQuantity = prev[itemId] || 0;
//       const newQuantity = Math.max(0, currentQuantity + change);
      
//       if (newQuantity === 0) {
//         const { [itemId]: removed, ...rest } = prev;
//         return rest;
//       }
      
//       return { ...prev, [itemId]: newQuantity };
//     });

//     // Also update cart
//     setCart(prev => {
//       const item = menuItems.find(mi => mi._id === itemId);
//       if (!item) return prev;

//       const currentQuantity = itemQuantities[itemId] || 0;
//       const newQuantity = Math.max(0, currentQuantity + change);

//       if (newQuantity === 0) {
//         return prev.filter(cartItem => cartItem.id !== itemId);
//       }

//       const existingItem = prev.find(cartItem => cartItem.id === itemId);
//       if (existingItem) {
//         return prev.map(cartItem =>
//           cartItem.id === itemId
//             ? { ...cartItem, quantity: newQuantity }
//           : cartItem
//         );
//       } else {
//         // Get spice percent from state or default
//         const percent = selectedSpicePercent[item._id] ?? 50;
//         const level = Math.min(5, Math.max(1, Math.round(percent / 20)));
//         const isJain = selectedIsJain[item._id] ?? false;
//         // Save to recent items
//         saveToRecentItems(item._id);
//         return [...prev, { 
//           id: item._id, 
//           name: item.name, 
//           price: item.price, 
//           quantity: newQuantity, 
//           note: "", 
//           spiceLevel: level, 
//           spicePercent: percent, 
//           isJain: isJain 
//         }];
//       }
//     });
//   };

//   const handleNoteChangeAt = (index: number, note: string) => {
//     setCart(prev => prev.map((ci, i) => i === index ? { ...ci, note } : ci));
//   };

//   const handleSpiceChangeAt = (index: number, level: number) => {
//     setCart(prev => prev.map((ci, i) => i === index ? { ...ci, spiceLevel: level } : ci));
//   };

//   // Keep itemId-based spice change for menu cards (applies to all lines of that item)
//   const handleSpiceChange = (itemId: string, level: number) => {
//     setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, spiceLevel: level } : ci));
//   };

//   const updateQuantityAt = (index: number, change: number) => {
//     setCart(prev => {
//       const next = [...prev];
//       const item = next[index];
//       if (!item) return prev;
//       const newQty = item.quantity + change;
//       if (newQty <= 0) {
//         next.splice(index, 1);
//       } else {
//         next[index] = { ...item, quantity: newQty };
//       }
//       return next;
//     });
//   };

//   const removeFromCartAt = (index: number) => {
//     setCart(prev => prev.filter((_, i) => i !== index));
//   };

//   const splitLineAt = (index: number) => {
//     setCart(prev => {
//       const next = [...prev];
//       const item = next[index];
//       if (!item || item.quantity <= 1) return prev;
//       // Decrease current line by 1 and push a new line with qty 1 (same spice/note)
//       next[index] = { ...item, quantity: item.quantity - 1 };
//       next.splice(index + 1, 0, { ...item, quantity: 1 });
//       return next;
//     });
//   };

//   // Add item to cart (legacy function for compatibility)
//   const addToCart = (item: MenuItem) => {
//     if (!item.isAvailable) {
//       toast.error(`${item.name} is not available`);
//       return;
//     }
//     updateItemQuantity(item._id, 1);
//     toast.success(`${item.name} added to cart`);
//   };

//   // Update cart item quantity
//   const updateQuantity = (itemId: string, change: number) => {
//     setCart(prev => {
//       const item = prev.find(cartItem => cartItem.id === itemId);
//       if (!item) return prev;

//       const newQuantity = item.quantity + change;
//       if (newQuantity <= 0) {
//         return prev.filter(cartItem => cartItem.id !== itemId);
//       }

//       return prev.map(cartItem =>
//         cartItem.id === itemId
//           ? { ...cartItem, quantity: newQuantity }
//           : cartItem
//       );
//     });
//   };

//   // Remove item from cart
//   const removeFromCart = (itemId: string) => {
//     setCart(prev => prev.filter(cartItem => cartItem.id !== itemId));
//     toast.success("Item removed from cart");
//   };

//   // Calculate totals (no tax for draft)
//   const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   const total = subtotal; // No tax in draft

//   // Clear draft
//   const handleClearDraft = async () => {
//     if (!user?.restaurantId || !user?.username) return;
    
//     try {
//       await clearTableDraft(tableId.toString(), user.restaurantId, user.username);
//       setCart([]);
//       setPersons(1);
//       setItemQuantities({});
//       setTableDraft(null);
//       toast.success("Draft cleared successfully");
//     } catch (error) {
//       console.error("Error clearing draft:", error);
//       toast.error("Failed to clear draft");
//     }
//   };

//   // Go to bill page
//   const handleGoToBill = () => {
//     if (cart.length === 0) {
//       toast.error("Please add items to cart");
//       return;
//     }
//     if (persons < 1) {
//       toast.error("Please enter number of persons");
//       return;
//     }

//     // Navigate to bill page with cart data
//     const billData = {
//       table: {
//         id: tableId,
//         tableName: tableName
//       },
//       cart: cart,
//       persons: persons
//     };
    
//     navigate("/order-tables/bill", { state: billData });
//   };

//   // Print draft (compact) directly from menu
//   const handlePrintDraft = () => {
//     if (cart.length === 0) {
//       toast.error("Please add items to cart");
//       return;
//     }
//     if (persons < 1) {
//       toast.error("Please enter number of persons");
//       return;
//     }

//     const draftData = {
//       table: {
//         id: tableId,
//         tableName: tableName,
//       },
//       cart: cart,
//       persons: persons,
//     };

//     navigate("/order-tables/print-draft", { state: draftData });
//   };

//   return (
//     <div className="min-h-screen bg-background ">
//       {/* Header */}
//       <motion.header style={{ y: localHeaderY }} className={`fixed left-0 right-0 top-20 z-40 border-b bg-card shadow-sm`}>
//         <div className="container mx-auto px-4">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center gap-4">
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 onClick={onBack}
//                 className="h-10 w-10 hover:bg-primary/10 transition-colors"
//                 title="Back to Tables"
//               >
//                 <ArrowLeft className="h-5 w-5" />
//               </Button>
//               <div>
//                 <h1 className="text-xl sm:text-2xl font-bold">{tableName}</h1>
//                 <p className="text-sm text-muted-foreground hidden sm:block">Table Menu</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-2 sm:gap-4">
//               <div className="flex items-center gap-1 sm:gap-2">
//                 <Users className="h-4 w-4" />
//                 <Select
//                   value={persons <= 10 && !useCustomPersons ? String(persons) : "custom"}
//                   onValueChange={(v) => {
//                     if (v === "custom") {
//                       setUseCustomPersons(true);
//                     } else {
//                       setUseCustomPersons(false);
//                       setPersons(parseInt(v));
//                     }
//                   }}
//                 >
//                   <SelectTrigger className="w-20 sm:w-28 h-8 text-xs sm:text-sm">
//                     <SelectValue placeholder="Persons" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {[1,2,3,4,5,6,7,8,9,10].map(n => (
//                       <SelectItem key={n} value={String(n)}>{n}</SelectItem>
//                     ))}
//                     <SelectItem value="custom">Custom…</SelectItem>
//                   </SelectContent>
//                 </Select>
//                 {useCustomPersons && (
//                   <Input
//                     type="number"
//                     min="1"
//                     value={persons}
//                     onChange={(e) => setPersons(Math.max(1, parseInt(e.target.value) || 1))}
//                     className="w-16 sm:w-20 h-8 text-xs sm:text-sm px-1 sm:px-2"
//                     placeholder="Enter"
//                   />
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </motion.header>
//       {/* Spacer below fixed header */}
//       <div className={'h-16'} />

//       <div className="container mx-auto px-4 py-6">
//         {/* Mobile Back Button - Visible only on mobile */}
//         <div className="lg:hidden mb-4">
//           <Button 
//             variant="outline" 
//             onClick={onBack}
//             className="gap-2"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             Back to Tables
//           </Button>
//         </div>
        
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Menu Section */}
//           <div className="lg:col-span-2">
//             {/* Search Bar */}
//             <div className="mb-6">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//                 <Input
//                   placeholder="Search menu items..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>

//             {/* Categories */}
//             <div className="mb-6">
//               <div className="flex flex-wrap gap-2">
//                 <Button
//                   variant={activeCategory === "recent" ? "default" : "outline"}
//                   size="sm"
//                   onClick={() => setActiveCategory("recent")}
//                   className="gap-2"
//                 >
//                   <span>🕒</span>
//                   Recent Items
//                 </Button>
//                 {categories.map((category) => (
//                   <Button
//                     key={category._id}
//                     variant={activeCategory === category.name ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setActiveCategory(category.name)}
//                     className="gap-2"
//                   >
//                     <span>{category.icon || "🍽️"}</span>
//                     {category.name}
//                   </Button>
//                 ))}
//               </div>
//             </div>

//             {/* Loading State */}
//             {loading && (
//               <div className="flex items-center justify-center py-12">
//                 <Loader2 className="h-8 w-8 animate-spin mr-2" />
//                 <p className="text-muted-foreground">Loading menu items...</p>
//               </div>
//             )}

//             {/* Error State */}
//             {error && (
//               <Card className="p-12 text-center">
//                 <p className="text-destructive mb-4">{error}</p>
//                 <Button onClick={() => window.location.reload()} variant="outline">
//                   Try Again
//                 </Button>
//               </Card>
//             )}

//             {/* Menu Items */}
//             {!loading && !error && (
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                 {filteredItems.map((item) => {
//                   // Get current spice percent from state or cart
//                   const cartItem = cart.find(ci => ci.id === item._id);
//                   const currentSpicePercent = selectedSpicePercent[item._id] ?? cartItem?.spicePercent ?? 50;
//                   const currentIsJain = selectedIsJain[item._id] ?? cartItem?.isJain ?? false;
                  
//                   return (
//                 <motion.div
//                   key={item._id}
//                   initial={{ opacity: 0, y: 12 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                 <Card 
//                   className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${
//                     getItemQuantity(item._id) > 0 
//                       ? 'ring-2 ring-primary shadow-lg' 
//                       : 'hover:scale-[1.02]'
//                   }`}
//                 >
//                   <div className="relative">
//                     <div className="relative h-40 max-h-48 w-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
//                       <img
//                         src={item.image}
//                         alt={item.name}
//                         style={{
//                           maxHeight:"200px",
//                           objectFit:"cover"
//                         }}
//                         className="w-full h-full max-h-48 object-cover hover:scale-110 transition-transform duration-500"
//                       />
//                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
//                       {getItemQuantity(item._id) > 0 && (
//                         <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg animate-pulse">
//                           {getItemQuantity(item._id)}
//                         </div>
//                       )}
//                       <div className="absolute bottom-3 left-3">
//                         <Badge variant="secondary" className="text-xs shadow-md backdrop-blur-sm bg-white/90">
//                           {item.category.replace("-", " ")}
//                         </Badge>
//                       </div>
//                     </div>
//                     <div className="p-4">
//                       <div className="flex items-start justify-between mb-3">
//                         <h3 className="font-bold text-lg">{item.name}</h3>
//                         <span className="font-bold text-xl text-primary">₹{item.price}</span>
//                       </div>
//                       {/* Spice level and Jain options */}
//                       <div className="mb-4 grid grid-cols-2 gap-3">
//                         <div className="space-y-1.5">
//                           <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
//                             🌶️ Spice Level
//                           </label>
//                           <Select
//                             value={String(currentSpicePercent)}
//                             onValueChange={(v) => setSpicePercent(item._id, parseInt(v))}
//                           >
//                             <SelectTrigger className="h-9 border-2 hover:border-primary/50 transition-colors">
//                               <SelectValue placeholder="50%" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="10">🟢 10% Mild</SelectItem>
//                               <SelectItem value="25">🟡 25% Low</SelectItem>
//                               <SelectItem value="50">🟠 50% Medium</SelectItem>
//                               <SelectItem value="75">🔴 75% Hot</SelectItem>
//                               <SelectItem value="100">🔥 100% Extra Hot</SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         <div className="space-y-1.5">
//                           <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
//                             🥗 Jain Option
//                           </label>
//                           <Select
//                             value={currentIsJain ? "true" : "false"}
//                             onValueChange={(v) => {
//                               setIsJain(item._id, v === "true");
//                               // Also update cart items
//                               setCart(prev => prev.map(ci => 
//                                 ci.id === item._id ? { ...ci, isJain: v === "true" } : ci
//                               ));
//                             }}
//                           >
//                             <SelectTrigger className="h-9 border-2 hover:border-primary/50 transition-colors">
//                               <SelectValue placeholder="No" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="false">❌ No</SelectItem>
//                               <SelectItem value="true">✅ Yes</SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                       </div>
//                       {/* Quantity Controls */}
//                       {getItemQuantity(item._id) > 0 ? (
//                         <div className="space-y-3">
//                           <div className="flex items-center justify-between w-full bg-primary/5 rounded-lg p-2">
//                             <div className="flex items-center gap-2">
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() => updateItemQuantity(item._id, -1)}
//                                 className="h-9 w-9 p-0 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
//                               >
//                                 <Minus className="h-4 w-4" />
//                               </Button>
//                               <span className="min-w-[2rem] text-center font-bold text-lg">
//                                 {getItemQuantity(item._id)}
//                               </span>
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() => updateItemQuantity(item._id, 1)}
//                                 className="h-9 w-9 p-0 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
//                                 disabled={!item.isAvailable}
//                               >
//                                 <Plus className="h-4 w-4" />
//                               </Button>
//                             </div>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               onClick={() => updateItemQuantity(item._id, -getItemQuantity(item._id))}
//                               className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
                         
//                         </div>
//                       ) : (
//                         <Button
//                           onClick={() => updateItemQuantity(item._id, 1)}
//                           className="w-full h-10 font-semibold shadow-md hover:shadow-lg transition-all"
//                           disabled={!item.isAvailable}
//                         >
//                           <Plus className="h-5 w-5 mr-2" />
//                           {item.isAvailable ? "Add to Cart" : "Not Available"}
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </Card>
//                 </motion.div>
//                 );
//                 })}
//                 <div ref={menuEndRef} />
//               </div>
//             )}

//             {/* Empty State */}
//             {!loading && !error && filteredItems.length === 0 && (
//               <Card className="p-12 text-center">
//                 <p className="text-muted-foreground">No items found</p>
//                 <p className="text-sm text-muted-foreground mt-2">
//                   Try adjusting your search or category filter
//                 </p>
//               </Card>
//             )}
//           </div>

//           {/* Cart Section */}
//           <div className="lg:col-span-1" ref={cartSectionRef}>
//             <Card className="sticky top-24">
//               <div className="p-6">
//                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//                   <ShoppingCart className="h-5 w-5" />
//                   Order Summary
//                 </h3>

//                 {cart.length === 0 ? (
//                   <div className="text-center py-8">
//                     <p className="text-muted-foreground">Cart is empty</p>
//                     <p className="text-sm text-muted-foreground mt-2">
//                       Add items from the menu
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <ScrollArea className="max-h-96 mb-4">
//                       <div className="space-y-3">
//                         {cart.map((item, index) => (
//                           <motion.div
//                             key={item.id}
//                             initial={{ opacity: 0, y: 8 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ duration: 0.15 }}
//                             className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 shadow-sm hover:shadow-md transition-shadow"
//                           >
//                             <div className="space-y-3">
//                               <div className="flex items-start justify-between">
//                                 <div className="flex-1 pr-3">
//                                   <p className="font-bold text-base">{item.name}</p>
//                                   <p className="text-sm text-muted-foreground">₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}</p>
//                                 </div>
//                                 <Button
//                                   size="icon"
//                                   variant="ghost"
//                                   onClick={() => removeFromCartAt(index)}
//                                   className="h-8 w-8 text-destructive hover:bg-destructive/10"
//                                 >
//                                   <Trash2 className="h-4 w-4" />
//                                 </Button>
//                               </div>
                              
//                               <Input
//                                 placeholder="Add note (optional)"
//                                 value={item.note || ""} 
                                
//                                 onChange={(e) => handleNoteChangeAt(index, e.target.value)}
//                                 className="h-9 text-sm bg-white/80 border-primary/30 focus:border-primary"
//                               />
                              
//                               <div className="flex items-center justify-between">
//                                 <div className="flex items-center gap-3">
//                                   <div className="flex items-center gap-1.5 px-2 py-1 bg-white/60 rounded-md">
//                                     <span className="text-xs font-medium text-muted-foreground">🌶️</span>
//                                     <span className="text-sm font-semibold">{(item.spicePercent ?? 50)}%</span>
//                                   </div>
//                                   {item.isJain && (
//                                     <Badge variant="secondary" className="text-xs shadow-sm">
//                                       🥗 Jain
//                                     </Badge>
//                                   )}
//                                 </div>
                                
//                                 <div className="flex items-center gap-2 bg-white/60 rounded-lg p-1">
//                                   <Button
//                                     size="icon"
//                                     variant="ghost"
//                                     onClick={() => updateQuantityAt(index, -1)}
//                                     className="h-7 w-7 hover:bg-primary/20"
//                                   >
//                                     <Minus className="h-3 w-3" />
//                                   </Button>
//                                   <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
//                                   <Button
//                                     size="icon"
//                                     variant="ghost"
//                                     onClick={() => updateQuantityAt(index, 1)}
//                                     className="h-7 w-7 hover:bg-primary/20"
//                                   >
//                                     <Plus className="h-3 w-3" />
//                                   </Button>
//                                 </div>
//                               </div>
//                             </div>
//                           </motion.div>
//                         ))}
//                       </div>
//                     </ScrollArea>

//                     {/* Persons Count */}
//                     <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2">
//                           <Users className="h-4 w-4 text-blue-600" />
//                           <span className="text-sm font-medium text-blue-800">Persons:</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => setPersons(Math.max(1, persons - 1))}
//                             className="h-7 w-7 p-0"
//                           >
//                             <Minus className="h-3 w-3" />
//                           </Button>
//                           <span className="w-8 text-center font-bold text-sm">{persons}</span>
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => setPersons(persons + 1)}
//                             className="h-7 w-7 p-0"
//                           >
//                             <Plus className="h-3 w-3" />
//                           </Button>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Totals */}
//                     <div className="space-y-3 mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
//                       <div className="flex justify-between text-base">
//                         <span className="text-muted-foreground">Subtotal:</span>
//                         <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
//                       </div>
//                       <div className="flex justify-between font-bold text-xl border-t-2 border-primary/30 pt-3">
//                         <span>Total:</span>
//                         <span className="text-primary">₹{total.toFixed(2)}</span>
//                       </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="space-y-3">
//                       <Button
//                         onClick={handleGoToBill}
//                         className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all"
//                         size="lg"
//                       >
//                         <Check className="h-5 w-5 mr-2" />
//                         Go to Bill
//                       </Button>
//                       <Button
//                         onClick={handlePrintDraft}
//                         className="w-full h-10"
//                         variant="outline"
//                         size="default"
//                       >
//                         <Printer className="h-4 w-4 mr-2" />
//                         Print Draft
//                       </Button>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </Card>
//           </div>
//         </div>
//       </div>

//       {/* Scroll to Cart/Top Button - Fixed at bottom right */}
//       {showScrollToBottom && (
//         <Button
//           onClick={scrollToCart}
//           className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50 print:hidden"
//           size="icon"
//           title="Go to Cart"
//         >
//           <ArrowDown className="h-5 w-5" />
//         </Button>
//       )}
//       {showScrollToTop && (
//         <Button
//           onClick={scrollToTop}
//           className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50 print:hidden"
//           size="icon"
//           title="Go to Top"
//         >
//           <ArrowUp className="h-5 w-5" />
//         </Button>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from "react";
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
  Loader2,
  Printer,
  ArrowDown,
  ArrowUp
} from "lucide-react";
import { getCurrentUser } from "../utils/auth";
import { toast } from "sonner";
import { getMenuItems, getCategories } from "../api/menuApi";
import { saveTableDraft, getTableDraft, clearTableDraft, TableDraft } from "../api/tableDraftApi";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, useSpring } from "framer-motion";

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
  spiceLevel?: number;
  spicePercent?: number;
  isJain?: boolean;
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
  const [activeCategory, setActiveCategory] = useState("recent");
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
  const [selectedSpicePercent, setSelectedSpicePercent] = useState<Record<string, number>>({}); // per-menu-item (1-100)
  const [selectedIsJain, setSelectedIsJain] = useState<Record<string, boolean>>({}); // per-menu-item
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const menuEndRef = useRef<HTMLDivElement>(null);
  const cartSectionRef = useRef<HTMLDivElement>(null);

  // Get recent items from localStorage
  const getRecentItems = (): string[] => {
    if (!user?.restaurantId) return [];
    const key = `recentItems_${user.restaurantId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  };

  // Save item to recent items
  const saveToRecentItems = (itemId: string) => {
    if (!user?.restaurantId) return;
    const key = `recentItems_${user.restaurantId}`;
    const recent = getRecentItems();
    const updated = [itemId, ...recent.filter(id => id !== itemId)].slice(0, 20); // Keep last 20 items
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const setSpicePercent = (itemId: string, percent: number) => {
    setSelectedSpicePercent(prev => ({ ...prev, [itemId]: percent }));
    // Update cart items with this itemId to have the new spice percent
    setCart(prev => prev.map(ci => {
      if (ci.id === itemId) {
        const level = Math.min(5, Math.max(1, Math.round(percent / 20)));
        return { ...ci, spicePercent: percent, spiceLevel: level };
      }
      return ci;
    }));
  };

  const setIsJain = (itemId: string, isJain: boolean) => {
    setSelectedIsJain(prev => ({ ...prev, [itemId]: isJain }));
  };
  const lastYRef = useRef(0);
  const { scrollY } = useScroll();
  const localHeaderY = useSpring(0, { stiffness: 400, damping: 36 });

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const last = lastYRef.current;
    if (latest > last && latest > 10) {
      localHeaderY.set(-100);
    } else {
      localHeaderY.set(0);
    }
    lastYRef.current = latest;
  });

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
            note: (item as any).note || "",
            spiceLevel: (item as any).spiceLevel ?? 0,
            spicePercent: (item as any).spicePercent ?? 50,
            isJain: (item as any).isJain ?? false
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

  // Restore spice percent and jain status from cart items
  useEffect(() => {
    const restoredSpice: Record<string, number> = {};
    const restoredJain: Record<string, boolean> = {};
    
    cart.forEach(item => {
      if (item.spicePercent !== undefined) {
        restoredSpice[item.id] = item.spicePercent;
      }
      if (item.isJain !== undefined) {
        restoredJain[item.id] = item.isJain;
      }
    });
    
    setSelectedSpicePercent(prev => ({ ...prev, ...restoredSpice }));
    setSelectedIsJain(prev => ({ ...prev, ...restoredJain }));
  }, [cart.length]); // Only when cart items count changes

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
    let matchesCategory = true;
    
    if (activeCategory === "recent") {
      const recentItems = getRecentItems();
      matchesCategory = recentItems.includes(item._id);
    } else if (activeCategory !== "all") {
      matchesCategory = item.category === activeCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  // Scroll to cart section (draft section at bottom)
  const scrollToCart = () => {
    cartSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Improved scroll detection logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show scroll to top when scrolled down more than 300px
      setShowScrollToTop(scrollTop > 300);
      
      // Show scroll to cart when cart section is not in view and we're not at the bottom
      const cartSection = cartSectionRef.current;
      if (cartSection) {
        const cartRect = cartSection.getBoundingClientRect();
        const isCartInView = cartRect.top >= 0 && cartRect.bottom <= windowHeight;
        setShowScrollToBottom(!isCartInView && scrollTop + windowHeight < documentHeight - 100);
      } else {
        // Fallback logic
        setShowScrollToBottom(scrollTop + windowHeight < documentHeight - 200);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [cart.length]);

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
          note: item.note || "",
          spiceLevel: item.spiceLevel ?? 0,
          spicePercent: item.spicePercent ?? 50,
          isJain: item.isJain ?? false
        })),
        updatedBy: user.username
      };
      
      const savedDraft = await saveTableDraft(draftData);
      setTableDraft(savedDraft);
    } catch (error: any) {
      console.error("Error auto-saving draft:", error);
      
      // Check if error is subscription expired
      if (error?.response?.data?.subscriptionExpired) {
        toast.error("Subscription Expired!", {
          description: error.response.data.error || "Please recharge your plan to continue using the system.",
          duration: 5000,
        });
      } else {
        toast.error("Failed to save draft", {
          description: "Please try again",
        });
      }
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
        // Get spice percent from state or default
        const percent = selectedSpicePercent[item._id] ?? 50;
        const level = Math.min(5, Math.max(1, Math.round(percent / 20)));
        const isJain = selectedIsJain[item._id] ?? false;
        // Save to recent items
        saveToRecentItems(item._id);
        return [...prev, { 
          id: item._id, 
          name: item.name, 
          price: item.price, 
          quantity: newQuantity, 
          note: "", 
          spiceLevel: level, 
          spicePercent: percent, 
          isJain: isJain 
        }];
      }
    });
  };

  const handleNoteChangeAt = (index: number, note: string) => {
    setCart(prev => prev.map((ci, i) => i === index ? { ...ci, note } : ci));
  };

  const handleSpiceChangeAt = (index: number, level: number) => {
    setCart(prev => prev.map((ci, i) => i === index ? { ...ci, spiceLevel: level } : ci));
  };

  // Keep itemId-based spice change for menu cards (applies to all lines of that item)
  const handleSpiceChange = (itemId: string, level: number) => {
    setCart(prev => prev.map(ci => ci.id === itemId ? { ...ci, spiceLevel: level } : ci));
  };

  const updateQuantityAt = (index: number, change: number) => {
    setCart(prev => {
      const next = [...prev];
      const item = next[index];
      if (!item) return prev;
      const newQty = item.quantity + change;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...item, quantity: newQty };
      }
      return next;
    });
  };

  const removeFromCartAt = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const splitLineAt = (index: number) => {
    setCart(prev => {
      const next = [...prev];
      const item = next[index];
      if (!item || item.quantity <= 1) return prev;
      // Decrease current line by 1 and push a new line with qty 1 (same spice/note)
      next[index] = { ...item, quantity: item.quantity - 1 };
      next.splice(index + 1, 0, { ...item, quantity: 1 });
      return next;
    });
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

  // Print draft (compact) directly from menu
  const handlePrintDraft = () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }
    if (persons < 1) {
      toast.error("Please enter number of persons");
      return;
    }

    const draftData = {
      table: {
        id: tableId,
        tableName: tableName,
      },
      cart: cart,
      persons: persons,
    };

    navigate("/order-tables/print-draft", { state: draftData });
  };

  return (
    <div className="min-h-screen bg-background ">
      {/* Header */}
      <motion.header style={{ y: localHeaderY }} className={`fixed left-0 right-0 top-20 z-40 border-b bg-card shadow-sm`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onBack}
                className="h-10 w-10 hover:bg-primary/10 transition-colors"
                title="Back to Tables"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{tableName}</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Table Menu</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
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
                  <SelectTrigger className="w-20 sm:w-28 h-8 text-xs sm:text-sm">
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
                    className="w-16 sm:w-20 h-8 text-xs sm:text-sm px-1 sm:px-2"
                    placeholder="Enter"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>
      {/* Spacer below fixed header */}
      <div className={'h-16'} />

      <div className="container mx-auto px-4 py-6">
        {/* Mobile Back Button - Visible only on mobile */}
        <div className="lg:hidden mb-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tables
          </Button>
        </div>
        
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
                  variant={activeCategory === "recent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory("recent")}
                  className="gap-2"
                >
                  <span>🕒</span>
                  Recent Items
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredItems.map((item) => {
                  // Get current spice percent from state or cart
                  const cartItem = cart.find(ci => ci.id === item._id);
                  const currentSpicePercent = selectedSpicePercent[item._id] ?? cartItem?.spicePercent ?? 50;
                  const currentIsJain = selectedIsJain[item._id] ?? cartItem?.isJain ?? false;
                  
                  return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                <Card 
                  className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    getItemQuantity(item._id) > 0 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:scale-[1.02]'
                  }`}
                >
                  <div className="relative">
                    <div className="relative h-40 max-h-48 w-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          maxHeight:"200px",
                          objectFit:"cover"
                        }}
                        className="w-full h-full max-h-48 object-cover hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {getItemQuantity(item._id) > 0 && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg animate-pulse">
                          {getItemQuantity(item._id)}
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="text-xs shadow-md backdrop-blur-sm bg-white/90">
                          {item.category.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <span className="font-bold text-xl text-primary">₹{item.price}</span>
                      </div>
                      {/* Spice level and Jain options */}
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            🌶️ Spice Level
                          </label>
                          <Select
                            value={String(currentSpicePercent)}
                            onValueChange={(v) => setSpicePercent(item._id, parseInt(v))}
                          >
                            <SelectTrigger className="h-9 border-2 hover:border-primary/50 transition-colors">
                              <SelectValue placeholder="50%" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">🟢 10% Mild</SelectItem>
                              <SelectItem value="25">🟡 25% Low</SelectItem>
                              <SelectItem value="50">🟠 50% Medium</SelectItem>
                              <SelectItem value="75">🔴 75% Hot</SelectItem>
                              <SelectItem value="100">🔥 100% Extra Hot</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            🥗 Jain Option
                          </label>
                          <Select
                            value={currentIsJain ? "true" : "false"}
                            onValueChange={(v) => {
                              setIsJain(item._id, v === "true");
                              // Also update cart items
                              setCart(prev => prev.map(ci => 
                                ci.id === item._id ? { ...ci, isJain: v === "true" } : ci
                              ));
                            }}
                          >
                            <SelectTrigger className="h-9 border-2 hover:border-primary/50 transition-colors">
                              <SelectValue placeholder="No" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="false">❌ No</SelectItem>
                              <SelectItem value="true">✅ Yes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Quantity Controls */}
                      {getItemQuantity(item._id) > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between w-full bg-primary/5 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item._id, -1)}
                                className="h-9 w-9 p-0 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="min-w-[2rem] text-center font-bold text-lg">
                                {getItemQuantity(item._id)}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(item._id, 1)}
                                className="h-9 w-9 p-0 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                disabled={!item.isAvailable}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateItemQuantity(item._id, -getItemQuantity(item._id))}
                              className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                         
                        </div>
                      ) : (
                        <Button
                          onClick={() => updateItemQuantity(item._id, 1)}
                          className="w-full h-10 font-semibold shadow-md hover:shadow-lg transition-all"
                          disabled={!item.isAvailable}
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          {item.isAvailable ? "Add to Cart" : "Not Available"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
                </motion.div>
                );
                })}
                <div ref={menuEndRef} />
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
          <div className="lg:col-span-1" ref={cartSectionRef}>
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
                        {cart.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                            className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-3">
                                  <p className="font-bold text-base">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeFromCartAt(index)}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <Input
                                placeholder="Add note (optional)"
                                value={item.note || ""} 
                                
                                onChange={(e) => handleNoteChangeAt(index, e.target.value)}
                                className="h-9 text-sm bg-white/80 border-primary/30 focus:border-primary"
                              />
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/60 rounded-md">
                                    <span className="text-xs font-medium text-muted-foreground">🌶️</span>
                                    <span className="text-sm font-semibold">{(item.spicePercent ?? 50)}%</span>
                                  </div>
                                  {item.isJain && (
                                    <Badge variant="secondary" className="text-xs shadow-sm">
                                      🥗 Jain
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 bg-white/60 rounded-lg p-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => updateQuantityAt(index, -1)}
                                    className="h-7 w-7 hover:bg-primary/20"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => updateQuantityAt(index, 1)}
                                    className="h-7 w-7 hover:bg-primary/20"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Persons Count */}
                    <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Persons:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPersons(Math.max(1, persons - 1))}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-bold text-sm">{persons}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPersons(persons + 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="space-y-3 mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xl border-t-2 border-primary/30 pt-3">
                        <span>Total:</span>
                        <span className="text-primary">₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleGoToBill}
                        className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Go to Bill
                      </Button>
                      <Button
                        onClick={handlePrintDraft}
                        className="w-full h-10"
                        variant="outline"
                        size="default"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Draft
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Scroll to Cart/Top Button - Fixed at bottom right */}
      {showScrollToBottom && (
        <Button
          onClick={scrollToCart}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50 print:hidden bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          size="icon"
          title="Go to Cart"
          style={{ zIndex: 1000  , backgroundColor: "white", color: "black", position: "fixed" , bottom: "6px" , right: "6px"}}

        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-lg z-50 print:hidden bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          size="icon"
          title="Go to Top"
          style={{ zIndex: 1000  , backgroundColor: "white", color: "black", position: "fixed" , bottom: "6px" , right: "6px"}}

        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}