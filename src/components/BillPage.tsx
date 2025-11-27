// import React, { useState, useEffect } from "react";
// import { Button } from "./ui/button";
// import { Card } from "./ui/card";
// import { Badge } from "./ui/badge";
// import { ScrollArea } from "./ui/scroll-area";
// import { Input } from "./ui/input";
// import {
//   ArrowLeft,
//   Plus,
//   Minus,
//   Trash2,
//   Save,
//   Printer,
//   ShoppingCart,
//   Users,
//   Clock,
//   DollarSign
// } from "lucide-react";
// import { getCurrentUser, getRestaurantKey } from "../utils/auth";
// import { toast } from "sonner";
// import { getMenuItems, getCategories } from "../api/menuApi";
// import { clearTableDraft, getTableDraft, deleteTableDraft } from "../api/tableDraftApi";
import { createBill, updateBill } from "../api/billApi";

// interface MenuItem {
//   _id: string;
//   name: string;
//   image: string;
//   price: number;
//   description: string;
//   category: string;
//   spiceLevel: number;
//   isAvailable: boolean;
// }

// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
//   note?: string;
//   spicePercent?: number;
//   isJain?: boolean;
//   discountAmount?: number; // Discount in ₹ for this item
//   addedBy?: {
//     userId: string;
//     userName: string;
//   };
// }

// interface BillPageProps {
//   tableId: number;
//   tableName: string;
//   initialCart: CartItem[];
//   initialPersons: number;
//   initialTotalDiscount?: number; // Optional initial total discount
//   initialAdditionalPrice?: number; // Optional initial additional price
//   onBack: () => void;
//   onSaveAndPrint?: (data: any) => void;
//   isEdit?: boolean; // Whether this is an edit operation
//   originalBillId?: string; // MongoDB ID of the bill being edited
//   originalBillNumber?: string; // Original bill number to preserve
// }

// export function BillPage({
//   tableId,
//   tableName,
//   initialCart,
//   initialPersons,
//   initialTotalDiscount = 0,
//   initialAdditionalPrice = 0,
//   onBack,
//   onSaveAndPrint,
//   isEdit = false,
//   originalBillId,
//   originalBillNumber
// }: BillPageProps) {
//   const user = getCurrentUser();
//   const [cart, setCart] = useState<CartItem[]>(initialCart);
//   const [persons, setPersons] = useState(initialPersons);
//   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
//   const [categories, setCategories] = useState<any[]>([]);
//   const [showAddItems, setShowAddItems] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeCategory, setActiveCategory] = useState("all");
//   const [totalDiscount, setTotalDiscount] = useState(initialTotalDiscount); // Total discount in ₹
//   const [additionalPrice, setAdditionalPrice] = useState(initialAdditionalPrice); // Additional charges/price in ₹

//   // Load menu data
//   useEffect(() => {
//     const loadMenuData = async () => {
//       if (!user?.restaurantId) return;

//       try {
//         const [categoriesData, menuItemsData] = await Promise.all([
//           getCategories(user.restaurantId),
//           getMenuItems(user.restaurantId)
//         ]);

//         setCategories(categoriesData);
//         setMenuItems(menuItemsData);
//       } catch (error) {
//         console.error("Error loading menu data:", error);
//         toast.error("Failed to load menu data");
//       }
//     };

//     loadMenuData();
//   }, [user?.restaurantId]);

//   // Filter menu items
//   const filteredItems = menuItems.filter(item => {
//     const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesCategory = activeCategory === "all" || item.category === activeCategory;
//     return matchesSearch && matchesCategory;
//   });

//   // Add item to cart
//   const addToCart = (item: MenuItem) => {
//     if (!item.isAvailable) {
//       toast.error(`${item.name} is not available`);
//       return;
//     }

//     setCart(prevCart => {
//       const existingItem = prevCart.find(cartItem => cartItem.id === item._id);
//       if (existingItem) {
//         return prevCart.map(cartItem =>
//           cartItem.id === item._id
//             ? {
//               ...cartItem,
//               quantity: cartItem.quantity + 1,
//               addedBy: user ? { userId: user.id, userName: user.name } : cartItem.addedBy
//             }
//             : cartItem
//         );
//       }
//       return [
//         ...prevCart,
//         {
//           id: item._id,
//           name: item.name,
//           price: item.price,
//           quantity: 1,
//           addedBy: user ? { userId: user.id, userName: user.name } : undefined
//         }
//       ];
//     });
//     toast.success(`${item.name} added to cart`);
//   };

//   // Update item quantity
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

//   // Update item discount
//   const updateItemDiscount = (itemId: string, discount: number) => {
//     setCart(prev => prev.map(cartItem =>
//       cartItem.id === itemId
//         ? { ...cartItem, discountAmount: Math.max(0, discount) }
//         : cartItem
//     ));
//   };

//   // Remove item from cart
//   const removeFromCart = (itemId: string) => {
//     setCart(prev => prev.filter(cartItem => cartItem.id !== itemId));
//     toast.success("Item removed from cart");
//   };

//   // Calculate totals (with item discounts)
//   const subtotal = cart.reduce((sum, item) => {
//     const itemTotal = (item.price * item.quantity);
//     const itemDiscount = item.discountAmount || 0;
//     return sum + itemTotal - itemDiscount;
//   }, 0);

//   // Apply total discount and additional price
//   const total = Math.max(0, subtotal - totalDiscount + additionalPrice);

//   // Persist bill to API (database) - PRIMARY method
//   const persistBillHistory = async (billNum?: string) => {
//     if (!user?.restaurantId) {
//       toast.error("User information missing. Cannot save bill.");
//       throw new Error("User information missing");
//     }

//     // Use original bill number if editing, otherwise generate new one
//     const billNumber = isEdit && originalBillNumber
//       ? originalBillNumber
//       : (billNum || `BILL-${Date.now()}`);

//     const billRecord = {
//       billNumber,
//       tableId: tableId.toString(),
//       tableName,
//       persons,
//       grandTotal: total,
//       date: new Date().toISOString(),
//       items: cart,
//     };

//     // Check if we have a token for API calls
//     const token = localStorage.getItem("token");
//     if (!token) {
//       const errorMsg = "Not logged in to server. Please login again to save bills.";
//       console.error(errorMsg);
//       toast.error(errorMsg);
//       throw new Error(errorMsg);
//     }

//     try {
//       // Calculate item discounts for API
//       const itemsWithDiscounts = cart.map(item => ({
//         ...item,
//         discountAmount: item.discountAmount || 0
//       }));

//       const billData = {
//         tableId: tableId.toString(),
//         tableName,
//         persons,
//         items: itemsWithDiscounts,
//         subtotal: subtotal,
//         additionalCharges: additionalPrice > 0 ? [{ id: Date.now(), name: "Additional Charges", amount: additionalPrice }] : [],
//         discountAmount: totalDiscount, // Total discount on bill
//         grandTotal: total,
//         restaurantId: user.restaurantId, // Explicitly pass restaurantId
//         createdBy: user.username || 'staff'
//       };

//       if (isEdit && originalBillId) {
//         // Update existing bill
//         console.log("Attempting to update bill in API (database) with:", {
//           billId: originalBillId,
//           billNumber,
//           restaurantId: user.restaurantId,
//           username: user.username,
//           itemsCount: cart.length,
//           grandTotal: total
//         });

//         const { updateBill } = await import("../api/billApi");
//         const updatedBill = await updateBill(originalBillId, billData);

//         console.log("✅ Bill updated in database successfully:", updatedBill);

//         // Update localStorage cache
//         try {
//           const key = getRestaurantKey("billHistory", user.restaurantId);
//           const stored = localStorage.getItem(key);
//           if (stored) {
//             const history = JSON.parse(stored);
//             const updated = history.map((bill: any) =>
//               bill._id === originalBillId || bill.billNumber === billNumber
//                 ? { ...billRecord, _id: originalBillId }
//                 : bill
//             );
//             localStorage.setItem(key, JSON.stringify(updated));
//           }
//         } catch (e) {
//           console.warn("Failed to update bill in localStorage cache:", e);
//         }

//         toast.success("Bill updated successfully!");
//         return billNumber;
//       } else {
//         // Create new bill
//         console.log("Attempting to save bill to API (database) with:", {
//           billNumber,
//           restaurantId: user.restaurantId,
//           username: user.username,
//           itemsCount: cart.length,
//           grandTotal: total
//         });

//         const { createBill } = await import("../api/billApi");
//         const savedBill = await createBill({
//           ...billData,
//           billNumber
//         } as any);

//         console.log("✅ Bill saved to database successfully:", savedBill);

//         // Also save to localStorage as backup/cache
//         try {
//           const key = getRestaurantKey("billHistory", user.restaurantId);
//           const stored = localStorage.getItem(key);
//           const history = stored ? JSON.parse(stored) : [];
//           const updated = [billRecord, ...history];
//           localStorage.setItem(key, JSON.stringify(updated));
//         } catch (e) {
//           console.warn("Failed to save bill to localStorage cache:", e);
//         }

//         toast.success("Bill saved to database successfully!");
//         return billNumber;
//       }
//     } catch (error: any) {
//       console.error(`❌ Failed to ${isEdit ? 'update' : 'save'} bill to API (database):`, error);

//       // Extract error message from various possible locations
//       let errorMessage = "Unknown error";
//       if (error?.response?.data?.error) {
//         errorMessage = error.response.data.error;
//       } else if (error?.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error?.message) {
//         errorMessage = error.message;
//       } else if (typeof error?.response?.data === 'string') {
//         errorMessage = error.response.data;
//       }

//       console.error("Full error details:", {
//         message: errorMessage,
//         status: error?.response?.status,
//         statusText: error?.response?.statusText,
//         data: error?.response?.data,
//         restaurantId: user?.restaurantId,
//         username: user?.username,
//         hasToken: !!token,
//         tokenLength: token?.length,
//         fullError: error
//       });

//       // Don't save to localStorage if API fails - we want to force database saves
//       toast.error(`Failed to ${isEdit ? 'update' : 'save'} bill: ${errorMessage}. Please check your connection and try again.`);
//       throw error; // Re-throw to prevent navigation
//     }
//   };

//   // Save only
//   const handleSaveOnly = async () => {
//     if (cart.length === 0) {
//       toast.error("Cart is empty");
//       return;
//     }

//     try {
//       // Save bill to database FIRST (this will throw if it fails)
//       await persistBillHistory();

//       // Clear the draft only after successful save
//       if (user?.restaurantId && user?.username) {
//         try {
//           const clearResp = await clearTableDraft(tableId.toString(), user.restaurantId, user.username);
//           console.log("clearTableDraft response:", clearResp);

//           // Verify draft actually cleared server-side. If still present, attempt delete as a fallback.
//           try {
//             const remaining = await getTableDraft(tableId.toString(), user.restaurantId);
//             if (remaining && remaining.cartItems && remaining.cartItems.length > 0) {
//               console.warn("Draft still present after clear, attempting deleteTableDraft");
//               await deleteTableDraft(tableId.toString(), user.restaurantId);
//             }
//           } catch (verifyErr) {
//             console.warn("Failed to verify or delete draft after clear:", verifyErr);
//           }
//         } catch (draftError) {
//           console.warn("Failed to clear draft, but bill is saved:", draftError);
//         }
//       }

//       // Navigate back only after successful save
//       onBack();
//     } catch (error) {
//       console.error("Error saving bill:", error);
//       // Error message already shown in persistBillHistory
//       // Don't navigate - let user try again
//     }
//   };

//   // Update and print bill (for edit operations)
//   const handleUpdateAndPrint = async () => {
//     if (cart.length === 0) {
//       toast.error("Cart is empty");
//       return;
//     }

//     try {
//       // Use original bill number if editing
//       const billNumber = originalBillNumber || `BILL-${Date.now()}`;

//       // Update bill to database FIRST (this will throw if it fails)
//       await persistBillHistory(billNumber);

//       // Clear the draft after successful update - MUST complete before navigation
//       if (user?.restaurantId && user?.username) {
//         try {
//           // First attempt: clear the draft
//           await clearTableDraft(tableId.toString(), user.restaurantId, user.username);
//           console.log("clearTableDraft called successfully");

//           // Wait a moment for server to process
//           await new Promise(resolve => setTimeout(resolve, 300));

//           // Verify draft is actually cleared
//           let remaining: any = null;
//           try {
//             remaining = await getTableDraft(tableId.toString(), user.restaurantId);
//           } catch (getErr) {
//             // If getTableDraft fails (e.g., draft doesn't exist), that's good - draft is cleared
//             console.log("getTableDraft failed (likely draft doesn't exist - this is good):", getErr);
//           }

//           // If draft still exists, try delete as fallback
//           if (remaining && remaining.cartItems && remaining.cartItems.length > 0) {
//             console.warn("Draft still present after clear, attempting deleteTableDraft");
//             await deleteTableDraft(tableId.toString(), user.restaurantId);

//             // Wait again and verify after delete
//             await new Promise(resolve => setTimeout(resolve, 300));

//             try {
//               const stillRemaining = await getTableDraft(tableId.toString(), user.restaurantId);
//               if (stillRemaining && stillRemaining.cartItems && stillRemaining.cartItems.length > 0) {
//                 console.error("❌ Draft still exists after both clear and delete attempts");
//                 toast.error("Failed to clear draft. Please clear it manually from the table.");
//                 // Don't proceed with print if draft couldn't be cleared
//                 return;
//               }
//             } catch (finalVerifyErr) {
//               // If getTableDraft fails now, draft is cleared - that's good
//               console.log("Draft cleared after delete (getTableDraft failed - expected):", finalVerifyErr);
//             }
//           }

//           console.log("✅ Draft cleared successfully after update and print");
//           toast.success("Bill updated and draft cleared successfully!");
//         } catch (draftError) {
//           console.error("❌ Failed to clear draft after update and print:", draftError);
//           toast.error("Bill updated but failed to clear draft. Please clear it manually.");
//           // Don't proceed with print if draft clearing fails - ensure data consistency
//           return;
//         }
//       }

//       // Create print data with discounts and additional charges
//       // Only proceed if draft clearing was successful (or skipped if no user info)
//       const printData = {
//         billNumber,
//         tableName,
//         persons,
//         items: cart.map(item => ({
//           ...item,
//           discountAmount: item.discountAmount || 0
//         })),
//         additionalCharges: additionalPrice > 0 ? [{ id: Date.now(), name: "Additional Charges", amount: additionalPrice }] : [],
//         discountAmount: totalDiscount,
//         cgst: 0,
//         sgst: 0,
//         grandTotal: total,
//       };

//       // Call parent callback if provided - draft clearing is complete at this point
//       if (onSaveAndPrint) {
//         onSaveAndPrint(printData);
//       } else {
//         toast.error("Print functionality not available");
//       }
//     } catch (error) {
//       console.error("Error updating bill:", error);
//       // Error message already shown in persistBillHistory
//       // Don't proceed with print if update failed
//     }
//   };

//   // Save and print bill (for new bills)
//   const handleSaveAndPrint = async () => {
//     if (cart.length === 0) {
//       toast.error("Cart is empty");
//       return;
//     }

//     try {
//       // Generate new bill number
//       const billNumber = `BILL-${Date.now()}`;

//       // Save bill to database FIRST (this will throw if it fails)
//       await persistBillHistory(billNumber);

//       // Clear the draft only after successful save - MUST complete before navigation
//       if (user?.restaurantId && user?.username) {
//         try {
//           // First attempt: clear the draft
//           await clearTableDraft(tableId.toString(), user.restaurantId, user.username);
//           console.log("clearTableDraft called successfully");

//           // Wait a moment for server to process
//           await new Promise(resolve => setTimeout(resolve, 300));

//           // Verify draft is actually cleared
//           let remaining: any = null;
//           try {
//             remaining = await getTableDraft(tableId.toString(), user.restaurantId);
//           } catch (getErr) {
//             // If getTableDraft fails (e.g., draft doesn't exist), that's good - draft is cleared
//             console.log("getTableDraft failed (likely draft doesn't exist - this is good):", getErr);
//           }

//           // If draft still exists, try delete as fallback
//           if (remaining && remaining.cartItems && remaining.cartItems.length > 0) {
//             console.warn("Draft still present after clear, attempting deleteTableDraft");
//             await deleteTableDraft(tableId.toString(), user.restaurantId);

//             // Wait again and verify after delete
//             await new Promise(resolve => setTimeout(resolve, 300));

//             try {
//               const stillRemaining = await getTableDraft(tableId.toString(), user.restaurantId);
//               if (stillRemaining && stillRemaining.cartItems && stillRemaining.cartItems.length > 0) {
//                 console.error("❌ Draft still exists after both clear and delete attempts");
//                 toast.error("Failed to clear draft. Please clear it manually from the table.");
//                 // Don't proceed with print if draft couldn't be cleared
//                 return;
//               }
//             } catch (finalVerifyErr) {
//               // If getTableDraft fails now, draft is cleared - that's good
//               console.log("Draft cleared after delete (getTableDraft failed - expected):", finalVerifyErr);
//             }
//           }

//           console.log("✅ Draft cleared successfully after save and print");
//           toast.success("Bill saved and draft cleared successfully!");
//         } catch (draftError) {
//           console.error("❌ Failed to clear draft after save and print:", draftError);
//           toast.error("Bill saved but failed to clear draft. Please clear it manually.");
//           // Don't proceed with print if draft clearing fails - ensure data consistency
//           return;
//         }
//       }

//       // Create print data with discounts and additional charges
//       // Only proceed if draft clearing was successful (or skipped if no user info)
//       const printData = {
//         billNumber,
//         tableName,
//         persons,
//         items: cart.map(item => ({
//           ...item,
//           discountAmount: item.discountAmount || 0
//         })),
//         additionalCharges: additionalPrice > 0 ? [{ id: Date.now(), name: "Additional Charges", amount: additionalPrice }] : [],
//         discountAmount: totalDiscount,
//         cgst: 0,
//         sgst: 0,
//         grandTotal: total,
//       };

//       // Call parent callback if provided - draft clearing is complete at this point
//       if (onSaveAndPrint) {
//         onSaveAndPrint(printData);
//       } else {
//         toast.error("Print functionality not available");
//       }
//     } catch (error) {
//       console.error("Error saving bill:", error);
//       // Error message already shown in persistBillHistory
//       // Don't proceed with print if save failed
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="border-b bg-card shadow-sm sticky top-0 z-40">
//         <div className="container mx-auto px-4 py-4" style={{ marginTop: '100px' }}>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <Button variant="ghost" size="icon" onClick={onBack}>
//                 <ArrowLeft className="h-5 w-5" />
//               </Button>
//               <div>
//                 <h1 className="text-2xl font-bold">Bill - {tableName}</h1>
//               </div>
//             </div>
//             <div className="flex items-center gap-2 sm:gap-4">
//               <div className="flex items-center gap-1 sm:gap-2">
//                 <Users className="h-4 w-4" />
//                 <Input
//                   type="number"
//                   min="1"
//                   value={persons}
//                   onChange={(e) => setPersons(parseInt(e.target.value) || 1)}
//                   className="w-16 sm:w-20 text-xs sm:text-sm"
//                 />
//               </div>
//               <Badge variant="secondary" className="gap-1 sm:gap-2 text-xs sm:text-sm">
//                 <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
//                 {cart.length} items
//               </Badge>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="container mx-auto px-4 py-6">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Bill Items */}
//           <div className="lg:col-span-2">
//             <Card className="p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-xl font-semibold">Bill Items</h2>
//                 <Button
//                   variant="outline"
//                   onClick={() => setShowAddItems(!showAddItems)}
//                 >
//                   <Plus className="h-4 w-4 mr-2" />
//                   {showAddItems ? "Hide Menu" : "Add Items"}
//                 </Button>
//               </div>

//               {/* Current Cart Items */}
//               <ScrollArea className="h-96">
//                 {cart.length === 0 ? (
//                   <div className="text-center py-8 text-muted-foreground">
//                     No items in bill
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {cart.map((item) => {
//                       const itemTotal = item.price * item.quantity;
//                       const itemDiscount = item.discountAmount || 0;
//                       const itemFinalAmount = itemTotal - itemDiscount;

//                       return (
//                         <div key={item.id} className="p-3 border rounded-lg space-y-2">
//                           <div className="flex items-center justify-between">
//                             <div className="flex-1">
//                               <h3 className="font-medium">{item.name}</h3>
//                               <p className="text-sm text-muted-foreground">₹{item.price} each × {item.quantity}</p>
//                               {(item.spicePercent || item.isJain) && (
//                                 <div className="flex items-center gap-2 mt-1">
//                                   {item.spicePercent && (
//                                     <span className="text-xs text-muted-foreground">Spice: {item.spicePercent}%</span>
//                                   )}
//                                   {item.isJain && (
//                                     <Badge variant="secondary" className="text-xs">Jain</Badge>
//                                   )}
//                                 </div>
//                               )}
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() => updateQuantity(item.id, -1)}
//                               >
//                                 <Minus className="h-4 w-4" />
//                               </Button>
//                               <span className="w-8 text-center">{item.quantity}</span>
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() => updateQuantity(item.id, 1)}
//                               >
//                                 <Plus className="h-4 w-4" />
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="destructive"
//                                 onClick={() => removeFromCart(item.id)}
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                               </Button>
//                             </div>
//                           </div>

//                           {/* Discount Input for Item */}
//                           <div className="flex items-center gap-2 pt-2 border-t">
//                             <label className="text-xs text-muted-foreground whitespace-nowrap">Discount (₹):</label>
//                             <Input
//                               type="number"
//                               min="0"
//                               max={itemTotal}
//                               step="0.01"
//                               value={itemDiscount || ""}
//                               onChange={(e) => {
//                                 const discount = parseFloat(e.target.value) || 0;
//                                 const maxDiscount = itemTotal;
//                                 updateItemDiscount(item.id, Math.min(discount, maxDiscount));
//                               }}
//                               placeholder="0"
//                               className="h-8 text-xs w-24"
//                             />
//                             <div className="text-sm text-gray-500">
//                               {item.note && <div>Note: {item.note}</div>}
//                               {item.spicePercent && (
//                                 <div>Spice: {item.spicePercent}%</div>
//                               )}
//                               {item.isJain && <div>Jain: Yes</div>}
//                               {item.discountAmount && item.discountAmount > 0 && (
//                                 <div className="text-green-600">
//                                   -₹{item.discountAmount.toFixed(2)} off
//                                 </div>
//                               )}
//                               {item.addedBy && (
//                                 <div className="text-xs text-gray-400 mt-1">
//                                   Added by: {item.addedBy.userName}
//                                 </div>
//                               )}
//                             </div>
//                             <div className="text-right flex-1">
//                               <div className="text-xs text-muted-foreground">
//                                 Subtotal: ₹{itemTotal.toFixed(2)}
//                               </div>
//                               {itemDiscount > 0 && (
//                                 <div className="text-xs text-red-600">
//                                   - ₹{itemDiscount.toFixed(2)}
//                                 </div>
//                               )}
//                               <div className="font-medium text-sm">
//                                 ₹{itemFinalAmount.toFixed(2)}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </ScrollArea>
//             </Card>

//             {/* Add Items Section */}
//             {showAddItems && (
//               <Card className="p-6 mt-6">
//                 <h3 className="text-lg font-semibold mb-4">Add More Items</h3>

//                 {/* Search and Category Filter */}
//                 <div className="flex gap-4 mb-4">
//                   <Input
//                     placeholder="Search items..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="flex-1"
//                   />
//                   <select
//                     value={activeCategory}
//                     onChange={(e) => setActiveCategory(e.target.value)}
//                     className="px-3 py-2 border rounded-md"
//                   >
//                     <option value="all">All Categories</option>
//                     {categories.map((category) => (
//                       <option key={category._id} value={category.name}>
//                         {category.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Menu Items */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   {filteredItems.map((item) => (
//                     <div key={item._id} className="flex items-center gap-3 p-3 border rounded-lg">
//                       <img
//                         src={item.image}
//                         alt={item.name}
//                         className="w-12 h-12 rounded-lg object-cover"
//                       />
//                       <div className="flex-1">
//                         <h4 className="font-medium">{item.name}</h4>
//                         <p className="text-sm text-muted-foreground">₹{item.price}</p>
//                       </div>
//                       <Button
//                         size="sm"
//                         onClick={() => addToCart(item)}
//                         disabled={!item.isAvailable}
//                       >
//                         <Plus className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             )}
//           </div>

//           {/* Bill Summary */}
//           <div className="lg:col-span-1">
//             <Card className="p-6 sticky top-24">
//               <h2 className="text-xl font-semibold mb-4">Bill Summary</h2>

//               <div className="space-y-4">
//                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                   <Clock className="h-4 w-4" />
//                   <span>Table: {tableName}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                     <Users className="h-4 w-4" />
//                     <span>Persons:</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => setPersons(Math.max(1, persons - 1))}
//                       className="h-7 w-7 p-0"
//                     >
//                       <Minus className="h-3 w-3" />
//                     </Button>
//                     <span className="w-8 text-center font-bold text-sm">{persons}</span>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => setPersons(persons + 1)}
//                       className="h-7 w-7 p-0"
//                     >
//                       <Plus className="h-3 w-3" />
//                     </Button>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2 my-6 border-t pt-4">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Subtotal:</span>
//                   <span>₹{subtotal.toFixed(2)}</span>
//                 </div>

//                 {/* Total Discount Input */}
//                 <div className="flex items-center justify-between gap-2 py-2 border-t">
//                   <label className="text-sm text-muted-foreground whitespace-nowrap">Total Discount (₹):</label>
//                   <Input
//                     type="number"
//                     min="0"
//                     max={subtotal}
//                     step="0.01"
//                     value={totalDiscount || ""}
//                     onChange={(e) => {
//                       const discount = parseFloat(e.target.value) || 0;
//                       const maxDiscount = subtotal;
//                       setTotalDiscount(Math.min(discount, maxDiscount));
//                     }}
//                     placeholder="0"
//                     className="h-8 text-sm w-32"
//                   />
//                 </div>

//                 {totalDiscount > 0 && (
//                   <div className="flex justify-between text-sm text-red-600">
//                     <span>Discount Applied:</span>
//                     <span>- ₹{totalDiscount.toFixed(2)}</span>
//                   </div>
//                 )}

//                 {/* Additional Price Input */}
//                 <div className="flex items-center justify-between gap-2 py-2 border-t">
//                   <label className="text-sm text-muted-foreground whitespace-nowrap">Additional Price (₹):</label>
//                   <Input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     value={additionalPrice || ""}
//                     onChange={(e) => {
//                       const price = parseFloat(e.target.value) || 0;
//                       setAdditionalPrice(Math.max(0, price));
//                     }}
//                     placeholder="0"
//                     className="h-8 text-sm w-32"
//                   />
//                 </div>

//                 {additionalPrice > 0 && (
//                   <div className="flex justify-between text-sm text-green-600">
//                     <span>Additional Charges:</span>
//                     <span>+ ₹{additionalPrice.toFixed(2)}</span>
//                   </div>
//                 )}

//                 <div className="flex justify-between font-bold text-lg border-t pt-2">
//                   <span>Grand Total:</span>
//                   <span>₹{total.toFixed(2)}</span>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Button
//                   onClick={handleSaveOnly}
//                   className="w-full"
//                   size="lg"
//                   disabled={cart.length === 0}
//                 >
//                   <Save className="h-5 w-5 mr-2" />
//                   {isEdit ? "Update Only" : "Save Only"}
//                 </Button>

//                 {isEdit ? (
//                   <Button
//                     onClick={handleUpdateAndPrint}
//                     variant="outline"
//                     className="w-full"
//                     disabled={cart.length === 0}
//                   >
//                     <Printer className="h-5 w-5 mr-2" />
//                     Update & Print
//                   </Button>
//                 ) : (
//                   <Button
//                     onClick={handleSaveAndPrint}
//                     variant="outline"
//                     className="w-full"
//                     disabled={cart.length === 0}
//                   >
//                     <Printer className="h-5 w-5 mr-2" />
//                     Save & Print
//                   </Button>
//                 )}
//               </div>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



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
import { clearTableDraft, getTableDraft, deleteTableDraft } from "../api/tableDraftApi";

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
  note?: string;
  spicePercent?: number;
  isJain?: boolean;
  discountAmount?: number; // Discount in ₹ for this item
  addedBy?: {
    userId: string;
    userName: string;
  };
}

interface BillPageProps {
  tableId: number;
  tableName: string;
  initialCart: CartItem[];
  initialPersons: number;
  initialTotalDiscount?: number; // Optional initial total discount
  initialAdditionalPrice?: number; // Optional initial additional price
  onBack: () => void;
  onSaveAndPrint?: (data: any) => void;
  isEdit?: boolean; // Whether this is an edit operation
  originalBillId?: string; // MongoDB ID of the bill being edited
  originalBillNumber?: string; // Original bill number to preserve
}

export function BillPage({
  tableId,
  tableName,
  initialCart,
  initialPersons,
  initialTotalDiscount = 0,
  initialAdditionalPrice = 0,
  onBack,
  onSaveAndPrint,
  isEdit = false,
  originalBillId,
  originalBillNumber
}: BillPageProps) {
  const user = getCurrentUser();
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [persons, setPersons] = useState(initialPersons);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [totalDiscount, setTotalDiscount] = useState(initialTotalDiscount); // Total discount in ₹
  const [additionalPrice, setAdditionalPrice] = useState(initialAdditionalPrice); // Additional charges/price in ₹
  const [isProcessing, setIsProcessing] = useState(false);

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

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item._id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item._id
            ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
              addedBy: user ? { userId: user.id, userName: user.name } : cartItem.addedBy
            }
            : cartItem
        );
      }
      return [
        ...prevCart,
        {
          id: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          addedBy: user ? { userId: user.id, userName: user.name } : undefined
        }
      ];
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

  // Update item discount
  const updateItemDiscount = (itemId: string, discount: number) => {
    setCart(prev => prev.map(cartItem =>
      cartItem.id === itemId
        ? { ...cartItem, discountAmount: Math.max(0, discount) }
        : cartItem
    ));
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(cartItem => cartItem.id !== itemId));
    toast.success("Item removed from cart");
  };

  // Calculate totals (with item discounts)
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = (item.price * item.quantity);
    const itemDiscount = item.discountAmount || 0;
    return sum + itemTotal - itemDiscount;
  }, 0);

  // Apply total discount and additional price
  const total = Math.max(0, subtotal - totalDiscount + additionalPrice);

  // Clear draft function
  const clearDraft = async (): Promise<boolean> => {
    if (!user?.restaurantId || !user?.username || !user?.id) {
      console.log("No user info available for draft clearing");
      return true; // Return true to continue even if no user info
    }

    try {
      console.log("Starting draft clearing process...");

      // First attempt: clear the draft (user-specific)
      await clearTableDraft(tableId.toString(), user.restaurantId, user.username, user.id);
      console.log("clearTableDraft called successfully");

      // Wait for server to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify draft is actually cleared
      let remaining: any = null;
      try {
        remaining = await getTableDraft(tableId.toString(), user.restaurantId);
        console.log("Draft verification result:", remaining);
      } catch (getErr) {
        // If getTableDraft fails (e.g., draft doesn't exist), that's good - draft is cleared
        console.log("getTableDraft failed (likely draft doesn't exist - this is good):", getErr);
      }

      // If draft still exists, try delete as fallback
      if (remaining && remaining.cartItems && remaining.cartItems.length > 0) {
        console.warn("Draft still present after clear, attempting deleteTableDraft");
        await deleteTableDraft(tableId.toString(), user.restaurantId);

        // Wait again and verify after delete
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          const stillRemaining = await getTableDraft(tableId.toString(), user.restaurantId);
          if (stillRemaining && stillRemaining.cartItems && stillRemaining.cartItems.length > 0) {
            console.error("❌ Draft still exists after both clear and delete attempts");
            toast.error("Failed to clear draft. Please clear it manually from the table.");
            return false;
          }
        } catch (finalVerifyErr) {
          // If getTableDraft fails now, draft is cleared - that's good
          console.log("Draft cleared after delete (getTableDraft failed - expected):", finalVerifyErr);
        }
      }

      console.log("✅ Draft cleared successfully");
      return true;
    } catch (draftError) {
      console.error("❌ Failed to clear draft:", draftError);
      toast.error("Failed to clear draft. Please clear it manually from the table.");
      return false;
    }
  };

  // Persist bill to API (database) - PRIMARY method
  const persistBillHistory = async (billNum?: string) => {
    if (!user?.restaurantId) {
      toast.error("User information missing. Cannot save bill.");
      throw new Error("User information missing");
    }

    // Use original bill number if editing, otherwise generate new one
    const billNumber = isEdit && originalBillNumber
      ? originalBillNumber
      : (billNum || `BILL-${Date.now()}`);

    const billRecord = {
      billNumber,
      tableId: tableId.toString(),
      tableName,
      persons,
      grandTotal: total,
      date: new Date().toISOString(),
      items: cart,
    };

    // Check if we have a token for API calls
    const token = localStorage.getItem("token");
    if (!token) {
      const errorMsg = "Not logged in to server. Please login again to save bills.";
      console.error(errorMsg);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // Calculate item discounts for API
      const itemsWithDiscounts = cart.map(item => ({
        ...item,
        discountAmount: item.discountAmount || 0
      }));

      const billData = {
        tableId: tableId.toString(),
        tableName,
        persons,
        items: itemsWithDiscounts,
        subtotal: subtotal,
        additionalCharges: additionalPrice > 0 ? [{ id: Date.now(), name: "Additional Charges", amount: additionalPrice }] : [],
        discountAmount: totalDiscount, // Total discount on bill
        grandTotal: total,
        restaurantId: user.restaurantId, // Explicitly pass restaurantId
        createdBy: user.username || 'staff'
      };

      if (isEdit && originalBillId) {
        // Update existing bill
        console.log("Attempting to update bill in API (database) with:", {
          billId: originalBillId,
          billNumber,
          restaurantId: user.restaurantId,
          username: user.username,
          itemsCount: cart.length,
          grandTotal: total
        });

        const updatedBill = await updateBill(originalBillId, billData);

        console.log("✅ Bill updated in database successfully:", updatedBill);

        // Update localStorage cache
        try {
          const key = getRestaurantKey("billHistory", user.restaurantId);
          const stored = localStorage.getItem(key);
          if (stored) {
            const history = JSON.parse(stored);
            const updated = history.map((bill: any) =>
              bill._id === originalBillId || bill.billNumber === billNumber
                ? { ...billRecord, _id: originalBillId }
                : bill
            );
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch (e) {
          console.warn("Failed to update bill in localStorage cache:", e);
        }

        toast.success("Bill updated successfully!");
        return billNumber;
      } else {
        // Create new bill
        console.log("Attempting to save bill to API (database) with:", {
          billNumber,
          restaurantId: user.restaurantId,
          username: user.username,
          itemsCount: cart.length,
          grandTotal: total
        });

        const savedBill = await createBill({
          ...billData,
          billNumber
        } as any);

        console.log("✅ Bill saved to database successfully:", savedBill);

        // Also save to localStorage as backup/cache
        try {
          const key = getRestaurantKey("billHistory", user.restaurantId);
          const stored = localStorage.getItem(key);
          const history = stored ? JSON.parse(stored) : [];
          const updated = [billRecord, ...history];
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to save bill to localStorage cache:", e);
        }

        toast.success("Bill saved to database successfully!");
        return billNumber;
      }
    } catch (error: any) {
      console.error(`❌ Failed to ${isEdit ? 'update' : 'save'} bill to API (database):`, error);

      // Extract error message from various possible locations
      let errorMessage = "Unknown error";
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error?.response?.data === 'string') {
        errorMessage = error.response.data;
      }

      console.error("Full error details:", {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        restaurantId: user?.restaurantId,
        username: user?.username,
        hasToken: !!token,
        tokenLength: token?.length,
        fullError: error
      });

      // Don't save to localStorage if API fails - we want to force database saves
      toast.error(`Failed to ${isEdit ? 'update' : 'save'} bill: ${errorMessage}. Please check your connection and try again.`);
      throw error; // Re-throw to prevent navigation
    }
  };

  // Save only
  const handleSaveOnly = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Save bill to database FIRST (this will throw if it fails)
      await persistBillHistory();

      // Clear the draft only after successful save
      const draftCleared = await clearDraft();
      
      if (draftCleared) {
        toast.success("Bill saved and draft cleared successfully!");
      } else {
        toast.success("Bill saved but draft clearing failed. Please clear it manually.");
      }

      // Navigate back only after successful save
      onBack();
    } catch (error) {
      console.error("Error saving bill:", error);
      // Error message already shown in persistBillHistory
      // Don't navigate - let user try again
    } finally {
      setIsProcessing(false);
    }
  };

  // Update and print bill (for edit operations)
  const handleUpdateAndPrint = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Use original bill number if editing
      const billNumber = originalBillNumber || `BILL-${Date.now()}`;

      // Update bill to database FIRST (this will throw if it fails)
      await persistBillHistory(billNumber);

      // Clear the draft after successful update
      const draftCleared = await clearDraft();

      if (draftCleared) {
        toast.success("Bill updated and draft cleared successfully!");
      } else {
        toast.success("Bill updated but draft clearing failed. Please clear it manually.");
      }

      // Create print data with discounts and additional charges
      const printData = {
        billNumber,
        tableName,
        persons,
        items: cart.map(item => ({
          ...item,
          discountAmount: item.discountAmount || 0
        })),
        additionalCharges: additionalPrice > 0 ? [{ id: Date.now(), name: "Additional Charges", amount: additionalPrice }] : [],
        discountAmount: totalDiscount,
        cgst: 0,
        sgst: 0,
        grandTotal: total,
        restaurantId: user?.restaurantId, // Add restaurantId for settings loading
        autoPrint: true, // Add autoPrint flag
        redirectAfterPrint: true // Add redirect flag
      };

      // Call parent callback if provided
      if (onSaveAndPrint) {
        onSaveAndPrint(printData);
      } else {
        toast.error("Print functionality not available");
      }
    } catch (error) {
      console.error("Error updating bill:", error);
      // Error message already shown in persistBillHistory
      // Don't proceed with print if update failed
    } finally {
      setIsProcessing(false);
    }
  };

  // Save and print bill (for new bills)
  const handleSaveAndPrint = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Generate new bill number
      const billNumber = `BILL-${Date.now()}`;

      // Save bill to database FIRST (this will throw if it fails)
      await persistBillHistory(billNumber);

      // Clear the draft after successful save
      const draftCleared = await clearDraft();

      if (draftCleared) {
        toast.success("Bill saved and draft cleared successfully!");
      } else {
        toast.success("Bill saved but draft clearing failed. Please clear it manually.");
      }

      // Create print data with discounts and additional charges
      const printData = {
        billNumber,
        tableName,
        persons,
        items: cart.map(item => ({
          ...item,
          discountAmount: item.discountAmount || 0
        })),
        additionalCharges: additionalPrice > 0 ? [{ id: Date.now(), name: "Additional Charges", amount: additionalPrice }] : [],
        discountAmount: totalDiscount,
        cgst: 0,
        sgst: 0,
        grandTotal: total,
        restaurantId: user?.restaurantId, // Add restaurantId for settings loading
        autoPrint: true, // Add autoPrint flag
        redirectAfterPrint: true // Add redirect flag
      };

      // Call parent callback if provided
      if (onSaveAndPrint) {
        onSaveAndPrint(printData);
        // Note: Navigation and auto-print happens in parent component
        // No need to call onBack() here as print component handles redirect
      } else {
        toast.error("Print functionality not available");
      }
    } catch (error) {
      console.error("Error saving bill:", error);
      // Error message already shown in persistBillHistory
      // Don't proceed with print if save failed
    } finally {
      setIsProcessing(false);
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
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="h-4 w-4" />
                <Input
                  type="number"
                  min="1"
                  value={persons}
                  onChange={(e) => setPersons(parseInt(e.target.value) || 1)}
                  className="w-16 sm:w-20 text-xs sm:text-sm"
                />
              </div>
              <Badge variant="secondary" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
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
                    {cart.map((item) => {
                      const itemTotal = item.price * item.quantity;
                      const itemDiscount = item.discountAmount || 0;
                      const itemFinalAmount = itemTotal - itemDiscount;

                      return (
                        <div key={item.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">₹{item.price} each × {item.quantity}</p>
                              {(item.spicePercent || item.isJain) && (
                                <div className="flex items-center gap-2 mt-1">
                                  {item.spicePercent && (
                                    <span className="text-xs text-muted-foreground">Spice: {item.spicePercent}%</span>
                                  )}
                                  {item.isJain && (
                                    <Badge variant="secondary" className="text-xs">Jain</Badge>
                                  )}
                                </div>
                              )}
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
                          </div>

                          {/* Discount Input for Item */}
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">Discount (₹):</label>
                            <Input
                              type="number"
                              min="0"
                              max={itemTotal}
                              step="0.01"
                              value={itemDiscount || ""}
                              onChange={(e) => {
                                const discount = parseFloat(e.target.value) || 0;
                                const maxDiscount = itemTotal;
                                updateItemDiscount(item.id, Math.min(discount, maxDiscount));
                              }}
                              placeholder="0"
                              className="h-8 text-xs w-24"
                            />
                            <div className="text-sm text-gray-500">
                              {item.note && <div>Note: {item.note}</div>}
                              {item.spicePercent && (
                                <div>Spice: {item.spicePercent}%</div>
                              )}
                              {item.isJain && <div>Jain: Yes</div>}
                              {item.discountAmount && item.discountAmount > 0 && (
                                <div className="text-green-600">
                                  -₹{item.discountAmount.toFixed(2)} off
                                </div>
                              )}
                              {item.addedBy && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Added by: {item.addedBy.userName}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-1">
                              <div className="text-xs text-muted-foreground">
                                Subtotal: ₹{itemTotal.toFixed(2)}
                              </div>
                              {itemDiscount > 0 && (
                                <div className="text-xs text-red-600">
                                  - ₹{itemDiscount.toFixed(2)}
                                </div>
                              )}
                              <div className="font-medium text-sm">
                                ₹{itemFinalAmount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Persons:</span>
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

              <div className="space-y-2 my-6 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {/* Total Discount Input */}
                <div className="flex items-center justify-between gap-2 py-2 border-t">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Total Discount (₹):</label>
                  <Input
                    type="number"
                    min="0"
                    max={subtotal}
                    step="0.01"
                    value={totalDiscount || ""}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      const maxDiscount = subtotal;
                      setTotalDiscount(Math.min(discount, maxDiscount));
                    }}
                    placeholder="0"
                    className="h-8 text-sm w-32"
                  />
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount Applied:</span>
                    <span>- ₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Additional Price Input */}
                <div className="flex items-center justify-between gap-2 py-2 border-t">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Additional Price (₹):</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={additionalPrice || ""}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      setAdditionalPrice(Math.max(0, price));
                    }}
                    placeholder="0"
                    className="h-8 text-sm w-32"
                  />
                </div>

                {additionalPrice > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Additional Charges:</span>
                    <span>+ ₹{additionalPrice.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleSaveOnly}
                  className="w-full"
                  size="lg"
                  disabled={cart.length === 0 || isProcessing}
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isProcessing ? "Processing..." : (isEdit ? "Update Only" : "Save Only")}
                </Button>

                {isEdit ? (
                  <Button
                    onClick={handleUpdateAndPrint}
                    variant="outline"
                    className="w-full"
                    disabled={cart.length === 0 || isProcessing}
                  >
                    <Printer className="h-5 w-5 mr-2" />
                    {isProcessing ? "Processing..." : "Update & Print"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveAndPrint}
                    variant="outline"
                    className="w-full"
                    disabled={cart.length === 0 || isProcessing}
                  >
                    <Printer className="h-5 w-5 mr-2" />
                    {isProcessing ? "Processing..." : "Save & Print"}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}