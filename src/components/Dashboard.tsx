import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Calendar,
  Users,
} from "lucide-react";

interface BillHistoryItem {
  billNumber: string;
  tableId: number;
  tableName: string;
  persons: number;
  grandTotal: number;
  date: string;
  items: Array<{ id: number; name: string; price: number; quantity: number }>;
}

export function Dashboard() {
  const [todayBills, setTodayBills] = useState<BillHistoryItem[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    averageOrder: 0,
    totalItems: 0,
  });

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = () => {
    const stored = localStorage.getItem("billHistory");
    if (stored) {
      const allBills: BillHistoryItem[] = JSON.parse(stored);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter bills from today
      const todaysBills = allBills.filter((bill) => {
        const billDate = new Date(bill.date);
        billDate.setHours(0, 0, 0, 0);
        return billDate.getTime() === today.getTime();
      });

      setTodayBills(todaysBills);

      // Calculate stats
      const totalAmount = todaysBills.reduce(
        (sum, bill) => sum + bill.grandTotal,
        0
      );
      const totalItems = todaysBills.reduce(
        (sum, bill) =>
          sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      );
      const averageOrder =
        todaysBills.length > 0 ? totalAmount / todaysBills.length : 0;

      setStats({
        totalOrders: todaysBills.length,
        totalAmount,
        averageOrder,
        totalItems,
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl">Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="w-4 h-4" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl">{stats.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Today's orders</p>
            </div>
          </Card>

          {/* Total Amount */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl">₹{stats.totalAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Revenue today</p>
            </div>
          </Card>

          {/* Average Order */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Average Order</p>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl">₹{stats.averageOrder.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Per order</p>
            </div>
          </Card>

          {/* Total Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Items Sold</p>
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl">{stats.totalItems}</p>
              <p className="text-xs text-muted-foreground">Total items</p>
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Today's Orders</h2>
            <Badge variant="secondary">{todayBills.length} orders</Badge>
          </div>

          {todayBills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders today yet</p>
              <p className="text-sm mt-1">Orders will appear here as they come in</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {todayBills.map((bill) => (
                  <Card key={bill.billNumber} className="p-4 border-2">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">
                            Bill #{bill.billNumber.slice(-8)}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {bill.tableName}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(bill.date)}</span>
                          <span>•</span>
                          <Users className="w-3 h-3" />
                          <span>{bill.persons} persons</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl text-primary">
                          ₹{bill.grandTotal.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bill.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                          items
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t pt-3 space-y-1">
                      {bill.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.name}
                          </span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* Summary Section */}
        {todayBills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Peak Hour</p>
              <p className="text-xl">
                {getPeakHour(todayBills)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Most Popular Item</p>
              <p className="text-xl">
                {getMostPopularItem(todayBills)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Highest Bill</p>
              <p className="text-xl">
                ₹{Math.max(...todayBills.map((b) => b.grandTotal)).toFixed(2)}
              </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper function to find peak hour
function getPeakHour(bills: BillHistoryItem[]): string {
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
}

// Helper function to find most popular item
function getMostPopularItem(bills: BillHistoryItem[]): string {
  if (bills.length === 0) return "N/A";

  const itemCounts: { [key: string]: number } = {};
  bills.forEach((bill) => {
    bill.items.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });

  if (Object.keys(itemCounts).length === 0) return "N/A";

  return Object.entries(itemCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}
