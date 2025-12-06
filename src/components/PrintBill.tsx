
import React from 'react';
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Bluetooth,
} from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";
import { settingsService } from "../utils/settingsService";
import { toast } from "sonner";
import { BluetoothPrinterService, SavedPrinterConfig } from "../utils/bluetoothPrinter";
import { BluetoothPrinterStatus } from "./BluetoothPrinterStatus";
import { getRestaurantPrinterAddress } from "../config/bluetoothPrinter";
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
  billDate?: string; // Original bill date
  billTime?: string; // Original bill time
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
  billDate,
  billTime,
}: PrintBillProps) {
  // Helper function to format amounts without .00 for whole numbers
  const formatAmount = (amount: number): string => {
    const formatted = amount.toFixed(2);
    return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
  };
  // Use original bill date/time if available, otherwise use current date/time
  const displayDate = billDate || new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const displayTime = billTime || new Date().toLocaleTimeString("en-IN", {
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

  // Get Bluetooth printer settings with fallback and restaurant-specific mapping
  const getBluetoothPrinterSettings = (): SavedPrinterConfig => {
    if (!user?.restaurantId) {
      console.log('PrintBill: No user or restaurantId, using default config');
      return {
        name: "Default Printer",
        address: "",
        enabled: false,
        serviceUuid: "0000ff00-0000-1000-8000-00805f9b34fb",
        characteristicUuid: "0000ff02-0000-1000-8000-00805f9b34fb"
      };
    }

    const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
    console.log('PrintBill: Loading Bluetooth config with key:', key);
    const stored = localStorage.getItem(key);

    let config: SavedPrinterConfig = {
      name: "Default Printer",
      address: "",
      enabled: false,
      serviceUuid: "0000ff00-0000-1000-8000-00805f9b34fb",
      characteristicUuid: "0000ff02-0000-1000-8000-00805f9b34fb"
    };

    if (stored) {
      try {
        const parsedConfig = JSON.parse(stored) as SavedPrinterConfig;
        console.log('PrintBill: Loaded Bluetooth config:', parsedConfig);
        config = { ...config, ...parsedConfig };
      } catch (error) {
        console.warn('PrintBill: Error parsing Bluetooth printer settings:', error);
      }
    }

    // Apply restaurant-specific mapping
    const restaurantPrinterAddress = getRestaurantPrinterAddress(user.restaurantId);
    if (restaurantPrinterAddress) {
      config = {
        ...config,
        address: restaurantPrinterAddress,
        enabled: true
      };
      console.log(`PrintBill: Applied restaurant-specific address for ${user.restaurantId}:`, restaurantPrinterAddress);
    }

    return config;
  };

  // Initialize Bluetooth printer service
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.bluetooth) {
      const printerConfig = getBluetoothPrinterSettings();
      if (printerService.current) {
        // Update existing service with new config
        printerService.current.updateSavedPrinterConfig(printerConfig);
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
    // Create a simple text-based receipt
    let receipt = "\x1B@"; // Initialize printer
    receipt += "\x1B!\x00"; // Normal text

    // Add header
    receipt += `${"=".repeat(32)}\n`;
    receipt += `${restaurantSettings.name || "RESTAURANT"}\n`;
    receipt += `${"=".repeat(32)}\n\n`;

    // Add order info
    receipt += `Bill #: ${billNumber.padEnd(20)}${displayDate}\n`;
    receipt += `Table: ${tableName.padEnd(20)}${displayTime}\n`;
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

      // Get Bluetooth printer settings for MAC address
      const bluetoothSettings = getBluetoothPrinterSettings();
      const deviceMacAddress = bluetoothSettings.address || "";

      console.log('Using Bluetooth printer address:', deviceMacAddress);
      console.log('Bluetooth settings:', bluetoothSettings);

      // Check if running in Flutter webview
      if (window.MOBILE_CHANNEL) {
        // Send print request to Flutter with dynamic MAC address
        window.MOBILE_CHANNEL.postMessage(
          JSON.stringify({
            event: "flutterPrint",
            deviceMacAddress: deviceMacAddress,
            imageBase64: imgData.replace("data:image/png;base64,", ""), // Remove data URL prefix
          })
        );

        toast.success(`Print request sent to Flutter! (Device: ${deviceMacAddress})`);
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

      {/* Print Bill Content - Dynamic Width for Thermal Printers */}
      <div className="flex items-center justify-center min-h-screen p-4 print:p-0 print:block">
        <div
          className="bg-white text-black overflow-hidden"
          id="bill-content"
          style={{
            boxSizing: 'border-box',
            width: '58mm',
            maxWidth: '80mm',
            minWidth: '48mm',
            padding: '1mm',
            fontFamily: "'Courier New', 'Roboto Mono', 'Monaco', monospace",
            fontSize: '12px',
            lineHeight: '1.1',
            letterSpacing: '0.3px'
          }}
        >
          {/* HEADER - Restaurant Name */}
          <div className="text-center border-b-2 border-black pb-1 mb-1">
            <h1 className="text-lg font-bold uppercase tracking-wide">
              {restaurantSettings.name || "RESTAURANT"}
            </h1>
          </div>

          {/* RESTAURANT INFO */}
          <div className="text-center text-xs mb-1">
            {restaurantSettings.address && (
              <div className="mb-0.5">{restaurantSettings.address}</div>
            )}
            {restaurantSettings.phone && (
              <div className="mb-0.5">Ph: {restaurantSettings.phone}</div>
            )}
            {restaurantSettings.gstin && (
              <div className="text-[10px]">GSTIN: {restaurantSettings.gstin}</div>
            )}
          </div>

          {/* ORDER DETAILS */}
          <div className="border-b border-dashed border-black pb-1 mb-1">
            <div className="text-xs">
              <div>Bill #: {billNumber}</div>
              <div>Date: {displayDate} {displayTime}</div>
              <div>Table: {tableName} | Persons: {persons}</div>
            </div>
          </div>

          {/* ITEMS LIST - Dynamic Width with Perfect Alignment */}
          <div className="mb-1">
            {items.map((item, index) => {
              const itemTotal = item.price * item.quantity;
              const itemDiscount = item.discountAmount || 0;
              const itemFinalAmount = itemTotal - itemDiscount;

              return (
                <div key={item.id} className="mb-0.5">
                  <div className="flex justify-between items-start text-xs">
                    <div className="flex-1 pr-1">
                      <div className="font-medium break-words leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-600">
                        {item.quantity}x ₹{formatAmount(item.price)}
                        {itemDiscount > 0 && (
                          <span className="text-red-600 ml-1">
                            (Disc: -₹{formatAmount(itemDiscount)})
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <div className="text-[10px] text-gray-600 italic">
                          Note: {item.note}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-bold whitespace-nowrap">
                      ₹{formatAmount(itemFinalAmount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* ADDITIONAL CHARGES */}
          {additionalCharges.length > 0 && (
            <div className="mb-1 border-t border-dashed border-black pt-0.5">
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex justify-between text-xs">
                  <span>{charge.name}:</span>
                  <span>+₹{formatAmount(charge.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* TOTAL SECTION */}
          <div className="border-t-2 border-black pt-1 mt-1">
            <div className="space-y-0.5 text-xs mb-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{formatAmount(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-₹{formatAmount(discountAmount)}</span>
                </div>
              )}
              {cgst > 0 && (
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span>₹{formatAmount(cgst)}</span>
                </div>
              )}
              {sgst > 0 && (
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span>₹{formatAmount(sgst)}</span>
                </div>
              )}
              {additionalTotal > 0 && (
                <div className="flex justify-between">
                  <span>Additional:</span>
                  <span>+₹{formatAmount(additionalTotal)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-black pt-0.5">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>TOTAL:</span>
                <span>₹{formatAmount(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* QR CODE */}
          {restaurantSettings.qrCode && (
            <div className="text-center my-1 border-t border-dashed border-black pt-1">
              <div className="inline-block border border-black p-0.5">
                <img
                  src={restaurantSettings.qrCode}
                  alt="QR Code"
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
          )}

          {/* THANK YOU */}
          <div className="text-center text-sm font-bold border-t border-black pt-1 mt-1">
            THANK YOU
          </div>

          {/* FOOTER */}
          <div className="text-center text-[10px] mt-0.5">
            <div>Visit Again!</div>
          </div>
        </div>
      </div>

      {/* Thermal Printer Safe CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');

        @media print {
          @page {
            size: auto;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: 'Courier New', 'Roboto Mono', 'Monaco', monospace;
          }

          body * {
            visibility: hidden;
          }

          #bill-content,
          #bill-content * {
            visibility: visible;
            font-family: 'Courier New', 'Roboto Mono', 'Monaco', monospace !important;
          }

          #bill-content {
            position: absolute;
            left: 0;
            top: 0;
            width: auto;
            min-width: 48mm;
            max-width: 80mm;
            padding: 1mm;
            background: white;
            box-shadow: none;
            font-size: 12px;
            line-height: 1.1;
            letter-spacing: 0.3px;
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

          /* Thermal printer optimizations */
          #bill-content {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum";
          }

          /* Ensure consistent spacing */
          #bill-content * {
            box-sizing: border-box;
          }

          /* Prevent content from breaking across pages */
          #bill-content {
            page-break-inside: avoid;
          }
        }

        /* Web view styles */
        #bill-content {
          font-family: 'Courier New', 'Roboto Mono', 'Monaco', monospace;
          font-size: 12px;
          line-height: 1.1;
          letter-spacing: 0.3px;
        }
      `}</style>
    </div>
  );
}