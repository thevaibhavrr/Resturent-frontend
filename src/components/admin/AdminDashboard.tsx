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
  CreditCard,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  CalendarIcon,
} from "lucide-react";
import { Loader } from "../ui/loader";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { getRestaurantSubscription, Subscription } from "../../api/planApi";
import { getBillStats } from "../../api/billApi";
import { toast } from "sonner";

// Utility function for class names
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export function AdminDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
  });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isPlanExpanded, setIsPlanExpanded] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, selectedDate]);

  const loadStats = async () => {
    if (!user) return;

    setLoadingStats(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === 'custom' && selectedDate) {
        const fromDate = new Date(selectedDate);
        fromDate.setHours(0, 0, 0, 0);
        startDate = fromDate.toISOString();
        
        const toDate = new Date(selectedDate);
        toDate.setHours(23, 59, 59, 999);
        endDate = toDate.toISOString();
      } else if (dateFilter === 'all') {
        startDate = undefined;
        endDate = undefined;
      } else {
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
            break;
        }
      }

      const billStats = await getBillStats({ startDate, endDate });

      setStats({
        totalOrders: billStats.totalOrders,
        totalRevenue: billStats.totalRevenue,
        totalDiscount: billStats.totalDiscount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      const historyKey = getRestaurantKey("billHistory", user.restaurantId);
      const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
      
      let filteredHistory = history;
      if (dateFilter !== 'all') {
        filteredHistory = history.filter((bill: any) => {
          if (!bill.createdAt) return false;
          
          const billDate = new Date(bill.createdAt);
          const compareDate = dateFilter === 'custom' && selectedDate ? 
            new Date(selectedDate) : new Date();
          
          if (dateFilter === 'today' || dateFilter === 'custom') {
            return billDate.toDateString() === compareDate.toDateString();
          } else if (dateFilter === 'weekly') {
            const weekAgo = new Date(compareDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            return billDate >= weekAgo && billDate <= compareDate;
          } else if (dateFilter === 'monthly') {
            const monthStart = new Date(compareDate.getFullYear(), compareDate.getMonth(), 1);
            return billDate >= monthStart && billDate <= compareDate;
          } else if (dateFilter === 'yearly') {
            const yearStart = new Date(compareDate.getFullYear(), 0, 1);
            return billDate >= yearStart && billDate <= compareDate;
          }
          return true;
        });
      }
      
      const totalRevenue = filteredHistory.reduce(
        (sum: number, bill: any) => sum + (bill.grandTotal || 0),
        0
      );

      const totalDiscount = filteredHistory.reduce(
        (sum: number, bill: any) => sum + (bill.discountAmount || 0),
        0
      );

      setStats({
        totalOrders: filteredHistory.length,
        totalRevenue,
        totalDiscount,
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

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value ? new Date(event.target.value) : undefined;
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getFilterDisplayText = () => {
    if (dateFilter === 'custom' && selectedDate) {
      return formatDate(selectedDate);
    }
    return dateFilter === "today" ? "Today" :
           dateFilter === "weekly" ? "This week" :
           dateFilter === "monthly" ? "This month" :
           dateFilter === "yearly" ? "This year" : "All time";
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

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
        <div className="flex items-center space-x-2">
          <Select 
            value={dateFilter} 
            onValueChange={(value: string) => {
              setDateFilter(value);
              setShowDatePicker(false);
              if (value !== 'custom') {
                setSelectedDate(new Date());
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="yearly">This Year</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          {dateFilter === 'custom' && (
            <div className="relative date-picker-container">
              <Button
                variant={"outline"}
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  formatDate(selectedDate)
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
              
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
                  <input
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={handleDateChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowDatePicker(false);
                      }
                    }}
                  />
                  <div className="flex justify-between gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 h-8 text-xs font-medium text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(new Date());
                        setShowDatePicker(false);
                      }}
                      className="flex-1 h-8 text-xs font-medium text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
                    >
                      Today
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadStats()}
            disabled={loadingStats}
          >
            <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <h3 className="text-2xl font-bold">{loadingStats ? <Loader className="h-6 w-6" /> : stats.totalOrders}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <h3 className="text-2xl font-bold">
                {loadingStats ? (
                  <Loader className="h-6 w-6" />
                ) : (
                  `₹${stats.totalRevenue.toLocaleString('en-IN')}`
                )}
              </h3>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Discount</p>
              <h3 className="text-2xl font-bold">
                {loadingStats ? (
                  <Loader className="h-6 w-6" />
                ) : (
                  `-₹${stats.totalDiscount.toLocaleString('en-IN')}`
                )}
              </h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-600">
                <path d="M8 3v4a2 2 0 0 1-2 2H2"></path>
                <path d="M21 12.5v-2a4.83 4.83 0 0 0-1.7-3.68A5.14 5.14 0 0 0 16 5.15 4.9 4.9 0 0 0 12 7a4.9 4.9 0 0 0-4-1.85 5.14 5.14 0 0 0-3.3 1.67A4.83 4.83 0 0 0 3 10.5v2a4.83 4.83 0 0 0 1.7 3.68A5.14 5.14 0 0 0 8 18.85 4.9 4.9 0 0 0 12 17a4.9 4.9 0 0 0 4 1.85 5.14 5.14 0 0 0 3.3-1.67A4.83 4.83 0 0 0 21 12.5z"></path>
                <path d="M12 17v5"></path>
                <path d="M8 22h8"></path>
              </svg>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}