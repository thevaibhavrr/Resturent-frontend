import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { NewtonsCradleLoader } from "./ui/newtons-cradle-loader";
import { PrintKotPopup } from "./PrintKotPopup";
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
  ArrowUp,
  Save
} from "lucide-react";
import { getCurrentUser } from "../utils/auth";
import { toast } from "sonner";
import { getMenuItems, getCategories } from "../api/menuApi";
import { getTableById } from "../api/tableApi";
import { saveTableDraft, getTableDraft, clearTableDraft, markKotsAsPrinted, TableDraft } from "../api/tableDraftApi";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, useSpring } from "framer-motion";

interface MenuItem {
  _id: string;
  name: string;
  image?: string;
  price: number;
  basePrice?: number;
  cost?: number;
  spiceLevel: number;
  categoryId: {
    _id: string;
    name: string;
    description?: string;
    restaurantId: string;
    status: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  category?: string;
  description?: string;
  isAvailable: boolean;
  isVeg?: boolean;
  preparationTime?: number;
  displayOrder?: number;
  restaurantId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  spacePrices?: Array<{
    spaceId: string;
    spaceName: string;
    price: number;
  }>;
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
  updatedBy?: string;
  addedBy: {
    userId: string;
    userName: string;
  };
  lastUpdatedBy: {
    userId: string;
    userName: string;
    timestamp: string;
  };
}

interface KotEntry {
  kotId: string;
  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number; // Positive for added, negative for removed
  }[];
  timestamp: string;
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

// Utility function to generate KOT differences
const generateKotDifferences = (
  currentCart: CartItem[],
  lastKotSnapshot: CartItem[] | null
): { itemId: string; name: string; price: number; quantity: number }[] => {
  const currentQuantities = new Map<string, { name: string; price: number; quantity: number }>();
  const lastQuantities = new Map<string, { name: string; price: number; quantity: number }>();

  // Build current cart quantities map
  currentCart.forEach(item => {
    currentQuantities.set(item.id, {
      name: item.name,
      price: item.price,
      quantity: item.quantity
    });
  });

  // Build last KOT snapshot quantities map
  if (lastKotSnapshot) {
    lastKotSnapshot.forEach(item => {
      lastQuantities.set(item.id, {
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
    });
  }

  const differences: { itemId: string; name: string; price: number; quantity: number }[] = [];

  // Find all unique item IDs from both current and last
  const allItemIds = new Set([...currentQuantities.keys(), ...lastQuantities.keys()]);

  allItemIds.forEach(itemId => {
    const current = currentQuantities.get(itemId);
    const last = lastQuantities.get(itemId);

    const currentQty = current?.quantity || 0;
    const lastQty = last?.quantity || 0;
    const difference = currentQty - lastQty;

    // Only include items that have changed
    if (difference !== 0) {
      // Use current item data if available, otherwise last item data
      const itemData = current || last!;
      differences.push({
        itemId,
        name: itemData.name,
        price: itemData.price,
        quantity: difference // Positive = added, Negative = removed
      });
    }
  });

  return differences;
};

// Generate unique KOT ID
const generateKotId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `KOT-${timestamp}-${random}`;
};

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
  const [currentTableSpace, setCurrentTableSpace] = useState<{ _id: string; name: string } | null>(null);

  // Get the correct price for the current space
  const getItemPrice = (item: MenuItem): number => {
    if (!currentTableSpace) {
      // No space information, use basePrice or regular price
      return item.basePrice || item.price;
    }

    // Look for space-specific price
    const spacePrice = item.spacePrices?.find(sp => sp.spaceId === currentTableSpace._id);
    if (spacePrice) {
      return spacePrice.price;
    }

    // Fall back to basePrice or regular price
    return item.basePrice || item.price;
  };
  const [selectedSpicePercent, setSelectedSpicePercent] = useState<Record<string, number>>({}); // per-menu-item (1-100)
  const [selectedIsJain, setSelectedIsJain] = useState<Record<string, boolean>>({}); // per-menu-item
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastKotSnapshot, setLastKotSnapshot] = useState<CartItem[] | null>(null); // Last saved cart state for KOT comparison
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showKotModal, setShowKotModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<{ unprintedKots: any[]; kotIds: string[] } | null>(null);
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

  // Get cached menu data from localStorage with 5-minute expiration
  const getCachedMenuData = () => {
    if (!user?.restaurantId) return null;

    const cacheKey = `menuCache_${user.restaurantId}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;

      // Check if cache is still valid (less than 5 minutes old)
      if (now - timestamp < fiveMinutesInMs) {
        return data;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (error) {
      console.error('Error parsing cached menu data:', error);
      localStorage.removeItem(cacheKey);
      return null;
    }
  };

  // Save menu data to localStorage with timestamp
  const cacheMenuData = (categoriesData: Category[], menuItemsData: MenuItem[]) => {
    if (!user?.restaurantId) return;

    const cacheKey = `menuCache_${user.restaurantId}`;
    const cacheData = {
      data: {
        categories: categoriesData,
        menuItems: menuItemsData
      },
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching menu data:', error);
    }
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
      setInitialLoadComplete(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, try to get cached menu data
      const cachedData = getCachedMenuData();

      if (cachedData) {
        // Use cached data immediately for faster loading
        setCategories(cachedData.categories);
        setMenuItems(cachedData.menuItems);

        // Load table information for space pricing
        const tableData = await getTableById(tableId.toString());
        if (tableData && tableData.locationId) {
          setCurrentTableSpace({
            _id: tableData.locationId._id,
            name: tableData.locationId.name
          });
        }

        // Still load table draft in parallel (user-specific)
        const draftData = await getTableDraft(tableId.toString(), user.restaurantId, user.username);
        console.log("Loaded draft data (cached path):", draftData);

        // Load existing draft if available
        if (draftData) {
          setTableDraft(draftData);
          setPersons(draftData.persons);

          // Restore cart items and quantities
          const restoredCart: CartItem[] = [];
          const restoredQuantities: Record<string, number> = {};

          draftData.cartItems.forEach((item: any) => {
            // For backward compatibility, if addedBy is not present, use the draft's updatedBy
            const addedBy = (item as any).addedBy
              ? {
                userId: (item as any).addedBy.userId || 'system',
                userName: (item as any).addedBy.userName || 'System'
              }
              : {
                userId: draftData.updatedBy || 'system',
                userName: draftData.updatedBy || 'System'
              };

            // For backward compatibility, if lastUpdatedBy is not present, use the draft's updatedBy
            const lastUpdated = (item as any).lastUpdatedBy
              ? {
                userId: (item as any).lastUpdatedBy.userId || draftData.updatedBy || 'system',
                userName: (item as any).lastUpdatedBy.userName || draftData.updatedBy || 'System',
                timestamp: (item as any).lastUpdatedBy.timestamp || new Date().toISOString()
              }
              : {
                userId: draftData.updatedBy || 'system',
                userName: draftData.updatedBy || 'System',
                timestamp: new Date().toISOString()
              };

            // Create the cart item with all the information
            const cartItem: CartItem = {
              id: item.itemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              note: (item as any).note || "",
              spiceLevel: (item as any).spiceLevel ?? 0,
              spicePercent: (item as any).spicePercent ?? 50,
              isJain: (item as any).isJain ?? false,
              updatedBy: (item as any).updatedBy || draftData.updatedBy || 'System',
              addedBy: addedBy,
              lastUpdatedBy: lastUpdated
            };

            restoredCart.push(cartItem);
            restoredQuantities[item.itemId] = item.quantity;
          });

          setCart(restoredCart);
          setItemQuantities(restoredQuantities);

          // Set last KOT snapshot to the loaded cart for future comparisons
          setLastKotSnapshot(restoredCart);

          toast.success("Table draft loaded successfully");
        }

        setLoading(false);
        setInitialLoadComplete(true);

        // Check if cache is close to expiration (within 30 seconds)
        const cacheKey = `menuCache_${user.restaurantId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { timestamp } = JSON.parse(cached);
            const now = Date.now();
            const fiveMinutesInMs = 5 * 60 * 1000;
            const timeUntilExpiration = fiveMinutesInMs - (now - timestamp);

            // If cache will expire within 30 seconds, refresh it in background
            if (timeUntilExpiration < 30000) {
              setTimeout(() => {
                refreshMenuData();
              }, 1000);
            }
          } catch (error) {
            console.error('Error checking cache expiration:', error);
          }
        }

        return;
      }

      // If no cached data, fetch fresh data
      const [categoriesData, menuItemsData, tableData, draftData] = await Promise.all([
        getCategories(user.restaurantId),
        getMenuItems(user.restaurantId),
        getTableById(tableId.toString()),
        getTableDraft(tableId.toString(), user.restaurantId, user.username)
      ]);

      setCategories(categoriesData);
      setMenuItems(menuItemsData);

      // Set current table space for price calculation
      if (tableData && tableData.locationId) {
        setCurrentTableSpace({
          _id: tableData.locationId._id,
          name: tableData.locationId.name
        });
      }

      // Cache the fresh data
      cacheMenuData(categoriesData, menuItemsData);

      // Load existing draft if available
      if (draftData) {
        setTableDraft(draftData);
        setPersons(draftData.persons);

        // Restore cart items and quantities
        const restoredCart: CartItem[] = [];
        const restoredQuantities: Record<string, number> = {};

        draftData.cartItems.forEach((item: any) => {
          // For backward compatibility, if addedBy is not present, use the draft's updatedBy
          const addedBy = (item as any).addedBy
            ? {
              userId: (item as any).addedBy.userId || 'system',
              userName: (item as any).addedBy.userName || 'System'
            }
            : {
              userId: draftData.updatedBy || 'system',
              userName: draftData.updatedBy || 'System'
            };

          // For backward compatibility, if lastUpdatedBy is not present, use the draft's updatedBy
          const lastUpdated = (item as any).lastUpdatedBy
            ? {
              userId: (item as any).lastUpdatedBy.userId || draftData.updatedBy || 'system',
              userName: (item as any).lastUpdatedBy.userName || draftData.updatedBy || 'System',
              timestamp: (item as any).lastUpdatedBy.timestamp || new Date().toISOString()
            }
            : {
              userId: draftData.updatedBy || 'system',
              userName: draftData.updatedBy || 'System',
              timestamp: new Date().toISOString()
            };

          // Create the cart item with all the information
          const cartItem: CartItem = {
            id: item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            note: (item as any).note || "",
            spiceLevel: (item as any).spiceLevel ?? 0,
            spicePercent: (item as any).spicePercent ?? 50,
            isJain: (item as any).isJain ?? false,
            updatedBy: (item as any).updatedBy || draftData.updatedBy || 'System',
            addedBy: addedBy,
            lastUpdatedBy: lastUpdated
          };

          restoredCart.push(cartItem);
          restoredQuantities[item.itemId] = item.quantity;
        });

        setCart(restoredCart);
        setItemQuantities(restoredQuantities);

        // Set last KOT snapshot to the loaded cart for future comparisons
        setLastKotSnapshot(restoredCart);

        toast.success("Table draft loaded successfully");
      }

      setInitialLoadComplete(true);
    } catch (err) {
      console.error("Error loading menu data:", err);
      setError("Failed to load menu data");
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh menu data (called when cache expires or on interval)
  const refreshMenuData = async () => {
    if (!user?.restaurantId) return;

    try {
      const [categoriesData, menuItemsData] = await Promise.all([
        getCategories(user.restaurantId),
        getMenuItems(user.restaurantId)
      ]);

      setCategories(categoriesData);
      setMenuItems(menuItemsData);

      // Cache the fresh data
      cacheMenuData(categoriesData, menuItemsData);

      console.log(`Menu data refreshed at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("Error refreshing menu data:", error);
    }
  };

  // Load menu data on component mount and set up auto-refresh
  useEffect(() => {
    // Initial load
    loadMenuData();

    // Set up auto-refresh every 5 minutes (300,000 ms)
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing menu data...');
      refreshMenuData();
    }, 5 * 60 * 1000);

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
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

  // Manual save functionality - no auto-save
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Track unsaved changes
  useEffect(() => {
    if (initialLoadComplete && cart.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [cart, persons, initialLoadComplete]);

  // Manual save draft function
  const handleSaveDraft = async () => {
    if (!user?.restaurantId || !user?.username || !user?.id) {
      toast.error("User information not available");
      return;
    }

    try {
      setSaving(true);
      console.log("💾 Manual save draft initiated");
      await autoSaveDraft(cart, persons);
      setLastSaved(new Date().toLocaleTimeString());
      setHasUnsavedChanges(false);
      toast.success(cart.length === 0 ? "Empty draft saved successfully!" : "Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  // Filter menu items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

    // If searching, ignore category filter and search from all products
    if (searchQuery.trim() !== "") {
      return matchesSearch;
    }

    // If not searching, apply category filter
    let matchesCategory = true;
    if (activeCategory === "recent") {
      const recentItems = getRecentItems();
      matchesCategory = recentItems.includes(item._id);
    } else if (activeCategory !== "all") {
      matchesCategory = item.categoryId?.name === activeCategory;
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

  // Auto-save draft function with automatic KOT generation
  const autoSaveDraft = async (cartItems: CartItem[], personsCount: number) => {
    console.log("autoSaveDraft called with:", {
      cartItemsCount: cartItems.length,
      personsCount,
      restaurantId: user?.restaurantId,
      username: user?.username,
      userId: user?.id
    });

    if (!user?.restaurantId || !user?.username || !user?.id) {
      console.log("autoSaveDraft: Missing required user data, skipping");
      return;
    }

    try {
      setSaving(true);

      // Generate KOT differences if cart has changed
      const kotDifferences = generateKotDifferences(cartItems, lastKotSnapshot);
      let newKotEntry: KotEntry | null = null;

      // If there are differences, create a new KOT entry
      if (kotDifferences.length > 0) {
        newKotEntry = {
          kotId: generateKotId(),
          items: kotDifferences,
          timestamp: new Date().toISOString()
        };
        console.log("Generated new KOT:", newKotEntry);
      }

      // Get current kotHistory - use existing or empty array
      const currentKotHistory = tableDraft?.kotHistory || [];

      // Prepare draft data
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
          isJain: item.isJain ?? false,
          // Include staff information with each cart item
          addedBy: item.addedBy || {
            userId: user.id,
            userName: user.name || user.username
          },
          lastUpdatedBy: {
            userId: user.id,
            userName: user.name || user.username,
            timestamp: new Date().toISOString()
          },
          updatedBy: user.name || user.username
        })),
        updatedBy: user.name || user.username,
        userId: user.id, // Add userId to the root of the draft data
        // Include KOT history - append new KOT if generated
        kotHistory: newKotEntry ? [...currentKotHistory, newKotEntry] : currentKotHistory
      };


      const savedDraft = await saveTableDraft({
        ...draftData,
        userId: user.id, // Make sure userId is included in the request
        updatedBy: user.name || user.username
      });

      // Update local state
      setTableDraft(savedDraft);

      // Update last KOT snapshot to current cart for next comparison
      if (newKotEntry) {
        setLastKotSnapshot([...cartItems]);
        console.log("Updated last KOT snapshot with current cart");
      }

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
    if (!user) {
      toast.error("Please log in to update cart");
      return;
    }

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
      const currentTime = new Date().toISOString();
      const userInfo = {
        userId: user.id,
        userName: user.name || user.username,
        timestamp: currentTime
      };

      if (newQuantity === 0) {
        return prev.filter(cartItem => cartItem.id !== itemId);
      }

      const existingItem = prev.find(cartItem => cartItem.id === itemId);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? {
              ...cartItem,
              quantity: newQuantity,
              lastUpdatedBy: userInfo,
              updatedBy: user.name || user.username
            }
            : cartItem
        );
      } else {
        // Get spice percent from state or default
        const percent = selectedSpicePercent[item._id] ?? 50;
        const level = Math.min(5, Math.max(1, Math.round(percent / 20)));
        const isJain = selectedIsJain[item._id] ?? false;

        // Save to recent items
        saveToRecentItems(item._id);

        const newItem: CartItem = {
          id: item._id,
          name: item.name,
          price: getItemPrice(item),
          quantity: newQuantity,
          spicePercent: percent,
          isJain: isJain,
          addedBy: {
            userId: user.id,
            userName: user.name || user.username
          },
          lastUpdatedBy: userInfo,
          updatedBy: user.name || user.username
        };

        return [...prev, newItem];
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
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }
    updateItemQuantity(item._id, 1);
    toast.success(`${item.name} added to cart`);
  };

  // Update cart item quantity
  const updateQuantity = (itemId: string, change: number) => {
    if (!user) {
      toast.error("Please log in to update cart");
      return;
    }

    setCart(prev => {
      const item = prev.find(cartItem => cartItem.id === itemId);
      if (!item) return prev;

      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        return prev.filter(cartItem => cartItem.id !== itemId);
      }

      return prev.map(cartItem =>
        cartItem.id === itemId
          ? {
            ...cartItem,
            quantity: newQuantity,
            lastUpdatedBy: {
              userId: user.id,
              userName: user.name || user.username,
              timestamp: new Date().toISOString()
            }
          }
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
    if (!user?.restaurantId || !user?.username || !user?.id) return;

    try {
      await clearTableDraft(tableId.toString(), user.restaurantId, user.username, user.id);
      setCart([]);
      setPersons(1);
      setItemQuantities({});
      setTableDraft(null);
      setLastKotSnapshot(null); // Reset KOT snapshot when clearing draft
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

    // Navigate to appropriate route based on user role
    const billRoute = user?.role === "admin" ? "/admin/order-tables/bill" : "/order-tables/bill";
    navigate(billRoute, { state: billData });
  };

  // Print draft (compact) directly from menu - only prints unprinted KOTs
  // Now shows a modal instead of redirecting
  const handlePrintDraft = async () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }
    if (persons < 1) {
      toast.error("Please enter number of persons");
      return;
    }

    try {
      // Get unprinted KOTs from the current draft
      const unprintedKots = tableDraft?.kotHistory?.filter(kot => !kot.printed) || [];

      if (unprintedKots.length === 0) {
        toast.error("No new changes to print. All KOTs have been printed already.");
        return;
      }

      // Get KOT IDs
      const kotIds = unprintedKots.map(kot => kot.kotId);

      // Store print data in state and show modal
      setPrintData({ unprintedKots, kotIds });
      setShowPrintModal(true);

    } catch (error) {
      console.error("Error preparing KOTs for print:", error);
      toast.error("Failed to prepare KOTs for printing");
    }
  };


  // Print full draft (all items, not just unprinted KOTs)
  const handlePrintFullDraft = () => {
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
      unprintedKots: [], // Empty array to indicate full draft printing
      allKots: tableDraft?.kotHistory || [], // Send all KOTs for reference
      cart: cart, // Send full cart for legacy support
      persons: persons,
    };

    toast.success("Printing full draft...");

    // Navigate to appropriate route based on user role
    const printRoute = user?.role === "admin" ? "/admin/order-tables/print-draft" : "/order-tables/print-draft";
    navigate(printRoute, { state: draftData });
  };

  // View all KOTs in modal
  const handleViewKots = () => {
    setShowKotModal(true);
  };

  // Print a specific KOT again
  const handlePrintKotAgain = async (kot: KotEntry) => {
    const draftData = {
      table: {
        id: tableId,
        tableName: tableName,
      },
      unprintedKots: [kot], // Print only this specific KOT
      allKots: tableDraft?.kotHistory || [],
      persons: persons,
    };

    toast.success(`Re-printing KOT ${kot.kotId}...`);

    const printRoute = user?.role === "admin" ? "/admin/order-tables/print-draft" : "/order-tables/print-draft";
    navigate(printRoute, { state: draftData });
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
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Table Menu
                  {lastSaved && (
                    <span className="ml-2 text-green-600 font-medium">
                      • Saved at {lastSaved}
                    </span>
                  )}
                </p>
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
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
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

              {/* Save Draft Button */}
              <Button
                onClick={handleSaveDraft}
                disabled={saving}
                className={`${hasUnsavedChanges
                  ? 'bg-orange-600 hover:bg-orange-700 animate-pulse'
                  : 'bg-green-600 hover:bg-green-700'
                  } text-white gap-2 font-semibold shadow-lg hover:shadow-xl transition-all bg-black`}
                size="sm"
                title={hasUnsavedChanges ? "You have unsaved changes" : "Save draft"}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {saving ? "Saving..." : "Save Draft"}
                </span>
                <span className="sm:hidden ">
                  {saving ? "..." : "Save"}
                </span>
              </Button>
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

            {/* Categories - Hide when searching */}
            {searchQuery.trim() === "" && (
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
                      size="lg"
                      onClick={() => setActiveCategory(category.name)}
                      className="gap-2"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <NewtonsCradleLoader size={60} speed={1.2} color="#030213" className="mb-4" />
                <p className="text-muted-foreground text-sm">Loading menu items...</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
                        className={`overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full ${getItemQuantity(item._id) > 0
                            ? 'ring-2 ring-primary shadow-lg'
                            : 'hover:scale-[1.02]'
                          }`}
                      >
                        <div className="relative">
                          <div className="relative h-32 sm:h-40 max-h-48 w-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">

                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            {getItemQuantity(item._id) > 0 && (
                              <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg animate-pulse">
                                {getItemQuantity(item._id)}
                              </div>
                            )}
                            <div className="absolute bottom-3 left-3">
                              <Badge variant="secondary" className="text-xs shadow-md backdrop-blur-sm bg-white/90">
                                {item.categoryId?.name.replace("-", " ")}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3 sm:p-4 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-2 sm:mb-3">
                              <h3 className="font-bold text-base sm:text-xl line-clamp-2 flex-1 pr-2">{item.name}</h3>
                              <span className="font-bold text-base sm:text-xl text-primary shrink-0">₹{getItemPrice(item)}</span>
                            </div>
                            {/* Spice level option */}
                            <div className="mb-3 sm:mb-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  🌶️ Spice
                                </label>
                                <Select
                                  value={String(currentSpicePercent)}
                                  onValueChange={(v) => setSpicePercent(item._id, parseInt(v))}
                                >
                                  <SelectTrigger className="h-8 sm:h-9 border-2 hover:border-primary/50 transition-colors text-xs sm:text-sm w-full">
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
                            </div>
                            {/* Quantity Controls */}
                            {getItemQuantity(item._id) > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between w-full bg-primary/5 rounded-lg p-1.5 sm:p-2">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateItemQuantity(item._id, -1)}
                                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                      <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <span className="min-w-[1.5rem] sm:min-w-[2rem] text-center font-bold text-base sm:text-lg">
                                      {getItemQuantity(item._id)}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateItemQuantity(item._id, 1)}
                                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                      disabled={!item.isAvailable}
                                    >
                                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateItemQuantity(item._id, -getItemQuantity(item._id))}
                                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>

                              </div>
                            ) : (
                              <Button
                                onClick={() => updateItemQuantity(item._id, 1)}
                                className="w-full h-9 sm:h-10 font-semibold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
                                disabled={!item.isAvailable}
                              >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">{item.isAvailable ? "Add to Cart" : "Not Available"}</span>
                                <span className="sm:hidden">{item.isAvailable ? "Add" : "N/A"}</span>
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
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Order Summary
                    </h3>
                    {lastSaved && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Last saved: {lastSaved}
                      </p>
                    )}
                    {hasUnsavedChanges && cart.length > 0 && (
                      <p className="text-xs text-orange-600 font-medium mt-1 animate-pulse">
                        ⚠️ Unsaved changes
                      </p>
                    )}
                  </div>
                  <div>
                    <Button
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className={`${hasUnsavedChanges
                        ? 'bg-orange-600 hover:bg-orange-700 animate-pulse'
                        : 'bg-green-600 hover:bg-green-700'
                        } text-white gap-2 font-semibold shadow-lg hover:shadow-xl transition-all bg-black`}
                      size="sm"
                      title={hasUnsavedChanges ? "You have unsaved changes" : "Save draft"}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {saving ? "Saving..." : "Save Draft"}
                      </span>
                      <span className="sm:hidden ">
                        {saving ? "..." : "Save"}
                      </span>
                    </Button>
                  </div>
                </div>


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
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-base">{item.name}</p>
                                    <div className="text-xs text-muted-foreground text-right">
                                      <div>Added by: {item.addedBy.userName}</div>
                                      {/* {item.lastUpdatedBy && item.lastUpdatedBy.userId !== item.addedBy.userId && (
                                        <div>Updated by: {item.lastUpdatedBy.userName}</div>
                                      )} */}
                                      {/* {item.lastUpdatedBy && (
                                        <div className="text-xxs opacity-70">
                                          {new Date(item.lastUpdatedBy.timestamp).toLocaleString()}
                                        </div>
                                      )} */}
                                    </div>
                                  </div>
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
                      {/* Save Draft Button */}
                      <Button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className={`w-full h-10 ${hasUnsavedChanges
                          ? 'bg-orange-600 hover:bg-orange-700 animate-pulse'
                          : 'bg-green-600 hover:bg-green-700'
                          } text-white font-semibold shadow-md hover:shadow-lg transition-all`}
                        size="default"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? "Saving..." : "Save Draft"}
                      </Button>

                      <Button
                        onClick={handleGoToBill}
                        className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Go to Bill
                      </Button>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={handlePrintDraft}
                            className="h-10"
                            variant="outline"
                            size="default"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            <span className="text-xs">Print KOT</span>
                          </Button>
                          <Button
                            onClick={handlePrintFullDraft}
                            className="h-10"
                            variant="secondary"
                            size="default"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            <span className="text-xs">Print Full</span>
                          </Button>
                        </div>
                        {tableDraft?.kotHistory && tableDraft.kotHistory.length > 0 && (
                          <Button
                            onClick={handleViewKots}
                            className="h-10 w-full"
                            style={{ backgroundColor: "skyblue", color: "black", marginTop: "40px" }}  
                            variant="ghost"
                            size="default"
                          >
                            <span className="text-xs">View All KOTs ({tableDraft.kotHistory.length})</span>
                          </Button>
                        )}
                      </div>
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
          style={{ zIndex: 1000, backgroundColor: "white", color: "black", position: "fixed", bottom: "6px", right: "6px" }}

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
          style={{ zIndex: 1000, backgroundColor: "white", color: "black", position: "fixed", bottom: "6px", right: "6px" }}

        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

      {/* Print KOT Modal - Direct Print Without Navigation */}
      {showPrintModal && printData && (
          <PrintKotPopup
          tableName={tableName}
          persons={persons}
          printData={printData}
          onClose={() => {
            setShowPrintModal(false);
            setPrintData(null);
          }}
          tableId={tableId}
          user={user}
        />
      )}

      {/* KOT History Modal */}
      {showKotModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Kitchen Order Tickets (KOTs) - {tableName}
                </h2>
                <button
                  onClick={() => setShowKotModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {tableDraft?.kotHistory && tableDraft.kotHistory.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-2">
                {(tableDraft?.kotHistory || [])
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((kot, index) => (
                    <AccordionItem key={kot.kotId} value={kot.kotId} className="border rounded-lg">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center gap-3">
                            <Badge variant={kot.printed ? "default" : "secondary"} className="text-xs">
                              {kot.printed ? "✅ Printed" : "⏳ Pending"}
                            </Badge>
                            <span className="font-medium">KOT #{(tableDraft?.kotHistory?.length || 0) - index}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(kot.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {kot.items.length} item{kot.items.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {/* KOT Items */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium mb-2 text-sm">Order Items:</h4>
                            <div className="space-y-2">
                              {kot.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium px-2 py-1 rounded text-xs ${
                                      item.quantity > 0 ? 'bg-green-100 text-green-800' :
                                      item.quantity < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {item.quantity > 0 ? '+' : ''}{item.quantity}
                                    </span>
                                    <span>{item.name}</span>
                                  </div>
                                  <span className="text-muted-foreground">₹{item.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Print Again Button */}
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handlePrintKotAgain(kot)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Printer className="h-4 w-4" />
                              Print Again
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No KOTs found for this table</p>
                <p className="text-sm">Save your draft to generate KOTs</p>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
