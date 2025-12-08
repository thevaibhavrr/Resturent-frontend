import React, { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Printer, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { markKotsAsPrinted } from "../api/tableDraftApi";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";
import { getRestaurantPrinterAddress } from "../config/bluetoothPrinter";

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
  const getBluetoothPrinterSettings = () => {
    if (!user?.restaurantId) {
      console.log('PrintKotPopup: No user or restaurantId');
      return null;
    }

    const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
    console.log('PrintKotPopup: Loading Bluetooth config with key:', key);
    const stored = localStorage.getItem(key);

    let config = null;

    if (stored) {
      try {
        config = JSON.parse(stored);
        console.log('PrintKotPopup: Loaded Bluetooth config:', config);
      } catch (error) {
        console.warn('PrintKotPopup: Error parsing Bluetooth printer settings:', error);
        config = null;
      }
    }

    // If no config or config doesn't have address, check for restaurant-specific mapping
    const restaurantPrinterAddress = getRestaurantPrinterAddress(user.restaurantId);
    if (restaurantPrinterAddress) {
      if (!config) {
        config = {
          name: "Restaurant Printer",
          address: restaurantPrinterAddress,
          enabled: true,
          serviceUuid: "0000ff00-0000-1000-8000-00805f9b34fb",
          characteristicUuid: "0000ff02-0000-1000-8000-00805f9b34fb"
        };
        console.log(`PrintKotPopup: Created restaurant-specific config:`, config);
      } else if (!config.address || config.address !== restaurantPrinterAddress) {
        config = {
          ...config,
          address: restaurantPrinterAddress,
          enabled: true
        };
        console.log(`PrintKotPopup: Updated config with restaurant address:`, restaurantPrinterAddress);
      }
    }

    return config;
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
      const deviceMacAddress = bluetoothSettings?.address;
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
            
            // Show toast with machine address
            if (deviceMacAddress) {
              toast.success(`KOT sent to: ${deviceName} (${deviceMacAddress})`);
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
          {/* KOT Content - 58mm width for thermal printer */}
          <div
            id="kot-print-content"
            className="bg-white text-black"
            style={{
              width: "58mm",
              maxWidth: "58mm",
              boxSizing: "border-box",
              padding: "12px",
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
                paddingBottom: "8px",
                marginBottom: "8px",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 4px 0" }}>
                KITCHEN ORDER TICKET
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0", fontWeight: "bold" }}>
                Table: {tableName} • Persons: {persons}
              </p>
              <p style={{ fontSize: "10px", margin: "2px 0", color: "#666" }}>
                {currentDate} {currentTime}
              </p>
            </div>

            {/* KOTs Table */}
            <div style={{ borderBottom: "2px dashed black", paddingBottom: "8px", marginBottom: "8px" }}>
              <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ccc" }}>
                    <th style={{ textAlign: "center", padding: "4px", width: "40px" }}>Qty</th>
                    <th style={{ textAlign: "left", padding: "4px" }}>Item</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.unprintedKots.map((kot, kotIndex) => (
                    <React.Fragment key={kot.kotId}>
                      {/* KOT Header if multiple */}
                      {printData.unprintedKots.length > 1 && (
                        <tr>
                          <td colSpan={2} style={{ textAlign: "center", padding: "4px", borderTop: "1px solid black", fontWeight: "bold", fontSize: "10px" }}>
                            KOT #{kotIndex + 1}
                          </td>
                        </tr>
                      )}

                      {/* Items */}
                      {kot.items?.map((item: any, itemIndex: number) => (
                        <tr key={itemIndex} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ textAlign: "center", padding: "4px", fontWeight: "bold", fontSize: "12px" }}>
                            {Math.abs(item.quantity)}
                          </td>
                          <td style={{ textAlign: "left", padding: "4px" }}>
                            <div style={{ fontSize: "11px" }}>{item.name}</div>
                            {item.quantity < 0 && (
                              <div style={{ fontSize: "9px", color: "#dc2626", fontWeight: "bold" }}>
                                REMOVED
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", fontSize: "9px", color: "#666", borderTop: "2px solid black", paddingTop: "4px" }}>
              <p style={{ margin: "0" }}>{new Date().toLocaleString("en-IN")}</p>
              <p style={{ margin: "2px 0 0 0" }}>DRAFT - For Kitchen Use</p>
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
