import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { History, FileText, Trash2 } from "lucide-react";
import { Card } from "./ui/card";

interface BillHistoryItem {
  billNumber: string;
  tableId: number;
  tableName: string;
  persons: number;
  grandTotal: number;
  date: string;
  items: Array<{ id: number; name: string; price: number; quantity: number }>;
}

export function HistorySidebar() {
  const [history, setHistory] = useState<BillHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem("billHistory");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const handleDeleteBill = (billNumber: string) => {
    const updated = history.filter((bill) => bill.billNumber !== billNumber);
    localStorage.setItem("billHistory", JSON.stringify(updated));
    setHistory(updated);
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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 shadow-lg"
          onClick={loadHistory}
        >
          <History className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Order History</SheetTitle>
          <SheetDescription>
            View all previous bills and orders
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No order history yet</p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {history.map((bill) => (
                <Card key={bill.billNumber} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm">
                        Bill #{bill.billNumber.slice(-8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(bill.date)} • {formatTime(bill.date)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteBill(bill.billNumber)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Table:</span>
                      <span>{bill.tableName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Persons:</span>
                      <span>{bill.persons}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <span>
                        {bill.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-sm">Total:</span>
                    <Badge variant="secondary" className="text-base">
                      ₹{bill.grandTotal.toFixed(2)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
