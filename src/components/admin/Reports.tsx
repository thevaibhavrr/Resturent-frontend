import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { makeApi } from "../../api/makeapi";
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
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Award,
} from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { getBills } from "../../api/billApi";
import { getMenuItems } from "../../api/menuApi";

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
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [specificDate, setSpecificDate] = useState('');
  const [specificMonth, setSpecificMonth] = useState('');
  const [specificYear, setSpecificYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    totalItems: 0,
    peakHour: "N/A",
    topItem: "N/A",
    topTable: "N/A",
    totalExtraIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
  });
  const [topSellingItems, setTopSellingItems] = useState<Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>>([]);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customDateRange, specificDate, specificMonth, specificYear]);

  const loadReports = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate date range based on period
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (period === 'specific-date' && specificDate) {
        // Specific date
        const selectedDate = new Date(specificDate);
        startDate = selectedDate.toISOString();
        endDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      } else if (period === 'specific-month' && specificMonth) {
        // Specific month
        const [year, month] = specificMonth.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0); // Last day of the month
        startDate = monthStart.toISOString();
        endDate = new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      } else if (period === 'specific-year' && specificYear) {
        // Specific year
        const year = parseInt(specificYear);
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        startDate = yearStart.toISOString();
        endDate = new Date(yearEnd.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      } else if (period === 'custom' && customDateRange.start && customDateRange.end) {
        // Use custom date range
        startDate = new Date(customDateRange.start).toISOString();
        endDate = new Date(new Date(customDateRange.end).setHours(23, 59, 59, 999)).toISOString();
      } else {
        // Use predefined periods
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
      }

      // Load bills first, then try to load expenses and extra income
      const billsResponse = await getBills({
        limit: 10000,
        startDate: startDate,
        endDate: endDate
      });

      // Try to load expenses and extra income with error handling
      let expenses = [];
      let extraIncomes = [];

      try {
        const expensesQueryParams = new URLSearchParams({
          restaurantId: user.restaurantId,
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        });

        const expensesResponse = await makeApi(`/api/expenses?${expensesQueryParams.toString()}`);
        expenses = expensesResponse.data || [];
      } catch (error) {
        console.warn('Could not load expenses data:', error);
        expenses = [];
      }

      try {
        const queryParams = new URLSearchParams({
          restaurantId: user.restaurantId,
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        });

        const extraIncomeResponse = await makeApi(`/api/extra-income?${queryParams.toString()}`);

        extraIncomes = extraIncomeResponse.data;
      } catch (error) {
        console.warn('Could not load extra income data:', error);
        extraIncomes = [];
      }

      // Transform API responses
      const allHistory: BillHistoryItem[] = billsResponse.bills.map((bill: any) => ({
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

      // Calculate total expenses and extra income for the period
      const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
      const totalExtraIncome = extraIncomes.reduce((sum: number, income: any) => sum + income.amount, 0);
      const netIncome = totalRevenue + totalExtraIncome - totalExpenses;

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
        totalExtraIncome,
        totalExpenses,
        netIncome,
      });
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports data");

      // Fallback to localStorage or empty arrays for new features
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

        // Fallback for expenses and extra income from localStorage
        const expensesKey = getRestaurantKey('expenses', user.restaurantId);
        const extraIncomeKey = getRestaurantKey('extraIncomes', user.restaurantId);
        const storedExpenses = JSON.parse(localStorage.getItem(expensesKey) || '[]');
        const storedExtraIncomes = JSON.parse(localStorage.getItem(extraIncomeKey) || '[]');

        const totalExpenses = storedExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
        const totalExtraIncome = storedExtraIncomes.reduce((sum: number, income: any) => sum + income.amount, 0);
        const netIncome = totalRevenue + totalExtraIncome - totalExpenses;

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
          totalExtraIncome,
          totalExpenses,
          netIncome,
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
      // Load bills from API with same date range logic as main loadReports
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (period === 'specific-date' && specificDate) {
        const selectedDate = new Date(specificDate);
        startDate = selectedDate.toISOString();
        endDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      } else if (period === 'specific-month' && specificMonth) {
        const [year, month] = specificMonth.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);
        startDate = monthStart.toISOString();
        endDate = new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      } else if (period === 'specific-year' && specificYear) {
        const year = parseInt(specificYear);
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        startDate = yearStart.toISOString();
        endDate = new Date(yearEnd.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      } else if (period === 'custom' && customDateRange.start && customDateRange.end) {
        startDate = new Date(customDateRange.start).toISOString();
        endDate = new Date(new Date(customDateRange.end).setHours(23, 59, 59, 999)).toISOString();
      } else {
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
      }

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
  }, [period, customDateRange, specificDate, specificMonth, specificYear]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 w-full">
        <div className="flex flex-col space-y-4 w-full">
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-semibold">Reports</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <div className="w-full sm:w-auto">
              <Select
                value={period}
                onValueChange={(value: string) => {
                  setPeriod(value);
                  setShowCustomDateRange(false);
                  // Reset specific filters when changing period
                  if (value !== 'specific-date') setSpecificDate('');
                  if (value !== 'specific-month') setSpecificMonth('');
                  if (value !== 'specific-year') setSpecificYear('');
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="specific-date">Specific Date</SelectItem>
                  <SelectItem value="specific-month">Specific Month</SelectItem>
                  <SelectItem value="specific-year">Specific Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCustomDateRange(!showCustomDateRange)}
              disabled={!['custom', 'specific-date', 'specific-month', 'specific-year'].includes(period)}
              className={`w-full sm:w-auto justify-center ${['custom', 'specific-date', 'specific-month', 'specific-year'].includes(period) ? 'bg-primary/10' : ''}`}
            >
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {period === 'specific-date' && specificDate
                  ? new Date(specificDate).toLocaleDateString()
                  : period === 'specific-month' && specificMonth
                    ? new Date(specificMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : period === 'specific-year' && specificYear
                      ? specificYear
                      : period === 'custom' && customDateRange.start && customDateRange.end
                        ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}`
                        : 'Select Period'}
              </span>
            </Button>
          </div>
        </div>

        {showCustomDateRange && (
          <div className="p-4 bg-muted/20 rounded-md">
            {period === 'specific-date' && (
              <div className="max-w-xs">
                <label htmlFor="specific-date" className="block text-sm font-medium text-muted-foreground mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  id="specific-date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {period === 'specific-month' && (
              <div className="max-w-xs">
                <label htmlFor="specific-month" className="block text-sm font-medium text-muted-foreground mb-1">
                  Select Month
                </label>
                <input
                  type="month"
                  id="specific-month"
                  value={specificMonth}
                  onChange={(e) => setSpecificMonth(e.target.value)}
                  max={new Date().toISOString().slice(0, 7)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {period === 'specific-year' && (
              <div className="max-w-xs">
                <label htmlFor="specific-year" className="block text-sm font-medium text-muted-foreground mb-1">
                  Select Year
                </label>
                <input
                  type="number"
                  id="specific-year"
                  value={specificYear}
                  onChange={(e) => setSpecificYear(e.target.value)}
                  min="2020"
                  max={new Date().getFullYear().toString()}
                  placeholder="2024"
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {period === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <label htmlFor="start-date" className="block text-sm font-medium text-muted-foreground mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={customDateRange.start}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setCustomDateRange(prev => ({
                        ...prev,
                        start: newDate,
                        end: prev.end && new Date(newDate) > new Date(prev.end) ? newDate : prev.end
                      }));
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="end-date" className="block text-sm font-medium text-muted-foreground mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    value={customDateRange.end}
                    min={customDateRange.start || new Date().toISOString().split('T')[0]}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setCustomDateRange(prev => ({
                        ...prev,
                        end: e.target.value
                      }));
                    }}
                    disabled={!customDateRange.start}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Total Income Section */}
          <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 dark:from-green-950/20 dark:to-blue-950/20 dark:border-green-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Financial Overview
                </h2>
                <p className="text-sm text-muted-foreground">
                  {period === 'specific-date' && specificDate
                    ? new Date(specificDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : period === 'specific-month' && specificMonth
                      ? new Date(specificMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                      : period === 'specific-year' && specificYear
                        ? `Year ${specificYear}`
                        : period === 'custom' && customDateRange.start && customDateRange.end
                          ? `From ${new Date(customDateRange.start).toLocaleDateString()} to ${new Date(customDateRange.end).toLocaleDateString()}`
                          : period === 'today' ? 'Today'
                            : period === 'week' ? 'This Week'
                              : period === 'month' ? 'This Month'
                                : period === 'year' ? 'This Year'
                                  : 'All Time'
                  }
                </p>
              </div>
              <div className="text-right">
                {/* <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-2" /> */}
                <p className={`text-4xl font-bold ${stats.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ₹{stats.netIncome.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Net Income
                </p>
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Order Income</span>
                </div>
                <span className="font-semibold text-blue-600">₹{stats.totalRevenue.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Extra Income</span>
                </div>
                <span className="font-semibold text-green-600">₹{stats.totalExtraIncome.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Expenses</span>
                </div>
                <span className="font-semibold text-red-600">₹{stats.totalExpenses.toFixed(2)}</span>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="flex items-center gap-4 pt-4 border-t border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-sm font-medium ${stats.netIncome >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {stats.netIncome >= 0 ? 'Profit' : 'Loss'}
                </span>
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${stats.netIncome >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  style={{
                    width: Math.min(Math.abs(stats.netIncome) / Math.max(stats.totalRevenue + stats.totalExtraIncome, 1) * 100, 100) + '%'
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.totalOrders > 0 || stats.totalExtraIncome > 0 || stats.totalExpenses > 0 ? 'Active' : 'No activity'}
              </span>
            </div>
          </Card>

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

            {/* <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Top Table</h3>
          </div>
          <p className="text-2xl mb-1">{stats.topTable}</p>
          <p className="text-sm text-muted-foreground">Most orders</p>
        </Card> */}
          </div>

          {/* Top 5 Selling Items */}
          {/* <Card className="p-6">
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
      </Card> */}

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
