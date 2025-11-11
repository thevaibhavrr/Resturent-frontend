import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  History,
  Search,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  ArrowLeft,
  Edit,
  Printer,
} from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface BillHistoryItem {
  _id?: string; // MongoDB ID for API operations
  billNumber: string;
  tableId: number;
  tableName: string;
  persons: number;
  grandTotal: number;
  discountAmount?: number; // Total discount on bill
  date: string;
  items: Array<{ 
    id: number | string; 
    name: string; 
    price: number; 
    quantity: number;
    note?: string;
    spiceLevel?: number;
    spicePercent?: number;
    isJain?: boolean;
    discountAmount?: number; // Item-level discount
  }>;
}

export function BillHistory() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [history, setHistory] = useState<BillHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Set default date filter to "today" for staff, "all" for admin
  const [dateFilter, setDateFilter] = useState(user?.role === "staff" ? "today" : "all");
  const [sortBy, setSortBy] = useState("date-desc");

  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load from API
      const { getBills } = await import("../../api/billApi");
      
      // For staff, default to today's date filter
      const isStaff = user.role === "staff";
      const currentDateFilter = dateFilter || (isStaff ? "today" : "all");
      
      // Calculate date range if filtering by date
      let startDate: string | undefined;
      if (currentDateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate = today.toISOString();
      } else if (currentDateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        startDate = weekAgo.toISOString();
      } else if (currentDateFilter === "month") {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        startDate = monthStart.toISOString();
      }
      
      const response = await getBills({ 
        limit: 1000,
        startDate: startDate
      });
      
      // Transform API response to match component interface
      const bills = response.bills.map((bill: any) => ({
        _id: bill._id, // Store MongoDB ID for deletion
        billNumber: bill.billNumber,
        tableId: parseInt(bill.tableId) || 0,
        tableName: bill.tableName,
        persons: bill.persons,
        grandTotal: bill.grandTotal,
        discountAmount: bill.discountAmount || 0,
        date: bill.createdAt,
        items: bill.items.map((item: any) => ({
          id: item.itemId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          note: item.note || '',
          spiceLevel: item.spiceLevel || 1,
          spicePercent: item.spicePercent || 50,
          isJain: item.isJain || false,
          discountAmount: item.discountAmount || 0
        }))
      }));
      
      setHistory(bills);
    } catch (error) {
      console.error("Error loading bill history:", error);
      // Fallback to localStorage
    const key = getRestaurantKey("billHistory", user.restaurantId);
    const stored = localStorage.getItem(key);
    if (stored) {
      setHistory(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]); // Reload when date filter changes

  const handleDeleteBill = async (billNumber: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this bill?")) return;

    try {
      // Find bill from history
      const bill = history.find(b => b.billNumber === billNumber);
      if (bill && bill._id) {
        // Delete from API
        const { deleteBill } = await import("../../api/billApi");
        await deleteBill(bill._id);
        
        // Update local state
        const updated = history.filter((b) => b.billNumber !== billNumber);
        setHistory(updated);
        
        // Also update localStorage
      const key = getRestaurantKey("billHistory", user.restaurantId);
      localStorage.setItem(key, JSON.stringify(updated));
        
        toast.success("Bill deleted successfully");
      } else {
        // Fallback: just remove from local state if no _id
        const updated = history.filter((b) => b.billNumber !== billNumber);
      setHistory(updated);
        const key = getRestaurantKey("billHistory", user.restaurantId);
        localStorage.setItem(key, JSON.stringify(updated));
        toast.success("Bill deleted from local history");
      }
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast.error("Failed to delete bill");
    }
  };

  const handleEditBill = (bill: BillHistoryItem) => {
    // Navigate to bill page with bill data for editing
    const billData = {
      table: {
        id: bill.tableId,
        tableName: bill.tableName
      },
      cart: bill.items.map(item => ({
        id: item.id.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note || '',
        spiceLevel: item.spiceLevel || 1,
        spicePercent: item.spicePercent || 50,
        isJain: item.isJain || false,
        discountAmount: item.discountAmount || 0
      })),
      persons: bill.persons,
      totalDiscount: bill.discountAmount || 0,
      isEdit: true,
      originalBillNumber: bill.billNumber
    };
    
    navigate("/order-tables/bill", { state: billData });
  };

  const handlePrintBill = (bill: BillHistoryItem) => {
    // Navigate to print page with bill data
    const printData = {
      billNumber: bill.billNumber,
      tableName: bill.tableName,
      persons: bill.persons,
      items: bill.items.map(item => ({
        id: item.id.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note || '',
        spiceLevel: item.spiceLevel || 1,
        spicePercent: item.spicePercent || 50,
        isJain: item.isJain || false,
        discountAmount: item.discountAmount || 0
      })),
      additionalCharges: [],
      discountAmount: bill.discountAmount || 0,
      cgst: 0,
      sgst: 0,
      grandTotal: bill.grandTotal
    };
    
    navigate("/order-tables/print-bill", { state: { printData } });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDateFilteredBills = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return history.filter((bill) => {
      const billDate = new Date(bill.date);
      switch (dateFilter) {
        case "today":
          return billDate >= today;
        case "week":
          return billDate >= thisWeek;
        case "month":
          return billDate >= thisMonth;
        default:
          return true;
      }
    });
  };

  const getFilteredAndSortedBills = () => {
    let filtered = getDateFilteredBills();

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (bill) =>
          bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bill.tableName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return b.grandTotal - a.grandTotal;
        case "amount-asc":
          return a.grandTotal - b.grandTotal;
        default:
          return 0;
      }
    });
  };

  const filteredBills = getFilteredAndSortedBills();

  const totalRevenue = filteredBills.reduce(
    (sum, bill) => sum + bill.grandTotal,
    0
  );
  const totalItems = filteredBills.reduce(
    (sum, bill) =>
      sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  return (
    <div className="p-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/order-tables")}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl mb-2">Bill History</h1>
          <p className="text-muted-foreground">
            View and manage all restaurant bills
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl">{filteredBills.length}</p>
              <p className="text-sm text-muted-foreground">Total Bills</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl">₹{totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Items Sold</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by bill number or table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Date Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="amount-desc">Highest Amount</SelectItem>
              <SelectItem value="amount-asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bills List */}
      <Card className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading bills...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No bills found</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredBills.map((bill) => (
                <Card key={bill.billNumber} className="p-4 border-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          Bill #{bill.billNumber.slice(-8)}
                        </h3>
                        <Badge variant="outline">{bill.tableName}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(bill.date)}</span>
                        </div>
                        <span>•</span>
                        <span>{formatTime(bill.date)}</span>
                        <span>•</span>
                        <span>{bill.persons} persons</span>
                        <span>•</span>
                        <span>
                          {bill.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}{" "}
                          items
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        {bill.discountAmount && bill.discountAmount > 0 && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{(bill.grandTotal + bill.discountAmount).toFixed(2)}
                          </p>
                        )}
                        <p className="text-xl text-primary">
                          ₹{bill.grandTotal.toFixed(2)}
                        </p>
                        {bill.discountAmount && bill.discountAmount > 0 && (
                          <p className="text-xs text-red-600">
                            -₹{bill.discountAmount.toFixed(2)} discount
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBill(bill)}
                        className="h-9 gap-2"
                        title="Edit Bill"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintBill(bill)}
                        className="h-9 gap-2"
                        title="Print Bill"
                      >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Print</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteBill(bill.billNumber)}
                        className="h-9 w-9 text-destructive"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="border-t pt-3 space-y-1">
                    {bill.items.map((item, idx) => {
                      const itemTotal = item.price * item.quantity;
                      const itemDiscount = item.discountAmount || 0;
                      const itemFinalAmount = itemTotal - itemDiscount;
                      
                      return (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                          <div className="flex-1">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.name}
                        </span>
                            {itemDiscount > 0 && (
                              <span className="text-xs text-red-600 ml-2">
                                (-₹{itemDiscount.toFixed(2)})
                              </span>
                            )}
                          </div>
                          <span>₹{itemFinalAmount.toFixed(2)}</span>
                      </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
