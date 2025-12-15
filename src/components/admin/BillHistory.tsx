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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Loader } from "../ui/loader";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { toast } from "sonner";
import { getBills, deleteBill } from "../../api/billApi";
import { useNavigate } from "react-router-dom";
import { PrintBillPopup } from "../PrintBillPopup";

interface BillHistoryItem {
  _id?: string; // MongoDB ID for API operations
  billNumber: string;
  tableId: number;
  tableName: string;
  persons: number;
  subtotal: number;
  grandTotal: number;
  discountAmount?: number; // Total discount on bill
  additionalCharges?: Array<{ name: string; amount: number }>; // Additional charges
  date: string;
  netProfit?: number; // Net profit for this bill (price - cost)
  items: Array<{
    id: number | string;
    name: string;
    price: number;
    cost?: number; // Cost of the item
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalBills, setTotalBills] = useState(0);
  const [autoPrintData, setAutoPrintData] = useState<any | null>(null);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load from API - get all bills for filtering (we'll paginate on frontend)
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
        limit: 1000, // Get more bills for client-side filtering
        startDate: startDate
      });
      
      // Transform API response to match component interface
      const bills = response.bills.map((bill: any) => ({
        _id: bill._id, // Store MongoDB ID for deletion
        billNumber: bill.billNumber,
        tableId: parseInt(bill.tableId) || 0,
        tableName: bill.tableName,
        persons: bill.persons,
        subtotal: bill.subtotal || 0,
        grandTotal: bill.grandTotal,
        discountAmount: bill.discountAmount || 0,
        additionalCharges: bill.additionalCharges || [],
        date: bill.createdAt,
        netProfit: bill.netProfit || 0,
        items: bill.items.map((item: any) => ({
          id: item.itemId || item.id,
          name: item.name,
          price: item.price,
          cost: item.cost || 0,
          quantity: item.quantity,
          note: item.note || '',
          spiceLevel: item.spiceLevel || 1,
          spicePercent: item.spicePercent || 50,
          isJain: item.isJain || false,
          discountAmount: item.discountAmount || 0
        }))
      }));
      
      setHistory(bills);
      setTotalBills(response.total || 0);
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, dateFilter]);

  const handleDeleteBill = async (billNumber: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this bill?")) return;

    try {
      // Find bill from history
      const bill = history.find(b => b.billNumber === billNumber);
      if (bill && bill._id) {
        // Delete from API
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
    // Calculate additional price from additionalCharges
    const additionalPrice = bill.additionalCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;
    
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
      additionalPrice: additionalPrice,
      isEdit: true,
      originalBillId: bill._id, // MongoDB ID for updating
      originalBillNumber: bill.billNumber
    };
    
    // Use the appropriate route based on user role
    const routePrefix = user?.role === 'admin' ? '/admin' : '';
    navigate(`${routePrefix}/order-tables/bill`, { state: billData });
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
      additionalCharges: bill.additionalCharges?.map((charge, idx) => ({
        id: idx,
        name: charge.name,
        amount: charge.amount
      })) || [],
      discountAmount: bill.discountAmount || 0,
      cgst: 0,
      sgst: 0,
      grandTotal: bill.grandTotal,
      billDate: new Date(bill.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      billTime: new Date(bill.date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    };
    
    // Instead of navigating to the print page, open the auto-print popup
    setAutoPrintData({ printData });
    // Optionally show a small toast
    toast.success('Opening print popup...');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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

  // For now, we'll use the paginated data from the API
  // The filtering will be done on the frontend for search and sorting
  const displayBills = getFilteredAndSortedBills();
  
  // Client-side pagination
  const paginatedBills = displayBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Find the most recent bill (first in the sorted list as it's sorted by date descending)
  const mostRecentBill = displayBills.length > 0 ? displayBills[0] : null;

  // Pagination calculations
  const totalPages = Math.ceil(displayBills.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const totalRevenue = displayBills.reduce(
    (sum, bill) => sum + bill.grandTotal,
    0
  );
  const totalItems = displayBills.reduce(
    (sum, bill) =>
      sum + bill.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  return (
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/order-tables")}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Bill History</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage all restaurant bills
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <div>
              <p className="text-xl sm:text-2xl font-medium">{totalBills}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Bills</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <History className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <div>
              <p className="text-xl sm:text-2xl font-medium">{totalItems.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Items Sold</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search by bill or table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm sm:text-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest</SelectItem>
                <SelectItem value="date-asc">Oldest</SelectItem>
                <SelectItem value="amount-desc">Highest ₹</SelectItem>
                <SelectItem value="amount-asc">Lowest ₹</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bills List */}
      <Card className="p-3 sm:p-4">
        {loading ? (
          <Loader text="Loading bill history..." />
        ) : displayBills.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <History className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No bills found</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)] sm:h-[600px] pr-2 sm:pr-4 -mr-2 sm:mr-0">
            <div className="space-y-2 sm:space-y-3">
              {paginatedBills.map((bill) => (
                <Card key={bill.billNumber} className="p-3 sm:p-4 border">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold truncate">
                          Bill #{bill.billNumber.slice(-6)}
                        </h3>
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {bill.tableName}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(bill.date)}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatTime(bill.date)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{bill.persons} {bill.persons === 1 ? 'person' : 'people'}</span>
                        <span>•</span>
                        <span>
                          {bill.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start sm:items-center justify-between sm:justify-end gap-2">
                      <div className="text-right">
                        <p className="text-lg sm:text-xl font-medium text-primary">
                          ₹{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {(bill.discountAmount && bill.discountAmount > 0) || (bill.additionalCharges && bill.additionalCharges.length > 0) ? (
                          <div className="text-[10px] sm:text-xs space-y-0.5 mt-0.5">
                            {bill.discountAmount && bill.discountAmount > 0 && (
                              <p className="text-red-600">
                                -₹{bill.discountAmount.toFixed(2)} discount
                              </p>
                            )}
                            {bill.additionalCharges && bill.additionalCharges.length > 0 && (
                              <p className="text-green-600">
                                +₹{bill.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0).toFixed(2)} additional
                              </p>
                            )}
                          </div>
                        ) : null}
                        {user?.role === 'admin' && bill.netProfit !== undefined && (
                          <div className="text-[10px] sm:text-xs mt-0.5">
                            <p className={`font-medium ${bill.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Profit: ₹{bill.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 ml-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditBill(bill)}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          title={user?.role === 'admin' || bill.billNumber === mostRecentBill?.billNumber 
                            ? 'Edit Bill' 
                            : 'Only the most recent bill can be edited'}
                          disabled={user?.role !== 'admin' && bill.billNumber !== mostRecentBill?.billNumber}
                        >
                          <Edit className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            user?.role !== 'admin' && bill.billNumber !== mostRecentBill?.billNumber ? 'opacity-30' : ''
                          }`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handlePrintBill(bill)}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          title="Print Bill"
                        >
                          <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteBill(bill.billNumber)}
                            className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive/90"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="border-t border-muted/50 pt-2 mt-2 space-y-1.5">
                    {bill.items.slice(0, 3).map((item, idx) => {
                      const itemTotal = item.price * item.quantity;
                      const itemDiscount = item.discountAmount || 0;
                      const itemFinalAmount = itemTotal - itemDiscount;
                      
                      return (
                        <div key={idx} className="flex justify-between text-xs sm:text-sm">
                          <div className="flex-1 truncate pr-2">
                            <span className="text-muted-foreground">
                              {item.quantity}x {item.name}
                            </span>
                            {itemDiscount > 0 && (
                              <span className="text-[10px] sm:text-xs text-red-600 ml-1">
                                (-₹{itemDiscount.toFixed(2)})
                              </span>
                            )}
                          </div>
                          <span className="font-medium">
                            ₹{itemFinalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                    
                    {bill.items.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        +{bill.items.length - 3} more items
                      </div>
                    )}
                    
                    {/* Summary Section */}
                    {(bill.discountAmount && bill.discountAmount > 0) || (bill.additionalCharges && bill.additionalCharges.length > 0) ? (
                      <div className="border-t border-muted/50 pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>₹{(bill.subtotal || bill.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {bill.discountAmount && bill.discountAmount > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm text-red-600">
                            <span>Discount:</span>
                            <span>-₹{bill.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {bill.additionalCharges && bill.additionalCharges.length > 0 && (
                          <>
                            {bill.additionalCharges.map((charge, idx) => (
                              <div key={idx} className="flex justify-between text-xs sm:text-sm text-green-600">
                                <span>{charge.name}:</span>
                                <span>+₹{charge.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="flex justify-between text-sm font-semibold border-t border-muted/50 pt-1 mt-1">
                          <span>Grand Total:</span>
                          <span className="text-base">
                            ₹{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, displayBills.length)} of {displayBills.length} bills</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Items per page selector */}
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value: string) => handleItemsPerPageChange(parseInt(value))}
              >
                <SelectTrigger className="w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              {/* Previous button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="h-8 w-8 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              {/* Next button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
      {/* Auto-print popup for history bills */}
      {autoPrintData && (
        <PrintBillPopup
          {...autoPrintData.printData}
          onClose={() => setAutoPrintData(null)}
          user={user}
        />
      )}
    </div>
  );
}
