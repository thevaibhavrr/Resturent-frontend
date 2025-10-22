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

interface BillHistoryItem {
  billNumber: string;
  tableId: number;
  tableName: string;
  persons: number;
  grandTotal: number;
  date: string;
  items: Array<{ id: number; name: string; price: number; quantity: number }>;
}

export function Reports() {
  const user = getCurrentUser();
  const [period, setPeriod] = useState("today");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    totalItems: 0,
    peakHour: "N/A",
    topItem: "N/A",
    topTable: "N/A",
  });

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = () => {
    if (!user) return;

    const key = getRestaurantKey("billHistory", user.restaurantId);
    const stored = localStorage.getItem(key);
    if (!stored) return;

    const allHistory: BillHistoryItem[] = JSON.parse(stored);
    const filteredHistory = getFilteredHistory(allHistory);

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

    setStats({
      totalRevenue,
      totalOrders,
      averageOrder,
      totalItems,
      peakHour: getPeakHour(filteredHistory),
      topItem: getTopItem(filteredHistory),
      topTable: getTopTable(filteredHistory),
    });
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

  const getRevenueByCategory = () => {
    if (!user) return [];

    const historyKey = getRestaurantKey("billHistory", user.restaurantId);
    const menuKey = getRestaurantKey("menuItems", user.restaurantId);

    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    const menuItems = JSON.parse(localStorage.getItem(menuKey) || "[]");
    const filteredHistory = getFilteredHistory(history);

    const categoryRevenue: { [key: string]: number } = {};

    filteredHistory.forEach((bill: BillHistoryItem) => {
      bill.items.forEach((item) => {
        const menuItem = menuItems.find((m: any) => m.id === item.id);
        if (menuItem) {
          const category = menuItem.category;
          categoryRevenue[category] =
            (categoryRevenue[category] || 0) + item.price * item.quantity;
        }
      });
    });

    return Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const categoryData = getRevenueByCategory();

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
        <Select value={period} onValueChange={setPeriod}>
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
    </div>
  );
}
