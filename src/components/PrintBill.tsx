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
          {/* Restaurant Logo/Header */}
          <div className="text-center border-b-2 border-black pb-2 mb-2">
            {restaurantSettings.logo ? (
              <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center">
                <img 
                  src={restaurantSettings.logo} 
                  alt="Restaurant Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto mb-2 bg-black text-white flex items-center justify-center rounded-full text-2xl">
                {restaurantSettings.name.charAt(0)}
              </div>
            )}
            <h1 className="text-lg font-bold uppercase">{restaurantSettings.name}</h1>
            <p className="text-xs">{restaurantSettings.address}</p>
            <p className="text-xs">Ph: {restaurantSettings.phone}</p>
            <p className="text-xs">GSTIN: {restaurantSettings.gstin}</p>
          </div>

          {/* Bill Details */}
          <div className="text-xs mb-2 border-b border-dashed border-black pb-2">
            <div className="flex justify-between">
              <span>Bill No:</span>
              <span className="font-bold">{billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{currentDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{currentTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span>{tableName}</span>
            </div>
            <div className="flex justify-between">
              <span>Persons:</span>
              <span>{persons}</span>
            </div>
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-black pb-2 mb-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Price</th>
                  <th className="text-right py-1">Amt</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1">
                      <div>
                        <span>{item.name}</span>
                        {item.note && (
                          <div className="text-[10px] text-gray-600 italic mt-0.5">
                            Note: {item.note}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{item.price}</td>
                    <td className="text-right">{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Additional Charges */}
          {additionalCharges.length > 0 && (
            <div className="border-b border-dashed border-black pb-2 mb-2 text-xs">
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex justify-between">
                  <span>{charge.name}</span>
                  <span>{charge.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bill Summary */}
          <div className="text-xs space-y-1 mb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {additionalTotal > 0 && (
              <div className="flex justify-between">
                <span>Additional:</span>
                <span>₹{additionalTotal.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between">
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

          {/* Grand Total */}
          <div className="border-t-2 border-black pt-2 mb-2">
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs border-t border-dashed border-black pt-2">
            <p className="font-bold">Thank You!</p>
            <p>Please Visit Again</p>
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
