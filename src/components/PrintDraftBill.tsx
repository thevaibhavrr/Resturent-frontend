import React, { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, CheckCircle2, Printer, Bluetooth } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";
import { BluetoothPrinterService, PrinterStatus } from "../utils/bluetoothPrinter";
import { BluetoothPrinterStatus } from "./BluetoothPrinterStatus";
import { NewtonsCradleLoader } from "./ui/newtons-cradle-loader";
import { getRestaurantPrinterAddress } from "../config/bluetoothPrinter";

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

  const user = getCurrentUser();
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<PrinterStatus>('disconnected');
  const printerService = useRef<BluetoothPrinterService | null>(null);

  // Get Bluetooth printer settings with fallback and restaurant-specific mapping
  const getBluetoothPrinterSettings = () => {
    if (!user?.restaurantId) {
      console.log('PrintDraftBill: No user or restaurantId, using default config');
      return null; // Will use static config as fallback
    }

    const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
    console.log('PrintDraftBill: Loading Bluetooth config with key:', key);
    const stored = localStorage.getItem(key);

    let config = null;

    if (stored) {
      try {
        config = JSON.parse(stored);
        console.log('PrintDraftBill: Loaded Bluetooth config:', config);
      } catch (error) {
        console.warn('PrintDraftBill: Error parsing Bluetooth printer settings:', error);
        config = null;
      }
    }

    // If no config or config doesn't have address, check for restaurant-specific mapping
    const restaurantPrinterAddress = getRestaurantPrinterAddress(user.restaurantId);
    if (restaurantPrinterAddress) {
      if (!config) {
        // Create new config with restaurant-specific address
        config = {
          name: "Restaurant Printer",
          address: restaurantPrinterAddress,
          enabled: true,
          serviceUuid: "0000ff00-0000-1000-8000-00805f9b34fb",
          characteristicUuid: "0000ff02-0000-1000-8000-00805f9b34fb"
        };
        console.log(`PrintDraftBill: Created restaurant-specific config for ${user.restaurantId}:`, config);
      } else if (!config.address || config.address !== restaurantPrinterAddress) {
        // Update existing config with correct restaurant address
        config = {
          ...config,
          address: restaurantPrinterAddress,
          enabled: true
        };
        console.log(`PrintDraftBill: Updated config with restaurant-specific address for ${user.restaurantId}:`, restaurantPrinterAddress);
      }
    } else if (!config) {
      console.log('PrintDraftBill: No saved Bluetooth config found and no restaurant mapping, using defaults');
      return null; // Will use static config as fallback
    }

    return config;
  };

  // Initialize Bluetooth printer service
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.bluetooth) {
      const printerConfig = getBluetoothPrinterSettings();
      if (printerService.current) {
        // Update existing service with new config
        if (printerConfig) {
          printerService.current.updateSavedPrinterConfig(printerConfig);
        }
      } else {
        // Create new service
        printerService.current = new BluetoothPrinterService(setBluetoothStatus, printerConfig);
      }
      return () => {
        if (printerService.current) {
          printerService.current.disconnect();
        }
      };
    }
  }, [user]);

  const formatForThermalPrinter = (): string => {
    // Create a thermal printer receipt for draft bill/KOT
    let receipt = "\x1B@"; // Initialize printer
    receipt += "\x1B!\x00"; // Normal text

    // Add header
    receipt += `${"=".repeat(32)}\n`;
    receipt += `DRAFT BILL / KOT\n`;
    receipt += `Table: ${tableName}\n`;
    receipt += `Persons: ${persons}\n`;
    receipt += `${"=".repeat(32)}\n\n`;

    // Add KOT data if available
    if (printData && printData.length > 0) {
      printData.forEach((kot, kotIndex) => {
        if (kot.items && kot.items.length > 0) {
          // Add KOT header if multiple KOTs
          if (printData.length > 1) {
            receipt += `KOT #${kotIndex + 1} - ${new Date(kot.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}\n`;
            receipt += "-".repeat(32) + "\n";
          }

          // Add items for this KOT
          kot.items.forEach((item) => {
            const name = item.name.length > 25 ? item.name.substring(0, 22) + "..." : item.name;
            const quantity = Math.abs(item.quantity); // Handle negative quantities for removed items
            const price = `₹${(item.price * quantity).toFixed(2)}`;

            receipt += `${name}\n`;
            receipt += `  ${quantity} x ₹${item.price.toFixed(2)}`.padEnd(20) + price.padStart(12) + "\n";

            // Show if item was removed (negative quantity)
            if (item.quantity < 0) {
              receipt += `  (REMOVED)\n`;
            }

            receipt += "\n";
          });

          // Add spacing between KOTs
          if (kotIndex < printData.length - 1) {
            receipt += "\n";
          }
        }
      });
    }

    // Add footer
    receipt += `${"=".repeat(32)}\n`;
    receipt += `Generated: ${new Date().toLocaleString()}\n`;
    receipt += `DRAFT - Not Final Bill\n`;
    receipt += `${"=".repeat(32)}\n`;

    // Cut paper
    receipt += "\x1D\x56\x42\x00"; // Full cut

    return receipt;
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

  const handleBluetoothPrint = async () => {
    if (!printerService.current) {
      toast.error('Bluetooth printer service not available');
      return;
    }

    setIsBluetoothPrinting(true);
    try {
      // Ensure we're connected before printing
      if (bluetoothStatus !== 'connected') {
        console.log('Attempting to reconnect to Bluetooth printer...');
        const reconnected = await printerService.current.reconnect();
        if (!reconnected) {
          toast.error('Failed to connect to Bluetooth printer. Please check your printer settings.');
          return;
        }
      }

      // Generate the bill content for Bluetooth printing
      const billElement = document.getElementById("draft-bill-content");
      if (!billElement) {
        toast.error("Bill content not found");
        return;
      }

      // Capture the bill content as canvas for thermal printer
      const canvas = await html2canvas(billElement, {
        scale: 1.9, // Higher scale for crisp thermal printing
      });

      const imgData = canvas.toDataURL("image/png", 1.0); // Maximum quality

      // Convert to thermal printer format and print
      const thermalData = formatForThermalPrinter();
      const success = await printerService.current.print(thermalData);

      if (success) {
        toast.success("Draft bill printed via Bluetooth!");
        setPrintAttempted(true);
      } else {
        toast.error("Failed to print via Bluetooth");
      }
    } catch (error) {
      console.error("Bluetooth print error:", error);
      toast.error(`Bluetooth print failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBluetoothPrinting(false);
      setTimeout(() => {
        setShowPrintAgain(true);
      }, 1000);
    }
  };

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

      // Get Bluetooth printer settings for MAC address
      const bluetoothSettings = getBluetoothPrinterSettings();
      const deviceMacAddress = bluetoothSettings?.address; // Use saved address or fallback

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

        toast.success(`Print request sent to device! (Draft Bill)`);
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
            {printAttempted && !isBluetoothPrinting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>
                  {window.MOBILE_CHANNEL ? "Print sent to device" : "Draft generated"}
                </span>
              </div>
            )}
            {isBluetoothPrinting && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <NewtonsCradleLoader size={16} speed={1.2} color="#3b82f6" />
                <span>Printing via Bluetooth...</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {typeof navigator !== "undefined" && navigator.bluetooth && (
                <Button
                  variant="outline"
                  onClick={handleBluetoothPrint}
                  disabled={
                    isBluetoothPrinting || bluetoothStatus === "connecting"
                  }
                  className="gap-2"
                >
                  {bluetoothStatus === "connected" ? (
                    <>
                      <Bluetooth className="w-4 h-4" />
                      Print via Bluetooth
                    </>
                  ) : (
                    <>
                      <Bluetooth className="w-4 h-4" />
                      {bluetoothStatus === "connecting"
                        ? "Connecting..."
                        : "Print via Bluetooth"}
                    </>
                  )}
                </Button>
              )}

              <Button variant="default" onClick={handlePrint} className="gap-2 bg-primary">
                <Printer className="w-4 h-4" />
                {showPrintAgain ? "Print Again" : "Print"}
              </Button>
            </div>
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
              {isFullDraft ? 'Full Draft Bill' : (unprintedKots ? 'Kitchen Order' : 'Draft Bill')}
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

      {/* Bluetooth Printer Status */}
      {typeof navigator !== "undefined" && navigator.bluetooth && (
        <div className="print:hidden fixed bottom-4 right-4 z-50">
          <BluetoothPrinterStatus
            onConnect={() => setBluetoothStatus("connected")}
            onDisconnect={() => setBluetoothStatus("disconnected")}
            onError={() => setBluetoothStatus("error")}
          />
        </div>
      )}
    </div>
  );
}