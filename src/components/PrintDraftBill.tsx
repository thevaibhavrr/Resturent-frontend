

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, CheckCircle2, Printer } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

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

declare global {
  interface Window {
    MOBILE_CHANNEL?: {
      postMessage: (message: string) => void;
    };
  }
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

  const [printAttempted, setPrintAttempted] = useState(false);
  const [showPrintAgain, setShowPrintAgain] = useState(false);

  const handlePrint = async () => {
    setPrintAttempted(true);

    try {
      const billElement = document.getElementById("draft-bill-content");
      if (!billElement) {
        toast.error("Draft bill content not found");
        return;
      }

      // High quality and bigger image
      const canvas = await html2canvas(billElement, {
        scale: 1.9,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      if (window.MOBILE_CHANNEL) {
        window.MOBILE_CHANNEL.postMessage(
          JSON.stringify({
            event: "flutterPrint",
            deviceMacAddress: "66:32:B1:BE:4E:AF",
            imageBase64: imgData.replace("data:image/png;base64,", ""),
          })
        );

        toast.success("Print request sent to device!");
      } else {
        const printWindow = window.open();
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Draft Bill</title>
                <style>
                  @page { size: 58mm auto; margin: 5mm; }
                  body { margin: 5mm; padding: 0; text-align:center; padding-bottom: 10px; }
                  img { width: 100%; height: auto; display: block; }
                </style>
              </head>
              <body>
                <img src="${imgData}" />
              </body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 250);
        }
      }

      setTimeout(() => setShowPrintAgain(true), 1000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate bill");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => handlePrint(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="print:hidden p-4 border-b bg-card">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {printAttempted && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>
                  {window.MOBILE_CHANNEL ? "Print sent to device" : "Draft generated"}
                </span>
              </div>
            )}

            <Button variant="default" onClick={handlePrint} className="gap-2 bg-primary">
              <Printer className="w-4 h-4" />
              {showPrintAgain ? "Print Again" : "Print"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bill Content */}
      <div className="flex items-center justify-center min-h-screen p-2 mb-5">
        <div
          id="draft-bill-content"
          className="bg-white text-black p-3 w-[300px] mx-auto"
        >
          {/* Header Title */}
          <div className="text-center border-b border-black pb-2 mb-2">
            {/* <h1 className="text-lg font-bold uppercase">Draft Bill</h1> */}
            <p className="text-sm">Table: {tableName} • Persons: {persons}</p>
            <p className="text-sm">{currentDate} {currentTime}</p>
          </div>

          {/* Item Table */}
          <div className="border-b border-dashed border-black pb-1 mb-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-center py-1 w-10">Qty</th>
                  <th className="text-left py-1">Item</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center align-top py-1 pr-1 font-semibold">
                      {item.quantity}
                    </td>

                    <td className="py-1">
                      <div className="font-medium">{item.name}</div>

                      {typeof item.spicePercent === "number" && item.spicePercent > 0 && (
                        <span className="text-xs text-red-600 ml-1">🌶️ {Math.round(item.spicePercent)}%</span>
                      )}

                      {item.isJain && (
                        <span className="text-xs text-green-700 ml-1">[Jain]</span>
                      )}

                      {item.note && (
                        <div className="text-xs text-gray-600 italic mt-1">
                          Note: {item.note}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: 58mm auto; margin: 5mm; }
          body { margin: 5mm; padding: 0; }
          body * { visibility: hidden; }
          #draft-bill-content, #draft-bill-content * { visibility: visible; }
          #draft-bill-content { position: absolute; left: 5mm; top: 5mm; width: 48mm; padding: 2mm; }
        }
      `}</style>
    </div>  
  );
}
