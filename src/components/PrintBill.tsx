import { useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "../utils/auth";
import { getRestaurantSettings } from "./admin/Settings";

interface BillItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
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
  const restaurantSettings = user ? getRestaurantSettings(user.restaurantId) : {
    name: "Restaurant Name",
    address: "123 Street, City - 400001",
    phone: "+91 1234567890",
    gstin: "22AAAAA0000A1Z5",
    logo: "",
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const additionalTotal = additionalCharges.reduce(
    (sum, charge) => sum + Number(charge.amount),
    0
  );

  useEffect(() => {
    // Auto print on mount
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button - Hidden on print */}
      <div className="print:hidden p-4 border-b">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Bill
        </Button>
      </div>

      {/* Print Bill Content */}
      <div className="flex items-center justify-center min-h-screen p-4 print:p-0 print:block">
        <div className="w-full max-w-[80mm] bg-white text-black p-4 print:p-0" id="bill-content">
          {/* Restaurant Logo/Header - Creative Design */}
          <div className="text-center border-b-4 border-double border-black pb-3 mb-3">
            {restaurantSettings.logo ? (
              <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center border-2 border-black rounded-full p-2">
                <img 
                  src={restaurantSettings.logo} 
                  alt="Restaurant Logo" 
                  className="max-w-full max-h-full object-contain rounded-full"
                />
              </div>
            ) : (
              <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-black to-gray-700 text-white flex items-center justify-center rounded-full text-3xl font-bold shadow-lg border-4 border-black">
                {restaurantSettings.name.charAt(0)}
              </div>
            )}
            <h1 className="text-xl font-extrabold uppercase tracking-wide mb-2" style={{ letterSpacing: '2px' }}>
              {restaurantSettings.name}
            </h1>
            <div className="space-y-1 text-xs">
              <p className="font-semibold">{restaurantSettings.address}</p>
              <p className="font-medium">📞 {restaurantSettings.phone}</p>
              {restaurantSettings.gstin && (
                <p className="text-[10px] opacity-75">GSTIN: {restaurantSettings.gstin}</p>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-dashed border-gray-400">
              <div className="text-[10px] text-gray-600">━━━━━━━━━━━━━━━━━━</div>
            </div>
          </div>

          {/* Bill Details - Enhanced Design */}
          <div className="text-xs mb-3 border-b-2 border-dashed border-gray-600 pb-3 bg-gray-50 -mx-1 px-2 py-2 rounded">
            <div className="grid grid-cols-2 gap-1">
              <div className="flex justify-between">
                <span className="font-semibold">Bill No:</span>
                <span className="font-bold text-base">{billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>{currentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Time:</span>
                <span>{currentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Table:</span>
                <span className="font-bold">{tableName}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="font-semibold">Persons:</span>
                <span className="font-bold">{persons}</span>
              </div>
            </div>
          </div>

          {/* Items - Enhanced Table */}
          <div className="border-b-2 border-dashed border-gray-600 pb-3 mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-gray-100">
                  <th className="text-left py-2 font-bold">Item</th>
                  <th className="text-center py-2 font-bold">Qty</th>
                  <th className="text-right py-2 font-bold">Price</th>
                  <th className="text-right py-2 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-1.5">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.note && (
                          <div className="text-[10px] text-gray-600 italic mt-0.5">
                            Note: {item.note}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center font-medium">{item.quantity}</td>
                    <td className="text-right">₹{item.price.toFixed(2)}</td>
                    <td className="text-right font-semibold">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Additional Charges */}
          {additionalCharges.length > 0 && (
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 text-xs bg-gray-50 -mx-1 px-2 py-2 rounded">
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex justify-between font-medium">
                  <span>{charge.name}:</span>
                  <span>₹{charge.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bill Summary - Enhanced */}
          <div className="text-xs space-y-1.5 mb-3 bg-gray-50 -mx-1 px-2 py-2 rounded border border-gray-300">
            <div className="flex justify-between font-semibold">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {additionalTotal > 0 && (
              <div className="flex justify-between">
                <span>Additional Charges:</span>
                <span>₹{additionalTotal.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Discount:</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>CGST (2.5%):</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (2.5%):</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
          </div>

          {/* Grand Total - Enhanced Design */}
          <div className="border-t-4 border-double border-black pt-3 mb-4 bg-gradient-to-r from-gray-100 to-white -mx-1 px-2 py-3 rounded">
            <div className="flex justify-between items-center">
              <span className="text-base font-extrabold uppercase tracking-wide">TOTAL:</span>
              <span className="text-lg font-extrabold">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer - Creative Thank You Section */}
          <div className="text-center border-t-4 border-double border-black pt-4 pb-2 space-y-2">
            <div className="text-2xl font-extrabold mb-2" style={{ letterSpacing: '3px' }}>
              🙏 THANK YOU! 🙏
            </div>
            <div className="text-sm font-bold mb-1">We appreciate your visit!</div>
            <div className="text-xs font-semibold text-gray-700 mb-2">
              Please visit us again soon
            </div>
            <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
              <div className="text-[10px] text-gray-600 space-y-0.5">
                <p className="font-semibold">{restaurantSettings.name}</p>
                <p>{restaurantSettings.address}</p>
                <p>📞 {restaurantSettings.phone}</p>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-dashed border-gray-300">
              <p>━━━━━━━━━━━━━━━━━━</p>
              <p className="mt-1">Have a great day! 🌟</p>
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
            padding: 5mm;
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
        }
      `}</style>
    </div>
  );
}
