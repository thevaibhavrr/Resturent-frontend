import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Printer, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "../utils/auth";
import { getRestaurantSettings } from "./admin/Settings";
import { toast } from "sonner";

interface BillItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  discountAmount?: number; // Discount in ₹ for this item
}

interface PrintBillProps {
  billNumber: string;
  tableName: string;
  persons: number;
  items: BillItem[];
  additionalCharges: Array<{ id: number; name: string; amount: number }>;
  discountAmount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  onBack: () => void;
}

export function PrintBill({
  billNumber,
  tableName,
  persons,
  items,
  additionalCharges,
  discountAmount,
  cgst,
  sgst,
  grandTotal,
  onBack,
}: PrintBillProps) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const user = getCurrentUser();
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: "Restaurant Name",
    address: "",
    phone: "",
    gstin: "",
    logo: "",
    email: "",
    website: "",
    description: "",
  });
  const [printAttempted, setPrintAttempted] = useState(false);
  const [showPrintAgain, setShowPrintAgain] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (user?.restaurantId) {
        try {
          const settings = await getRestaurantSettings(user.restaurantId);
          setRestaurantSettings(settings);
        } catch (error) {
          console.error("Error loading restaurant settings:", error);
        }
      }
    };
    loadSettings();
  }, [user]);

  // Calculate subtotal with item discounts
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = item.discountAmount || 0;
    return sum + itemTotal - itemDiscount;
  }, 0);
  
  const additionalTotal = additionalCharges.reduce(
    (sum, charge) => sum + Number(charge.amount),
    0
  );

  const handlePrint = () => {
    setPrintAttempted(true);
    window.print();
    
    // Show print again button after a delay (in case print was cancelled)
    setTimeout(() => {
      setShowPrintAgain(true);
    }, 1000);
  };

  const handlePrintAgain = () => {
    handlePrint();
    toast.success("Print dialog opened. Please confirm to print.");
  };

  useEffect(() => {
    // Auto print on mount
    const timer = setTimeout(() => {
      handlePrint();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Action Buttons - Hidden on print */}
      <div className="print:hidden p-4 border-b bg-card">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Bill
          </Button>
          
          <div className="flex items-center gap-3">
            {printAttempted && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Print dialog opened</span>
              </div>
            )}
            <Button 
              variant="default" 
              onClick={handlePrintAgain} 
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Printer className="w-4 h-4" />
              {showPrintAgain ? "Print Again" : "Print"}
            </Button>
          </div>
        </div>
        
        {showPrintAgain && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If the bill didn't print, click "Print Again" to retry. 
              Make sure your printer is connected and ready.
            </p>
          </div>
        )}
      </div>

      {/* Print Bill Content */}
      <div className="flex items-center justify-center min-h-screen p-4 print:p-0 print:block">
        <div className="w-full max-w-[80mm] bg-white text-black p-3 print:p-3" id="bill-content">
          {/* Premium Header with Logo */}
          <div className="text-center mb-2 pb-2 border-b-4 border-double border-gray-800">
            {restaurantSettings.logo ? (
              <div className="mb-1 flex justify-center">
                <div className="w-16 h-16 border-4 border-gray-800 rounded-full p-1 flex items-center justify-center">
                  <img
                    src={restaurantSettings.logo}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-1 flex justify-center">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-600 text-white rounded-full flex items-center justify-center text-xl font-black border-4 border-gray-800 shadow-lg">
                  {restaurantSettings.name ? restaurantSettings.name.charAt(0).toUpperCase() : 'R'}
                </div>
              </div>
            )}
            <h1 className="text-xl font-black uppercase tracking-wider mb-1" style={{ 
              letterSpacing: '2px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              {restaurantSettings.name || "Restaurant Name"}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px bg-gray-400 flex-1"></div>
              <div className="text-[8px] text-gray-500 font-semibold">* * *</div>
              <div className="h-px bg-gray-400 flex-1"></div>
            </div>
          </div>

          {/* Bill Information - Premium Style */}
          <div className="mb-2 pb-2 border-b-2 border-dashed border-gray-500">
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
             
              <div className="flex justify-between items-center bg-gray-50 px-2 py-0.5 rounded">
                <span className="font-semibold text-gray-700">Date:</span>
                <span className="font-medium">{currentDate}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 px-2 py-0.5 rounded">
                <span className="font-semibold text-gray-700">Time:</span>
                <span className="font-medium">{currentTime}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 px-2 py-0.5 rounded">
                <span className="font-semibold text-gray-700">Table:</span>
                <span className="font-bold text-gray-900">{tableName}</span>
              </div>
              <div className="col-span-2 flex justify-between items-center bg-gray-50 px-2 py-0.5 rounded">
                <span className="font-semibold text-gray-700">Persons:</span>
                <span className="font-bold text-gray-900">{persons}</span>
              </div>
            </div>
          </div>

          {/* Premium Item Table */}
          <div className="mb-2 pb-2 border-b-2 border-dashed border-gray-500">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-800 text-black">
                  <th className="text-left py-1.5 px-1 font-bold">Item</th>
                  <th className="text-center py-1.5 px-1 font-bold w-12">Qty</th>
                  <th className="text-right py-1.5 px-1 font-bold w-16">Price</th>
                  <th className="text-right py-1.5 px-1 font-bold w-20">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const itemTotal = item.price * item.quantity;
                  const itemDiscount = item.discountAmount || 0;
                  const itemFinalAmount = itemTotal - itemDiscount;
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="py-1.5 px-1">
                        <div>
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          {item.note && (
                            <div className="text-[9px] text-gray-600 italic mt-0.5 font-light">
                              Note: {item.note}
                            </div>
                          )}
                          {itemDiscount > 0 && (
                            <div className="text-[9px] text-red-600 mt-0.5 font-medium">
                              Discount: -₹{itemDiscount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-center font-medium text-gray-800">{item.quantity}</td>
                      <td className="text-right font-medium text-gray-700">₹{item.price.toFixed(2)}</td>
                      <td className="text-right font-bold text-gray-900">₹{itemFinalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Additional Charges */}
          {additionalCharges.length > 0 && (
            <div className="mb-2 pb-1.5 border-b border-dashed border-gray-400">
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex justify-between text-[11px] py-0.5">
                  <span className="font-medium text-gray-700">{charge.name}:</span>
                  <span className="font-semibold text-gray-900">₹{charge.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Premium Total Section */}
          <div className="mb-0 pb-0 border-t-4 border-double border-gray-800 pt-2">
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[11px] text-red-600">
                  <span>Total Discount:</span>
                  <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="bg-gradient-to-r from-gray-100 to-gray-50 -mx-2 px-3 py-1.5 rounded border border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-base font-black uppercase tracking-wider text-gray-900">TOTAL</span>
                <span className="text-xl font-black text-gray-900">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Premium Thank You Section */}
          <div className="text-center mb-0 pb-0 border-t-2 border-dashed border-gray-500 pt-0">
            <div className="text-lg font-black uppercase" style={{ letterSpacing: '2px' }}>
              THANK YOU
            </div>
           
           
          </div>

          {/* Premium Footer with Contact */}
          <div className="text-center border-t-2 border-dashed border-gray-500 pt-2">
            <div className="space-y-0.5 text-[10px]">
              {restaurantSettings.name && (
                <p className="font-bold text-gray-900 uppercase tracking-wide">{restaurantSettings.name}</p>
              )}
              {restaurantSettings.address && (
                <p className="font-medium text-gray-700 leading-tight">{restaurantSettings.address}</p>
              )}
              {restaurantSettings.phone && (
                <p className="font-semibold text-gray-800 mt-0.5">Phone: {restaurantSettings.phone}</p>
              )}
              {restaurantSettings.gstin && (
                <p className="text-[9px] text-gray-600 mt-0.5">GSTIN: {restaurantSettings.gstin}</p>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1.5 pt-1.5 border-t border-dashed border-gray-400">
              <div className="h-px bg-gray-400 flex-1"></div>
              <div className="text-[8px] text-gray-500 font-semibold">* * *</div>
              <div className="h-px bg-gray-400 flex-1"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          
          body * {
            visibility: hidden;
          }
          
          #bill-content,
          #bill-content * {
            visibility: visible;
          }
          
          #bill-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 3mm;
            background: white;
            box-shadow: none;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          /* Ensure borders print correctly */
          #bill-content table,
          #bill-content th,
          #bill-content td {
            border-color: #000 !important;
          }
          
          /* Better print quality */
          #bill-content {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
