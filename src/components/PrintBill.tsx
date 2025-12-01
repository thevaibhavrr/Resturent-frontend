
import React from 'react';
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Bluetooth,
} from "lucide-react";
import { getCurrentUser } from "../utils/auth";
import { settingsService } from "../utils/settingsService";
import { toast } from "sonner";
import { BluetoothPrinterService } from "../utils/bluetoothPrinter";
import { BluetoothPrinterStatus } from "./BluetoothPrinterStatus";
import { NewtonsCradleLoader } from "./ui/newtons-cradle-loader";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  restaurantId?: string; // Add restaurantId prop
  onBack: () => void;
  autoPrint?: boolean; // New prop for automatic printing
  redirectAfterPrint?: boolean; // New prop for automatic redirect after print
}

// Type declarations for Flutter webview communication
declare global {
  interface Window {
    MOBILE_CHANNEL?: {
      postMessage: (message: string) => void;
    };
  }
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
  restaurantId,
  onBack,
  autoPrint = false, // Default to false
  redirectAfterPrint = false, // Default to false
}: PrintBillProps) {
  // Helper function to format amounts without .00 for whole numbers
  const formatAmount = (amount: number): string => {
    const formatted = amount.toFixed(2);
    return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
  };
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
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantSettings, setRestaurantSettings] = useState(() => {
    // Initialize with localStorage data immediately
    const cached = settingsService.getSettings();
    return cached || {
      name: "Restaurant Name",
      address: "",
      phone: "",
      gstin: "",
      logo: "",
      qrCode: "",
      email: "",
      website: "",
      description: "",
    };
  });
  const [printAttempted, setPrintAttempted] = useState(false);
  const [showPrintAgain, setShowPrintAgain] = useState(false);
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const printerService = useRef<BluetoothPrinterService | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [autoPrintCompleted, setAutoPrintCompleted] = useState(false);

  useEffect(() => {
    console.log("PrintBill: Loading settings from localStorage");

    // Get settings from localStorage via settingsService
    const settings = settingsService.getSettings();

    if (settings) {
      console.log("PrintBill: Loaded settings from localStorage:", settings);
      console.log("PrintBill: Restaurant name from settings:", settings.name);
      setRestaurantSettings(settings);
    } else {
      console.log("PrintBill: No settings found in localStorage, keeping defaults");
      // Keep the default "Loading..." state or fallback to basic defaults
      setRestaurantSettings({
        name: "Restaurant Name",
        address: "",
        phone: "",
        gstin: "",
        logo: "",
        qrCode: "",
        email: "",
        website: "",
        description: "",
      });
    }

    setIsLoading(false);
  }, []); // Only run once on mount

  // Auto print effect
  useEffect(() => {
    if (autoPrint && !autoPrintCompleted) {
      console.log("Auto print triggered");
      handleAutoPrint();
    }
  }, [autoPrint, autoPrintCompleted]);

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

  // Initialize Bluetooth printer service
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.bluetooth) {
      printerService.current = new BluetoothPrinterService(setBluetoothStatus);
      return () => {
        if (printerService.current) {
          printerService.current.disconnect();
        }
      };
    }
  }, []);

  const formatForThermalPrinter = (): string => {
    // Create a simple text-based receipt
    let receipt = "\x1B@"; // Initialize printer
    receipt += "\x1B!\x00"; // Normal text

    // Add header
    receipt += `${"=".repeat(32)}\n`;
    receipt += `${restaurantSettings.name || "RESTAURANT"}\n`;
    receipt += `${"=".repeat(32)}\n\n`;

    // Add order info
    receipt += `Bill #: ${billNumber.padEnd(20)}${currentDate}\n`;
    receipt += `Table: ${tableName.padEnd(20)}${currentTime}\n`;
    receipt += `Persons: ${persons.toString().padEnd(16)}${" ".repeat(6)}\n`;
    receipt += "-".repeat(32) + "\n";

    // Add items
    items.forEach((item) => {
      const name =
        item.name.length > 20 ? item.name.substring(0, 17) + "..." : item.name;
      const price = `₹${formatAmount(item.price * item.quantity)}`;
      receipt += `${name}\n`;
      receipt +=
        `  ${item.quantity} x ₹${formatAmount(item.price)}`.padEnd(20) +
        price.padStart(12) +
        "\n";
      if (item.note) {
        receipt += `  (${item.note})\n`;
      }
    });

    // Add totals
    receipt += "\n";
    receipt += "Subtotal:".padEnd(20) + `₹${formatAmount(subtotal)}\n`;

    if (discountAmount > 0) {
      receipt += "Discount:".padEnd(20) + `-₹${formatAmount(discountAmount)}\n`;
    }

    if (additionalCharges.length > 0) {
      additionalCharges.forEach((charge) => {
        receipt +=
          `${charge.name}:`.padEnd(20) + `₹${formatAmount(charge.amount)}\n`;
      });
    }

    if (cgst > 0) {
      receipt += "CGST:".padEnd(20) + `₹${formatAmount(cgst)}\n`;
    }

    if (sgst > 0) {
      receipt += "SGST:".padEnd(20) + `₹${formatAmount(sgst)}\n`;
    }

    receipt += "\n";
    receipt += "TOTAL:".padEnd(20) + `₹${formatAmount(grandTotal)}\n\n`;

    // Add footer
    receipt += "\n";
    receipt += `${"Thank you for dining with us!".padStart(24)}\n`;
    receipt += `${"=".repeat(32)}\n\n\n\n`;

    // Add paper cut command (if supported by printer)
    receipt += "\x1DVA\x00"; // Partial cut

    return receipt;
  };

  const handlePrint = async () => {
    setPrintAttempted(true);

    try {
      const billElement = document.getElementById("bill-content");
      if (!billElement) {
        toast.error("Bill content not found");
        return;
      }

      // Capture the bill content as canvas for 58mm thermal printer
      const canvas = await html2canvas(billElement, {
        scale: 1.1, // Higher scale for crisp thermal printing (3x = ~300 DPI)
      });

      const imgData = canvas.toDataURL("image/png", 1.0); // Maximum quality

      // Check if running in Flutter webview
      if (window.MOBILE_CHANNEL) {
        // Send print request to Flutter
        window.MOBILE_CHANNEL.postMessage(
          JSON.stringify({
            event: "flutterPrint",
            deviceMacAddress: "66:32:B1:BE:4E:AF", // TODO: Get device MAC address from API
            imageBase64: imgData.replace("data:image/png;base64,", ""), // Remove data URL prefix
          })
        );

        toast.success("Print request sent to Flutter!");
      } else {
        // Fallback for web browsers - set image URL
        setPdfUrl(imgData);
        toast.success("Image generated successfully!");
      }

      // Show print again button after a delay
      setTimeout(() => {
        setShowPrintAgain(true);
      }, 1000);
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    }
  };

  const handleAutoPrint = async () => {
    console.log("Starting auto print process...");
    try {
      await handlePrint();
      setAutoPrintCompleted(true);

      // If redirect is enabled, wait a bit then redirect
      if (redirectAfterPrint) {
        setTimeout(() => {
          console.log("Auto redirecting after print...");
          onBack();
        }, 3000); // Wait 3 seconds before redirecting
      }
    } catch (error) {
      console.error("Auto print failed:", error);
      setAutoPrintCompleted(true);
    }
  };

  const handlePrintAgain = (useBluetooth: boolean = false) => {
    handlePrint();
    if (!useBluetooth) {
      toast.success("Print dialog opened. Please confirm to print.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Action Buttons - Hidden on print */}
      <div className="print:hidden p-4 border-b bg-card">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>

          <div className="flex items-center gap-3">
            {printAttempted && !isBluetoothPrinting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>
                  {window.MOBILE_CHANNEL
                    ? "Print sent to device"
                    : "Image generated"}
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
                  onClick={() => handlePrintAgain(true)}
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
                        : "Connect & Print"}
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="default"
                onClick={() => handlePrintAgain(false)}
                disabled={isBluetoothPrinting}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Printer className="w-4 h-4" />
                {showPrintAgain ? "Print Again" : "Print"}
              </Button>
            </div>
          </div>
        </div>

        {showPrintAgain && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If the bill didn't print, try the
              following:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Click "Print" to try regular printing again</li>
                <li>
                  For Bluetooth printing, ensure your printer is turned on and
                  in range
                </li>
                <li>
                  Check that your browser has Bluetooth permissions enabled
                </li>
              </ul>
            </p>
          </div>
        )}

        {typeof navigator !== "undefined" && navigator.bluetooth && (
          <div className="mt-3">
            <BluetoothPrinterStatus
              onConnect={() => setBluetoothStatus("connected")}
              onDisconnect={() => setBluetoothStatus("disconnected")}
              onError={() => setBluetoothStatus("error")}
            />
          </div>
        )}
      </div>

      {/* Print Bill Content */}
      <div className="flex items-center justify-center min-h-screen p-4 print:p-0 print:block">
        <div
          className="w-[58mm] bg-white text-black p-2 print:p-2"
          id="bill-content"
        >
          {/* Premium Header with Logo */}
          <div className="text-center p-3 mb pb-1 border-b-4 border-double border-gray-800">
            {restaurantSettings.logo ? (
              <div className="mb-1 flex justify-center">
                <div className="w-21 h-21 border-4 border-gray-800 rounded-full p-1 flex items-center justify-center">
                  <img
                    src={restaurantSettings.logo}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-1 flex justify-center">
                <div className="w-18 h-18 bg-gradient-to-br from-gray-800 to-gray-600 text-white rounded-full flex items-center justify-center text-2xl font-black border-4 border-gray-800 shadow-lg">
                  {restaurantSettings.name
                    ? restaurantSettings.name.charAt(0).toUpperCase()
                    : "R"}
                </div>
              </div>
            )}
            <h1
              className="text-2xl font-black uppercase tracking-wider mb-1"
              style={{
                letterSpacing: "2px",
                textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              {restaurantSettings.name || "Restaurant"}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px bg-gray-400 flex-1"></div>
              <div className="text-[8px] text-gray-500 font-semibold">
                * * *
              </div>
              <div className="h-px bg-gray-400 flex-1"></div>
            </div>
          </div>

          {/* Bill Information - Premium Style */}
          <div className="mb-2 pb-2 border-b-2 border-dashed border-gray-500">
            <div className="grid grid-cols-2 gap-1.5 text-[12px]">
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
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-gray-800 text-black">
                  <th className="text-left py-1.5 px-1 font-bold">Item</th>
                  <th className="text-center py-1.5 px-1 font-bold w-12">
                    Qty
                  </th>
                  <th className="text-right py-1.5 px-1 font-bold w-16">
                    Price
                  </th>
                  <th className="text-right py-1.5 px-1 font-bold w-20">
                    Amount
                  </th>
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
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="py-1.5 px-1">
                        <div>
                          <span className="font-semibold text-gray-900">
                            {item.name}
                          </span>
                          {item.note && (
                            <div className="text-[12px] text-gray-600 italic mt-0.5 font-light">
                              Note: {item.note}
                            </div>
                          )}
                          {itemDiscount > 0 && (
                            <div className="text-[12px] text-red-600 mt-0.5 font-medium">
                              Discount: -₹{formatAmount(itemDiscount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-center font-medium text-gray-800">
                        {item.quantity}
                      </td>
                      <td className="text-right font-medium text-gray-700">
                        ₹{formatAmount(item.price)}
                      </td>
                      <td className="text-right font-bold text-gray-900">
                        ₹{formatAmount(itemFinalAmount)}
                      </td>
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
                <div
                  key={charge.id}
                  className="flex justify-between text-[13px] py-0.5"
                >
                  <span className="font-medium text-gray-700">
                    {charge.name}:
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{formatAmount(charge.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Premium Total Section */}
          <div className="mb-0 pb-0 border-t-4 border-double border-gray-800 pt-2">
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold text-gray-900">
                  ₹{formatAmount(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[13px] text-red-600">
                  <span>Total Discount:</span>
                  <span className="font-semibold">
                    -₹{formatAmount(discountAmount)}
                  </span>
                </div>
              )}
              {additionalTotal > 0 && (
                <div className="flex justify-between text-[13px] text-green-600">
                  <span>Additional Charges:</span>
                  <span className="font-semibold">
                    +₹{formatAmount(additionalTotal)}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-gradient-to-r from-gray-100 to-gray-50 -mx-2 px-3 py-1.5 rounded border border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-black uppercase tracking-wider text-gray-900">
                  TOTAL
                </span>
                <span className="text-2xl font-black text-gray-900">
                  ₹{formatAmount(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {restaurantSettings.qrCode && (
            <div className="mb-2 pb-2 border-t-2 p-3 border-dashed border-gray-500 pt-2 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-22 h-22 border-2 border-gray-300 rounded-lg p-2 bg-white">
                  <img
                    src={restaurantSettings.qrCode}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
             
              </div>
            </div>
          )}

          {/* Premium Thank You Section */}
          <div className="text-center mb-0 pb-0 border-t-2 border-dashed border-gray-500 pt-0">
            <div
              className="text-xl font-black uppercase"
              style={{ letterSpacing: "2px" }}
            >
              THANK YOU
            </div>
          </div>

          {/* Premium Footer with Contact */}
          <div className="text-center border-t-2 border-dashed border-gray-500 pt-2">
            <div className="space-y-0.5 text-[12px]">
              {restaurantSettings.name && (
                <p className="font-bold text-gray-900 uppercase tracking-wide">
                  {restaurantSettings.name}
                </p>
              )}
              {restaurantSettings.address && (
                <p className="font-medium text-gray-700 leading-tight">
                  {restaurantSettings.address}
                </p>
              )}
              {restaurantSettings.phone && (
                <p className="font-semibold text-gray-800 mt-0.5">
                  Phone: {restaurantSettings.phone}
                </p>
              )}
              {restaurantSettings.gstin && (
                <p className="text-[11px] text-gray-600 mt-0.5">
                  GSTIN: {restaurantSettings.gstin}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1.5 pt-1.5 border-t border-dashed border-gray-400">
              <div className="h-px bg-gray-400 flex-1"></div>
              <div className="text-[8px] text-gray-500 font-semibold">
                * * *
              </div>
              <div className="h-px bg-gray-400 flex-1"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
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
            width: 58mm;
            padding: 2mm;
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