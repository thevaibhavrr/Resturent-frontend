import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Search,
  FileText,
  Users,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { getBills } from "../../api/billApi";
import {
  Calendar as CalendarIcon,
} from "lucide-react";
import { Loader } from "../ui/loader";
import { getCurrentUser } from "../../utils/auth";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  addedBy?: {
    userId: string;
    userName: string;
  };
}

interface Bill {
  _id: string;
  billNumber: string;
  tableName: string;
  date: string;
  items: BillItem[];
  staffName: string;
  totalAmount: number;
}

interface StaffMember {
  _id: string;
  name: string;
  username: string;
}

export function UserBills() {
  const user = getCurrentUser();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  // Load staff members
  useEffect(() => {
    const loadStaffMembers = async () => {
      if (!user?.restaurantId) return;
      
      try {
        const { getStaffByRestaurant } = await import("../../api/staffApi");
        const staff = await getStaffByRestaurant(user.restaurantId);
        setStaffMembers(staff.map((s: any) => ({
          _id: s._id,
          name: s.name,
          username: s.username
        })));
      } catch (error) {
        console.error("Error loading staff members:", error);
        toast.error("Failed to load staff members");
      }
    };

    loadStaffMembers();
  }, [user?.restaurantId]);

  // Load bills
  useEffect(() => {
    const loadBills = async () => {
      if (!user?.restaurantId) return;
      
      setLoading(true);
      try {
        // In a real app, you would fetch bills from your API
        // For now, we'll use a mock implementation
        const response = await getBills({ 
          // @ts-ignore - The API might not have proper types yet
          restaurantId: user.restaurantId,
          limit: 1000
        });
        
        if (!response || !response.bills) {
          console.error('Invalid response format from getBills:', response);
          toast.error('Failed to load bills: Invalid response format');
          return;
        }

        // Transform the response to match our Bill interface
        const formattedBills = response.bills.map((bill: any) => ({
          _id: bill._id,
          billNumber: bill.billNumber,
          tableName: bill.tableName,
          date: bill.date,
          items: bill.items.map((item: any) => ({
            id: item.id || item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            addedBy: item.addedBy || { userId: "", userName: bill.staffName || "Unknown" }
          })),
          staffName: bill.staffName || "Unknown",
          totalAmount: bill.grandTotal || 0
        }));
        
        setBills(formattedBills);
        setFilteredBills(formattedBills);
      } catch (error) {
        console.error("Error loading bills:", error);
        toast.error("Failed to load bills");
      } finally {
        setLoading(false);
      }
    };

    loadBills();
  }, [user?.restaurantId]);

  // Apply filters
  useEffect(() => {
    let result = [...bills];

    // Filter by staff
    if (selectedStaff !== "all") {
      result = result.filter(bill => 
        bill.items.some(item => 
          item.addedBy?.userId === selectedStaff
        )
      );
    }

    // Filter by date
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        
        result = result.filter(bill => {
          const billDate = new Date(bill.date);
          return billDate >= fromDate && billDate <= toDate;
        });
      } else {
        const toDate = new Date(fromDate);
        toDate.setHours(23, 59, 59, 999);
        
        result = result.filter(bill => {
          const billDate = new Date(bill.date);
          return billDate >= fromDate && billDate <= toDate;
        });
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        bill =>
          bill.billNumber.toLowerCase().includes(term) ||
          bill.tableName.toLowerCase().includes(term) ||
          bill.staffName.toLowerCase().includes(term) ||
          bill.items.some(item => 
            item.name.toLowerCase().includes(term) ||
            item.addedBy?.userName.toLowerCase().includes(term)
          )
      );
    }

    setFilteredBills(result);
  }, [bills, selectedStaff, dateRange, searchTerm]);

  // Handle date filter change
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (value) {
      case "today":
        setDateRange({
          from: today,
          to: today
        });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({
          from: yesterday,
          to: yesterday
        });
        break;
      case "week":
        const weekAgo = subDays(today, 7);
        setDateRange({
          from: weekAgo,
          to: today
        });
        break;
      case "month":
        const monthAgo = subDays(today, 30);
        setDateRange({
          from: monthAgo,
          to: today
        });
        break;
      case "year":
        const yearAgo = subDays(today, 365);
        setDateRange({
          from: yearAgo,
          to: today
        });
        break;
      case "custom":
        // No change, keep the current date range
        break;
      default:
        setDateRange(undefined);
    }
  };

  // Calculate staff statistics
  const staffStats = filteredBills.reduce((acc, bill) => {
    bill.items.forEach(item => {
      const staffId = item.addedBy?.userId || 'unknown';
      const staffName = item.addedBy?.userName || 'Unknown';
      
      if (!acc[staffId]) {
        acc[staffId] = {
          name: staffName,
          itemCount: 0,
          totalValue: 0
        };
      }
      
      acc[staffId].itemCount += item.quantity;
      acc[staffId].totalValue += item.price * item.quantity;
    });
    return acc;
  }, {} as Record<string, { name: string; itemCount: number; totalValue: number }>);

  // Sort staff by total value (descending)
  const sortedStaffStats = Object.entries(staffStats).sort(
    ([, a], [, b]) => b.totalValue - a.totalValue
  );

  // Calculate totals
  const totalItems = Object.values(staffStats).reduce(
    (sum, stat) => sum + stat.itemCount,
    0
  );
  const totalValue = Object.values(staffStats).reduce(
    (sum, stat) => sum + stat.totalValue,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Bills</h1>
          <p className="text-muted-foreground">
            View and analyze bills by staff members
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Staff Member</Label>
            <Select
              value={selectedStaff}
              onValueChange={setSelectedStaff}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff._id} value={staff._id}>
                    {staff.name} ({staff.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select
              value={dateFilter}
              onValueChange={handleDateFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateFilter === "custom" && (
            <div className="space-y-2">
              <Label>Custom Date Range</Label>
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range: DateRange | undefined) => setDateRange(range)}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bills..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
              <h3 className="text-2xl font-bold">{filteredBills.length}</h3>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <h3 className="text-2xl font-bold">{totalItems}</h3>
            </div>
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
              <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <h3 className="text-2xl font-bold">₹{totalValue.toFixed(2)}</h3>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Staff Performance */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Staff Performance
          </h3>
        </div>
        <div className="divide-y">
          {sortedStaffStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4 font-medium">Staff Member</th>
                    <th className="p-4 font-medium text-right">Items Added</th>
                    <th className="p-4 font-medium text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStaffStats.map(([staffId, stat]) => (
                    <tr key={staffId} className="border-t hover:bg-muted/50">
                      <td className="p-4 font-medium">{stat.name}</td>
                      <td className="p-4 text-right">{stat.itemCount}</td>
                      <td className="p-4 text-right font-medium">
                        ₹{stat.totalValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium bg-muted/50">
                    <td className="p-4">Total</td>
                    <td className="p-4 text-right">{totalItems}</td>
                    <td className="p-4 text-right">₹{totalValue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No data available for the selected filters
            </div>
          )}
        </div>
      </Card>

      {/* Bill Details */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Bill Details
          </h3>
        </div>
        <div className="divide-y">
          {filteredBills.length > 0 ? (
            filteredBills.map((bill) => (
              <div key={bill._id} className="p-4 hover:bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      Bill #{bill.billNumber} • {bill.tableName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(bill.date).toLocaleString()} • {bill.items.length} items
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{bill.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      by {bill.staffName}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-sm">
                  <div className="font-medium mb-1">Items:</div>
                  <div className="space-y-1">
                    {bill.items.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                          {item.addedBy && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (by {item.addedBy.userName})
                            </span>
                          )}
                        </span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No bills found matching your filters
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
