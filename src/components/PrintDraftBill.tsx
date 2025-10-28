import { useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface DraftBillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  spiceLevel?: number;
  spicePercent?: number;
  isJain?: boolean;
  note?: string;
}

interface PrintDraftBillProps {
  tableName: string;
  persons: number;
  items: DraftBillItem[];
  onBack: () => void;
}

export function PrintDraftBill({ tableName, persons, items, onBack }: PrintDraftBillProps) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden p-3 border-b">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="flex items-center justify-center min-h-screen p-2 print:p-0 print:block">
        <div className="w-full max-w-[58mm] bg-white text-black p-2 print:p-0" id="draft-bill-content">
          <div className="text-center border-b border-black pb-1 mb-1">
            <h1 className="text-sm font-bold uppercase">Draft Bill</h1>
            <p className="text-[10px]">Table: {tableName} • Persons: {persons}</p>
            <p className="text-[10px]">{currentDate} {currentTime}</p>
          </div>

          <div className="border-b border-dashed border-black pb-1 mb-1">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-0.5">Item</th>
                  <th className="text-center py-0.5">Qty</th>
                  <th className="text-right py-0.5">Amt</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-0.5 pr-1">
                      <div>
                        <span>{item.name}</span>
                        {typeof item.spicePercent === 'number' && (
                          <span className="ml-1 text-[10px] text-gray-700">({Math.round(item.spicePercent)}%)</span>
                        )}
                        {item.isJain && (
                          <span className="ml-1 text-[10px] text-gray-700">[Jain]</span>
                        )}
                      </div>
                      {item.note && (
                        <div className="text-[9px] text-gray-600 italic mt-0.5">
                          Note: {item.note}
                        </div>
                      )}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-black pt-1">
            <div className="flex justify-between text-[11px] font-semibold">
              <span>Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] mt-1">
            <p>Prices are indicative. Not a tax invoice.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 58mm auto; margin: 0; }
          body { margin: 0; padding: 0; }
          body * { visibility: hidden; }
          #draft-bill-content, #draft-bill-content * { visibility: visible; }
          #draft-bill-content { position: absolute; left: 0; top: 0; width: 58mm; padding: 2mm; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
