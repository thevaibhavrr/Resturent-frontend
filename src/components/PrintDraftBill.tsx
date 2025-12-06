import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, CheckCircle2, Printer } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";

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

interface KotItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface KotEntry {
  kotId: string;
  items: KotItem[];
  timestamp: string;
  printed?: boolean;
}

interface PrintDraftBillProps {
  tableName: string;
  persons: number;
  items?: DraftBillItem[]; // Legacy support
  unprintedKots?: KotEntry[]; // New KOT-based printing
  allKots?: KotEntry[]; // All KOTs for reference
  onBack: () => void;
}

declare global {
  interface Window {
    MOBILE_CHANNEL?: {
      postMessage: (message: string) => void;
    };
  }
}

export function PrintDraftBill({ tableName, persons, items, unprintedKots, allKots, onBack }: PrintDraftBillProps) {

  // Get Bluetooth printer settings
  const getBluetoothPrinterSettings = () => {
    const user = getCurrentUser();
    if (!user?.restaurantId) return null;

    const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Error parsing Bluetooth printer settings:', error);
        return null;
      }
    }
    return null;
  };

  // Determine what to print:
  // 1. If unprintedKots exists and has items → print only unprinted KOTs (changes)
  // 2. If unprintedKots exists but is empty → print full cart (all items)
  // 3. If unprintedKots is undefined → legacy support with items prop
  const printData = (() => {
    if (unprintedKots !== undefined) {
      // KOT system is being used
      if (unprintedKots.length > 0) {
        // Print only unprinted KOTs (changes)
        return unprintedKots;
      } else {
        // Print full draft (all items from cart)
        return [{
          kotId: 'FULL-DRAFT',
          items: items?.map(item => ({
            itemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })) || [],
          timestamp: new Date().toISOString()
        }];
      }
    } else {
      // Legacy support
      return items ? [{
        kotId: 'LEGACY-KOT',
        items: items.map(item => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        timestamp: new Date().toISOString()
      }] : [];
    }
  })();

  const totalKots = unprintedKots ? (unprintedKots.length > 0 ? unprintedKots.length : 1) : (items ? 1 : 0);
  const isFullDraft = unprintedKots !== undefined && unprintedKots.length === 0;
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

q      // Get Bluetooth printer settings for MAC address
      const bluetoothSettings = getBluetoothPrinterSettings();
      const deviceMacAddress = bluetoothSettings?.address; // Dynamic MAC address from settings

      console.log('Using Bluetooth printer address for draft:', deviceMacAddress);
      console.log('Bluetooth settings for draft:', bluetoothSettings);

      if (window.MOBILE_CHANNEL) {
        window.MOBILE_CHANNEL.postMessage(
          JSON.stringify({
            event: "flutterPrint",
            deviceMacAddress: deviceMacAddress,
            imageBase64: imgData.replace("data:image/png;base64,", ""),
          })
        );

        toast.success(`Draft print request sent to device! (Address: ${deviceMacAddress || 'Not set'})`);
      } else {
        const printWindow = window.open();
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Draft Bill</title>
                <style>
                  @page { size: 58mm auto; margin: 5mm; }
                  body { margin: 5mm; padding: 0; text-align:center; }
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
    <div className="bg-background">
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
      <div className="flex items-center justify-center p-2" style={{ marginBottom: "20px" }}>
        <div
          id="draft-bill-content"
          className="bg-white text-black p-3 w-[300px] mx-auto"
          style={{ paddingBottom: "30px" }}
        >
          {/* Header Title */}
          <div className="text-center border-b border-black pb-2 mb-2">
            <h1 className="text-lg font-bold uppercase">
              {isFullDraft ? 'Full Draft Bill' : (unprintedKots ? 'Kitchen Order Tickets' : 'Draft Bill')}
            </h1>
            <p className="text-lg">Table: {tableName} • Persons: {persons}</p>
            <p className="text-sm">{currentDate} {currentTime}</p>
            {unprintedKots && !isFullDraft && (
              <p className="text-xs text-gray-600 mt-1">
                Printing {totalKots} KOT{totalKots > 1 ? 's' : ''} (changes only)
              </p>
            )}
            {isFullDraft && (
              <p className="text-xs text-gray-600 mt-1">
                Printing full draft (all items)
              </p>
            )}
          </div>

          {/* Item Table */}
          <div className="border-b border-dashed border-black pb-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-center py-1 w-10">Qty</th>
                  <th className="text-left py-1">Item</th>
                </tr>
              </thead>

              <tbody className="mb-4" style={{ marginBottom: "20px" }}>
                {printData.map((kot, kotIndex) => (
                  <React.Fragment key={kot.kotId}>
                    {/* KOT Header if multiple KOTs */}
                    {totalKots > 1 && (
                      <tr>
                        <td colSpan={2} className="text-center py-2 border-t border-black">
                          <div className="text-sm font-bold">KOT #{kotIndex + 1}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(kot.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* KOT Items */}
                    {kot.items.map((item) => (
                     <>
                     {item.quantity > 0 && ( <tr key={`${kot.kotId}-${item.itemId}`}>
                        <td className="text-center align-top py-1 pr-1 font-semibold">
                          {item.quantity > 0 ? `${item.quantity}` : item.quantity}
                        </td>

                         <td className="py-1">
                         <div className="font-medium">
                            {item.name}
                            {item.quantity < 0 && <span className="text-red-600 ml-1">(REMOVED)</span>}
                          </div>

                          {/* <div className="text-xs text-gray-600">₹{item.price}</div> */}
                        </td>
                      </tr>
                      )}
                      </>
                    ))}

                    {/* Separator between KOTs */}
                    {kotIndex < printData.length - 1 && (
                      <tr>
                        <td colSpan={2} className="border-b-2 border-dashed border-black py-1"></td>
                      </tr>
                    )}
                  </React.Fragment>
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