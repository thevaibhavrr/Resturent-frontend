import React, { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Printer, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { markKotsAsPrinted } from "../api/tableDraftApi";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";
import { getRestaurantPrinterAddress } from "../config/bluetoothPrinter";
import { getKotPrinterDimensions, getPrintContainerStyles, getPrinterWidthFromStorage } from "../utils/printerUtils";

// Declare global interface for mobile app communication
declare global {
  interface Window {
    MOBILE_CHANNEL?: {
      postMessage: (message: string) => void;
    };
  }
}

interface PrintKotPopupProps {
  tableName: string;
  persons: number;
  printData: {
    unprintedKots: any[];
    kotIds: string[];
  };
  onClose: () => void;
  tableId: string | number;
  user: any;
}

export function PrintKotPopup({
  tableName,
  persons,
  printData,
  onClose,
  tableId,
  user,
}: PrintKotPopupProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printAttempted, setShowPrintAgain] = useState(false);
  const kotContentRef = useRef<HTMLDivElement>(null);

  // Get KOT printer width from localStorage
  const kotPrinterWidth = getPrinterWidthFromStorage(user, 'kot', 2);
  const printerDimensions = getKotPrinterDimensions(kotPrinterWidth);

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get Bluetooth printer settings with fallback and restaurant-specific mapping
  // const getBluetoothPrinterSettings = () => {
  //   if (!user?.restaurantId) {
  //     console.log('PrintKotPopup: No user or restaurantId');
  //     return null;
  //   }

  //   const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
  //   console.log('PrintKotPopup: Loading Bluetooth config with key:', key); 
  //   const stored = localStorage.getItem(key);

  //   let config = null;

  //   if (stored) {
  //     try {
  //       config = JSON.parse(stored);
  //       console.log('PrintKotPopup: Loaded Bluetooth config:', config);
  //     } catch (error) {
  //       console.warn('PrintKotPopup: Error parsing Bluetooth printer settings:', error);
  //       config = null;
  //     }
  //   }

  //   // If no config or config doesn't have address, check for restaurant-specific mapping
  //   const restaurantPrinterAddress = getRestaurantPrinterAddress(user.restaurantId);
  //   if (restaurantPrinterAddress) {
  //     if (!config) {
  //       config = {
  //         name: "Restaurant Printer",
  //         address: restaurantPrinterAddress,
  //         enabled: true,
  //         serviceUuid: "0000ff00-0000-1000-8000-00805f9b34fb",
  //         characteristicUuid: "0000ff02-0000-1000-8000-00805f9b34fb"
  //       };
  //       console.log(`PrintKotPopup: Created restaurant-specific config:`, config);
  //     } else if (!config.address || config.address !== restaurantPrinterAddress) {
  //       config = {
  //         ...config,
  //         address: restaurantPrinterAddress,
  //         enabled: true
  //       };
  //       console.log(`PrintKotPopup: Updated config with restaurant address:`, restaurantPrinterAddress);
  //     }
  //   }

  //   return config;
  // };
  // In PrintKotPopup.tsx, update the getBluetoothPrinterSettings function
const getBluetoothPrinterSettings = () => {
  if (!user?.restaurantId) {
    console.log('PrintKotPopup: No user or restaurantId');
    return null;
  }

  // First try to get printer settings from restaurant settings
  const restaurantSettingsKey = `restaurantSettings_${user.restaurantId}`;
  const restaurantSettings = localStorage.getItem(restaurantSettingsKey);
  
  if (restaurantSettings) {
    try {
      const settings = JSON.parse(restaurantSettings);
      if (settings.kotBluetoothPrinter?.address) {
        console.log('Using KOT printer settings from restaurant settings');
        return {
          name: "KOT Printer",
          address: settings.kotBluetoothPrinter.address,
          enabled: true,
          serviceUuid:  "0000ff00-0000-1000-8000-00805f9b34fb",
          characteristicUuid: "0000ff02-0000-1000-8000-00805f9b34fb"
        };
      }
    } catch (error) {
      console.warn('Error parsing restaurant settings:', error);
    }
  }

  // Fallback to old method if no restaurant settings found
  const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
  console.log('PrintKotPopup: Falling back to legacy Bluetooth config with key:', key);
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const config = JSON.parse(stored);
      console.log('PrintKotPopup: Loaded legacy Bluetooth config:', config);
      return config;
    } catch (error) {
      console.warn('PrintKotPopup: Error parsing legacy Bluetooth printer settings:', error);
    }
  }

  // Final fallback to restaurant-specific mapping
  const restaurantPrinterAddress = getRestaurantPrinterAddress(user.restaurantId);
  if (restaurantPrinterAddress) {
    const fallbackConfig = {
      name: "Restaurant KOT Printer",
      address: restaurantPrinterAddress,
      enabled: true,
      serviceUuid: "0000ff00-0000-1000-8000-00805f9b34fb",
      characteristicUuid: "0000ff02-0000-1000-8000-00805f9b34fb"
    };
    console.log('PrintKotPopup: Using restaurant-specific fallback config:', fallbackConfig);
    return fallbackConfig;
  }

  console.log('PrintKotPopup: No printer configuration found');
  return null;
};

  // Auto-print when component mounts
  useEffect(() => {
    const timer = setTimeout(() => handlePrint(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = async () => {
    setShowPrintAgain(true);
    setIsPrinting(true);

    try {
      // Mark KOTs as printed in the database first
      if (user?.restaurantId) {
        console.log("📝 Marking KOTs as printed...");
        await markKotsAsPrinted(tableId.toString(), user.restaurantId, printData.kotIds);
        console.log("✅ KOTs marked as printed");
      }

      // Get the KOT content element
      const kotElement = document.getElementById("kot-print-content");
      if (!kotElement) {
        toast.error("KOT content not found");
        setIsPrinting(false);
        return;
      }

      console.log("🖼️ Converting to canvas...");
      // Convert to canvas with high quality
      const canvas = await html2canvas(kotElement, {
        scale: 1.9,
        backgroundColor: "#ffffff",
        allowTaint: true,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      console.log("✅ Canvas created successfully");

      // Get Bluetooth printer settings
      const bluetoothSettings = getBluetoothPrinterSettings();



      // Read global restaurant settings (non-restaurant-specific) and prefer explicit kotPrinterAddress
      const restaurantSettingsRaw = localStorage.getItem("restaurantSettings");
      let globalSettings: any = null;
      if (restaurantSettingsRaw) {
        try {
          globalSettings = JSON.parse(restaurantSettingsRaw);
        } catch (err) {
          console.error("Error parsing restaurantSettings:", err);
          globalSettings = null;
        }
      }

      // Prefer explicit top-level kotPrinterAddress, fall back to kotBluetoothPrinter.address, then to bluetoothSettings
      const kotPrinterAddress =
        globalSettings?.kotPrinterAddress ||
        globalSettings?.kotBluetoothPrinter?.address ||
        bluetoothSettings?.address ||
        null;

      const deviceMacAddress = kotPrinterAddress || bluetoothSettings?.address;
      const deviceName = bluetoothSettings?.name || "Restaurant Printer";

      console.log("🖨️ Bluetooth Settings:", bluetoothSettings);
      console.log("📱 Device MAC Address:", deviceMacAddress);

      if (window.MOBILE_CHANNEL) {
        // Mobile app printing
        console.log("📱 Sending to mobile app...");
        window.MOBILE_CHANNEL.postMessage(
          JSON.stringify({
            event: "flutterPrint",
            deviceMacAddress: deviceMacAddress,
            deviceName: deviceName,
            imageBase64: imgData.replace("data:image/png;base64,", ""),
          })
        );
        
        // Show toast with machine address
        if (deviceMacAddress) {
          toast.success(`Print sent to: ${deviceName} (${deviceMacAddress})`);
        } else {
          toast.success(`Print sent to device: ${deviceName}`);
        }
      } else {
        // Browser printing
        console.log("🖨️ Opening print window...");
        const printWindow = window.open("", "", "width=800,height=600");
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>KOT</title>
                <style>
                  @page { size: ${printerDimensions.widthMm}mm auto; margin: 5mm; }
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
            
            // Show toast with machine address
            if (deviceMacAddress) {
              toast.success(`KOT sent to:--- ${deviceName} (${deviceMacAddress})`);
            } else {
              toast.success(`KOT sent to printer: ${deviceName}`);
            }
          }, 250);
        }
      }

      setIsPrinting(false);
    } catch (error) {
      console.error("❌ Print error:", error);
      toast.error("Failed to print KOT");
      setIsPrinting(false);
    }
  };

  return (
    <>
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          inset: "0",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: "600", margin: "0" }}>
            Print KOT
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          {/* KOT Content - Dynamic width based on printer settings */}
          <div
            id="kot-print-content"
            className="bg-white text-black"
            style={{
              ...getPrintContainerStyles(printerDimensions),
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
            ref={kotContentRef}
          >
            {/* Header */}
            <div
              style={{
                textAlign: "center",
                borderBottom: "2px solid black",
                paddingBottom: `${printerDimensions.padding * 0.5}px`,
                marginBottom: `${printerDimensions.padding * 0.5}px`,
              }}
            >
              <p className="print-title" style={{ fontSize: `${printerDimensions.fontSize.title}px`, margin: "2px 0", fontWeight: "bold" }}>
                Table: {tableName} • Persons: {persons}
              </p>
              <p style={{ fontSize: `${printerDimensions.fontSize.small}px`, margin: "2px 0", color: "#666", fontWeight:"bold" }}>
                {currentDate} {currentTime}
              </p>
            </div>

            {/* KOTs Table */}
            <div style={{ borderBottom: "1px dashed black", paddingBottom: `${printerDimensions.padding * 0.5}px`, marginBottom: `${printerDimensions.padding * 0.3}px` }}>
              <table style={{ width: "100%", fontSize: `${printerDimensions.fontSize.normal}px`, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ccc" }}>
                    <th style={{ textAlign: "center", padding: `${printerDimensions.padding * 0.25}px`, width: "30px" }}>Qty</th>
                    <th style={{ textAlign: "left", padding: `${printerDimensions.padding * 0.25}px` }}>Item</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.unprintedKots.map((kot, kotIndex) => { 
                    console.log("kot-=-=-=-=", kot);
                    // Only include items with positive quantity (skip removed items)
                    const visibleItems = (kot.items || []).filter((it: any) => Number(it.quantity) > 0);
                    // console.log("visibleItems-=-=-=-=", visibleItems);
                    if (!visibleItems || visibleItems.length === 0) {
                      return null; // skip this KOT entirely if no visible items
                    }
 
                    return (
                      <React.Fragment key={kot.kotId}>
                        {/* KOT Header - always show KOT number */}
                        <tr>
                          <td colSpan={2} style={{ textAlign: "center", padding: `${printerDimensions.padding * 0.25}px`, borderTop: printData.unprintedKots.length > 1 ? "1px solid black" : "none", fontWeight: "bold", fontSize: `${printerDimensions.fontSize.small}px` }}>
                            K.O.T. {kot.kotId}
                          </td>
                        </tr>

                        {/* Items (only positive quantities) */}
                        {visibleItems.map((item: any, itemIndex: number) => (
                          <tr key={itemIndex} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ textAlign: "center", padding: `${printerDimensions.padding * 0.25}px`, fontWeight: "bold", fontSize: `${printerDimensions.fontSize.title}px` }}>
                              {item.quantity}
                            </td>
                            <td style={{ textAlign: "left", padding: `${printerDimensions.padding * 0.25}px` }}>
                              <div style={{ fontSize: `${printerDimensions.fontSize.title}px`, fontWeight: "bold" }}>{item.name}</div>
                              {/* Spicy Level */}
                              {item.spiceLevel && item.spiceLevel > 0 && (
                                <div style={{ fontSize: `${printerDimensions.fontSize.normal}px`, color: "#d97706", fontWeight: "bold", marginTop: "2px" }}>
                                  {item.spicePercent ? `${item.spicePercent}% Spicy` : `${"🌶️".repeat(item.spiceLevel)}`}
                                </div>
                              )}
                              {/* Notes */}
                              {item.note && (
                                <div className="print-small" style={{ fontSize: `${printerDimensions.fontSize.small}px`, color: "#6b7280", fontStyle: "italic", marginTop: "2px" }}>
                                  Note: {item.note}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            
          </div>
        </div>

        {/* Footer Buttons */}
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: "12px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {printAttempted && !isPrinting && (
              <>
                <CheckCircle2 style={{ width: "16px", height: "16px", color: "#10b981" }} />
                <span style={{ fontSize: "13px", color: "#666" }}>
                  {printData.unprintedKots.length} KOT{printData.unprintedKots.length > 1 ? "s" : ""} sent to printer
                </span>
              </>
            )}
            {isPrinting && (
              <>
                <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite", color: "#3b82f6" }} />
                <span style={{ fontSize: "13px", color: "#666" }}>Printing...</span>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                fontWeight: "600",
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                cursor: isPrinting ? "not-allowed" : "pointer",
                opacity: isPrinting ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Printer style={{ width: "16px", height: "16px" }} />
              {printAttempted ? "Print Again" : "Print"}
            </Button>
            <Button
              onClick={onClose}
              disabled={isPrinting}
              variant="outline"
              style={{
                padding: "8px 16px",
                fontWeight: "600",
                borderRadius: "6px",
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
