import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Award,
} from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { toast } from "sonner";

interface BillHistoryItem {
  billNumber: string;
  tableId: number;
  tableName: string;
  persons: number;
  grandTotal: number;
  date: string;
  items: Array<{ id: number | string; name: string; price: number; quantity: number }>;
}

export function Reports() {
  const user = getCurrentUser();
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    totalItems: 0,
    peakHour: "N/A",
    topItem: "N/A",
    topTable: "N/A",
  });
  const [topSellingItems, setTopSellingItems] = useState<Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>>([]);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadReports = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate date range based on period
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
        case "today":
          startDate = today.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "month":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate = monthStart.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "year":
          const yearStart = new Date(now.getFullYear(), 0, 1);
          startDate = yearStart.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        default:
          // All time - no date filter
          break;
      }

      // Load bills from API
      const { getBills } = await import("../../api/billApi");
      const response = await getBills({ 
        limit: 10000,
        startDate: startDate,
        endDate: endDate
      });
      
      // Transform API response to match component interface
      const allHistory: BillHistoryItem[] = response.bills.map((bill: any) => ({
        billNumber: bill.billNumber,
        tableId: parseInt(bill.tableId) || 0,
        tableName: bill.tableName,
        persons: bill.persons,
        grandTotal: bill.grandTotal,
        date: bill.createdAt,
        items: bill.items.map((item: any) => ({
          id: item.itemId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      }));

      const filteredHistory = allHistory;

      // Calculate stats
      const totalRevenue = filteredHistory.reduce(
        (sum, bill) => sum + bill.grandTotal,
        0
      );
      const totalOrders = filteredHistory.length;
      const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalItems = filteredHistory.reduce(
        (sum, bill) =>
          sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      );

      // Calculate top 5 selling items
      const itemStats: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
      filteredHistory.forEach((bill) => {
        bill.items.forEach((item) => {
          if (!itemStats[item.name]) {
            itemStats[item.name] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
            };
          }
          itemStats[item.name].quantity += item.quantity;
          itemStats[item.name].revenue += item.price * item.quantity;
        });
      });

      const topItems = Object.values(itemStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setTopSellingItems(topItems);

      setStats({
        totalRevenue,
        totalOrders,
        averageOrder,
        totalItems,
        peakHour: getPeakHour(filteredHistory),
        topItem: getTopItem(filteredHistory),
        topTable: getTopTable(filteredHistory),
      });
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports data");
      
      // Fallback to localStorage
      const key = getRestaurantKey("billHistory", user.restaurantId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const allHistory: BillHistoryItem[] = JSON.parse(stored);
        const filteredHistory = getFilteredHistory(allHistory);
        
        const totalRevenue = filteredHistory.reduce(
          (sum, bill) => sum + bill.grandTotal,
          0
        );
        const totalOrders = filteredHistory.length;
        const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalItems = filteredHistory.reduce(
          (sum, bill) =>
            sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
          0
        );

        // Calculate top 5 selling items for fallback
        const itemStats: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
        filteredHistory.forEach((bill) => {
          bill.items.forEach((item) => {
            if (!itemStats[item.name]) {
              itemStats[item.name] = {
                name: item.name,
                quantity: 0,
                revenue: 0,
              };
            }
            itemStats[item.name].quantity += item.quantity;
            itemStats[item.name].revenue += item.price * item.quantity;
          });
        });

        const topItems = Object.values(itemStats)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        setTopSellingItems(topItems);

        setStats({
          totalRevenue,
          totalOrders,
          averageOrder,
          totalItems,
          peakHour: getPeakHour(filteredHistory),
          topItem: getTopItem(filteredHistory),
          topTable: getTopTable(filteredHistory),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = (history: BillHistoryItem[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    return history.filter((bill) => {
      const billDate = new Date(bill.date);
      switch (period) {
        case "today":
          return billDate >= today;
        case "week":
          return billDate >= thisWeek;
        case "month":
          return billDate >= thisMonth;
        case "year":
          return billDate >= thisYear;
        default:
          return true;
      }
    });
  };

  const getPeakHour = (bills: BillHistoryItem[]): string => {
    if (bills.length === 0) return "N/A";

    const hourCounts: { [key: number]: number } = {};
    bills.forEach((bill) => {
      const hour = new Date(bill.date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    return `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`;
  };

  const getTopItem = (bills: BillHistoryItem[]): string => {
    if (bills.length === 0) return "N/A";

    const itemCounts: { [key: string]: number } = {};
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    if (Object.keys(itemCounts).length === 0) return "N/A";

    return Object.entries(itemCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  };

  const getTopTable = (bills: BillHistoryItem[]): string => {
    if (bills.length === 0) return "N/A";

    const tableCounts: { [key: string]: number } = {};
    bills.forEach((bill) => {
      tableCounts[bill.tableName] = (tableCounts[bill.tableName] || 0) + 1;
    });

    return Object.entries(tableCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
  };

  const getRevenueByCategory = async () => {
    if (!user) return [];

    try {
      // Load bills from API
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
        case "today":
          startDate = today.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "month":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate = monthStart.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "year":
          const yearStart = new Date(now.getFullYear(), 0, 1);
          startDate = yearStart.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        default:
          break;
      }

      const { getBills } = await import("../../api/billApi");
      const { getMenuItems } = await import("../../api/menuApi");
      
      const [billsResponse, menuItems] = await Promise.all([
        getBills({ limit: 10000, startDate, endDate }),
        getMenuItems(user.restaurantId)
      ]);

      const history: BillHistoryItem[] = billsResponse.bills.map((bill: any) => ({
        billNumber: bill.billNumber,
        tableId: parseInt(bill.tableId) || 0,
        tableName: bill.tableName,
        persons: bill.persons,
        grandTotal: bill.grandTotal,
        date: bill.createdAt,
        items: bill.items.map((item: any) => ({
          id: item.itemId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      }));
      
      const filteredHistory = history;

      const categoryRevenue: { [key: string]: number } = {};

      filteredHistory.forEach((bill: BillHistoryItem) => {
        bill.items.forEach((item) => {
          // Try to find menu item by id or _id
          const menuItem = menuItems.find((m: any) => 
            m.id === item.id || 
            m._id === item.id || 
            m._id?.toString() === item.id?.toString()
          );
          if (menuItem) {
            // Handle category - could be string, object with name, or categoryId reference
            let category = "Uncategorized";
            if (typeof menuItem.category === 'string') {
              category = menuItem.category;
            } else if (menuItem.categoryId) {
              if (typeof menuItem.categoryId === 'string') {
                category = menuItem.categoryId;
              } else if (menuItem.categoryId.name) {
                category = menuItem.categoryId.name;
              }
            }
            categoryRevenue[category] =
              (categoryRevenue[category] || 0) + item.price * item.quantity;
          } else {
            // If menu item not found, use "Uncategorized"
            categoryRevenue["Uncategorized"] =
              (categoryRevenue["Uncategorized"] || 0) + item.price * item.quantity;
          }
        });
      });

      return Object.entries(categoryRevenue)
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error("Error loading category revenue:", error);
      // Fallback to localStorage
      const historyKey = getRestaurantKey("billHistory", user.restaurantId);
      const menuKey = getRestaurantKey("menuItems", user.restaurantId);

      const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
      const menuItems = JSON.parse(localStorage.getItem(menuKey) || "[]");
      const filteredHistory = getFilteredHistory(history);

      const categoryRevenue: { [key: string]: number } = {};

      filteredHistory.forEach((bill: BillHistoryItem) => {
        bill.items.forEach((item) => {
          // Try to find menu item by id or _id
          const menuItem = menuItems.find((m: any) => 
            m.id === item.id || 
            m._id === item.id || 
            m._id?.toString() === item.id?.toString()
          );
          if (menuItem) {
            // Handle category - could be string, object with name, or categoryId reference
            let category = "Uncategorized";
            if (typeof menuItem.category === 'string') {
              category = menuItem.category;
            } else if (menuItem.categoryId) {
              if (typeof menuItem.categoryId === 'string') {
                category = menuItem.categoryId;
              } else if (menuItem.categoryId.name) {
                category = menuItem.categoryId.name;
              }
            }
            categoryRevenue[category] =
              (categoryRevenue[category] || 0) + item.price * item.quantity;
          } else {
            // If menu item not found, use "Uncategorized"
            categoryRevenue["Uncategorized"] =
              (categoryRevenue["Uncategorized"] || 0) + item.price * item.quantity;
          }
        });
      });

      return Object.entries(categoryRevenue)
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue);
    }
  };

  const [categoryData, setCategoryData] = useState<Array<{ category: string; revenue: number }>>([]);

  useEffect(() => {
    const loadCategoryData = async () => {
      const data = await getRevenueByCategory();
      setCategoryData(data);
    };
    loadCategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            View detailed business insights and trends
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      )}

      {!loading && (
        <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl mb-1">₹{stats.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            {stats.totalOrders} orders
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Average Order</p>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl mb-1">₹{stats.averageOrder.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Per order</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Items Sold</p>
            <ShoppingCart className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl mb-1">{stats.totalItems}</p>
          <p className="text-xs text-muted-foreground">Total items</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl mb-1">{stats.totalOrders}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Peak Hour</h3>
          </div>
          <p className="text-2xl mb-1">{stats.peakHour}</p>
          <p className="text-sm text-muted-foreground">Busiest time</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Top Selling Item</h3>
          </div>
          <p className="text-2xl mb-1">{stats.topItem}</p>
          <p className="text-sm text-muted-foreground">Most ordered</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Top Table</h3>
          </div>
          <p className="text-2xl mb-1">{stats.topTable}</p>
          <p className="text-sm text-muted-foreground">Most orders</p>
        </Card>
      </div>

      {/* Top 5 Selling Items */}
      <Card className="p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Top 5 Selling Items
        </h2>
        {topSellingItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No items sold in this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topSellingItems.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.quantity === 1 ? 'item' : 'items'} sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">
                    ₹{item.revenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Revenue by Category */}
      <Card className="p-6">
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Revenue by Category
        </h2>
        {categoryData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data available for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryData.map((item) => {
              const percentage =
                (item.revenue / stats.totalRevenue) * 100 || 0;
              return (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="capitalize">
                      {item.category.replace(/-/g, " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                      <span className="font-semibold">
                        ₹{item.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
        </>
      )}
    </div>
  );
}
