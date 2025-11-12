import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  TableProperties,
  UtensilsCrossed,
  Calendar,
  AlertCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Loader } from "../ui/loader";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { getRestaurantSubscription, Subscription } from "../../api/planApi";
import { toast } from "sonner";

export function AdminDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTables: 0,
    occupiedTables: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalMenuItems: 0,
    totalStaff: 0,
  });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isPlanExpanded, setIsPlanExpanded] = useState(false);
  const [dateFilter, setDateFilter] = useState("today"); // Default to today

  useEffect(() => {
    loadSubscription();
  }, []);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]); // Reload stats when date filter changes

  const loadStats = async () => {
    if (!user) return;

    setLoadingStats(true);
    try {
      // Calculate date range based on filter
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case "today":
          startDate = today.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "weekly":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "monthly":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate = monthStart.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "yearly":
          const yearStart = new Date(now.getFullYear(), 0, 1);
          startDate = yearStart.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        default:
          // All time - no date filter
          break;
      }
      
      // Load bill stats from API with date filter
      const { getBillStats } = await import("../../api/billApi");
      const billStats = await getBillStats({ startDate, endDate });

      // Load tables from API
      const { getAllTables } = await import("../../api/tableApi");
      const tables = await getAllTables(user.restaurantId);
      const occupied = tables.filter((t: any) => t.status === "occupied" || t.status === "active").length;

      // Load menu items from API
      const { getMenuItems } = await import("../../api/menuApi");
      const menuItems = await getMenuItems(user.restaurantId);

      // Load staff from API
      const { makeApi } = await import("../../api/makeapi");
      const staffResponse = await makeApi(`/api/staff/restaurant/${user.restaurantId}`, "GET");
      const staff = staffResponse.data || [];

      setStats({
        totalTables: tables.length,
        occupiedTables: occupied,
        totalOrders: billStats.totalOrders,
        totalRevenue: billStats.totalRevenue,
        totalMenuItems: menuItems.length,
        totalStaff: staff.length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      // Fallback to localStorage if API fails
    const tablesKey = getRestaurantKey("tables", user.restaurantId);
    const tables = JSON.parse(localStorage.getItem(tablesKey) || "[]");
    const occupied = tables.filter((t: any) => t.status === "occupied").length;

    const menuKey = getRestaurantKey("menuItems", user.restaurantId);
    const menuItems = JSON.parse(localStorage.getItem(menuKey) || "[]");

    const historyKey = getRestaurantKey("billHistory", user.restaurantId);
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    const totalRevenue = history.reduce(
      (sum: number, bill: any) => sum + bill.grandTotal,
      0
    );

    const staffUsers = JSON.parse(localStorage.getItem("staff_users") || "[]");
    const restaurantStaff = staffUsers.filter(
      (s: any) => s.restaurantId === user.restaurantId
    );

    setStats({
      totalTables: tables.length,
      occupiedTables: occupied,
      totalOrders: history.length,
      totalRevenue,
      totalMenuItems: menuItems.length,
      totalStaff: restaurantStaff.length,
    });
    } finally {
      setLoadingStats(false);
    }
  };

  const loadSubscription = async () => {
    if (!user?.restaurantId) return;
    
    try {
      setLoadingSubscription(true);
      const data = await getRestaurantSubscription(user.restaurantId);
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setLoadingSubscription(false);
    }
  };

  if (loadingStats) {
    return <Loader text="Loading dashboard statistics..." />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header with Date Filter and Refresh Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Restaurant overview and statistics</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={loadStats} 
            variant="outline" 
            size="sm"
            disabled={loadingStats}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Subscription Status Card */}
      {!loadingSubscription && subscription && (
        <Card className={`shadow-md md:shadow-xl border-2 transition-all ${
          subscription.daysRemaining <= 3 ? 'border-red-500 bg-red-50' :
          subscription.daysRemaining <= 7 ? 'border-yellow-500 bg-yellow-50' :
          'border-green-500 bg-green-50'
        }`}>
          {/* Clickable Header - Always Visible */}
          <div 
            className="p-3 sm:p-4 md:p-6 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsPlanExpanded(!isPlanExpanded)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CreditCard className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 ${
                  subscription.daysRemaining <= 3 ? 'text-red-600' :
                  subscription.daysRemaining <= 7 ? 'text-yellow-600' :
                  'text-green-600'
                }`} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold truncate">{subscription.planName}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm text-muted-foreground">Current Plan</p>
                    <span className="text-muted-foreground">•</span>
                    <p className={`text-xs sm:text-sm font-semibold ${
                      subscription.daysRemaining <= 3 ? 'text-red-600' :
                      subscription.daysRemaining <= 7 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{subscription.daysRemaining} days remaining</p>
                    <Badge 
                      variant={subscription.isActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {subscription.isActive ? "Active" : "Expired"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {isPlanExpanded ? (
                  <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Expandable Content */}
          <AnimatePresence>
            {isPlanExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-4 sm:px-4 sm:pb-5 md:px-6 md:pb-8 pt-0">
                  <div className="border-t pt-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
              
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-white rounded-lg border border-gray-200">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground mb-0.5">Days Remaining</p>
                          <p className={`text-xl sm:text-2xl font-bold leading-tight ${
                            subscription.daysRemaining <= 3 ? 'text-red-600' :
                            subscription.daysRemaining <= 7 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>{subscription.daysRemaining}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center p-3 sm:p-3.5 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-muted-foreground mb-0.5">Start Date</p>
                        <p className="text-sm font-semibold leading-tight">
                          {new Date(subscription.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col justify-center p-3 sm:p-3.5 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-muted-foreground mb-0.5">End Date</p>
                        <p className="text-sm font-semibold leading-tight">
                          {new Date(subscription.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {subscription.daysRemaining <= 7 && subscription.isActive && (
                      <div className="flex items-start gap-2.5 p-3 sm:p-3.5 bg-white rounded-lg border border-yellow-300">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-semibold text-yellow-900">Plan Expiring Soon!</p>
                          <p className="text-xs sm:text-sm text-yellow-800 mt-0.5">
                            Your plan will expire in {subscription.daysRemaining} days. Please recharge to continue using all features.
                          </p>
                        </div>
                      </div>
                    )}

                    {!subscription.isActive && (
                      <div className="flex items-start gap-2.5 p-3 sm:p-3.5 bg-white rounded-lg border border-red-300">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-semibold text-red-900">Plan Expired!</p>
                          <p className="text-xs sm:text-sm text-red-800 mt-0.5">
                            Your plan has expired. Please recharge immediately to restore access.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {subscription.daysRemaining <= 15 && (
                    <Button 
                      size="default"
                      className="w-full sm:w-auto md:ml-4 shrink-0"
                      variant={subscription.daysRemaining <= 7 ? "destructive" : "default"}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        navigate('/admin/plans');
                      }}
                    >
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">Upgrade / Recharge</span>
                    </Button>
                  )}
                </div>
              </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Total Tables */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Tables</p>
            <TableProperties className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">{stats.totalTables}</p>
            <p className="text-xs text-muted-foreground">
              {stats.occupiedTables} occupied
            </p>
          </div>
        </Card>

        {/* Total Orders */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <ShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">
              {dateFilter === "today" ? "Today" :
               dateFilter === "weekly" ? "This week" :
               dateFilter === "monthly" ? "This month" :
               dateFilter === "yearly" ? "This year" : "All time"}
            </p>
          </div>
        </Card>

        {/* Total Revenue */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">₹{stats.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {dateFilter === "today" ? "Today" :
               dateFilter === "weekly" ? "This week" :
               dateFilter === "monthly" ? "This month" :
               dateFilter === "yearly" ? "This year" : "All time"}
            </p>
          </div>
        </Card>

        {/* Menu Items */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Menu Items</p>
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">{stats.totalMenuItems}</p>
            <p className="text-xs text-muted-foreground">Active items</p>
          </div>
        </Card>

        {/* Staff Members */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Staff Members</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">{stats.totalStaff}</p>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </div>
        </Card>

        {/* Table Occupancy */}
  <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Occupancy Rate</p>
            <TrendingUp className="w-5 h-5 text-pink-600" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl">
              {stats.totalTables > 0
                ? Math.round((stats.occupiedTables / stats.totalTables) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground">Current occupancy</p>
          </div>
        </Card>
      </div>

  {/* Quick Actions */}
  <Card className="p-6 shadow-lg">
        <h2 className="text-xl mb-4 font-bold">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div 
            onClick={() => navigate('/admin/tables')}
            className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white hover:bg-primary/5"
          >
            <TableProperties className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium">Manage Tables</p>
            <p className="text-xs text-muted-foreground">View & add tables</p>
          </div>
          <div 
            onClick={() => navigate('/admin/users')}
            className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white hover:bg-primary/5"
          >
            <Users className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium">Manage Staff</p>
            <p className="text-xs text-muted-foreground">View & add staff</p>
          </div>
          <div 
            onClick={() => navigate('/admin/menu')}
            className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white hover:bg-primary/5"
          >
            <UtensilsCrossed className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium">Manage Menu</p>
            <p className="text-xs text-muted-foreground">View & add items</p>
          </div>
          <div 
            onClick={() => navigate('/admin/bills')}
            className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white hover:bg-primary/5"
          >
            <ShoppingCart className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium">Bill History</p>
            <p className="text-xs text-muted-foreground">View all bills</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
