import React, { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Printer, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { getCurrentUser, getRestaurantKey } from "../utils/auth";
import { getRestaurantPrinterAddress } from "../config/bluetoothPrinter";
import { settingsService } from "../utils/settingsService";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  discountAmount?: number;
}

interface AdditionalCharge {
  id: number;
  name: string;
  amount: number;
}

interface PrintBillPopupProps {
  billNumber: string;
  tableName: string;
  persons: number;
  items: BillItem[];
  additionalCharges: AdditionalCharge[];
  discountAmount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  billDate?: string;
  billTime?: string;
  onClose: () => void;
  user: any;
}

export function PrintBillPopup({
  billNumber,
  tableName,
  persons,
  items,
  additionalCharges,
  discountAmount,
  cgst,
  sgst,
  grandTotal,
  billDate,
  billTime,
  onClose,
  user,
}: PrintBillPopupProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printAttempted, setShowPrintAgain] = useState(false);
  const [restaurantSettings, setRestaurantSettings] = useState<any>({
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
  const billContentRef = useRef<HTMLDivElement>(null);

  const currentDate = billDate || new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const currentTime = billTime || new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Load restaurant settings
  useEffect(() => {
    const settings = settingsService.getSettings();
    if (settings) {
      setRestaurantSettings(settings);
    }
  }, []);

  // Get Bluetooth printer settings with fallback and restaurant-specific mapping
  const getBluetoothPrinterSettings = () => {
    if (!user?.restaurantId) {
      console.log('PrintBillPopup: No user or restaurantId');
      return null;
    }

    const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
    console.log('PrintBillPopup: Loading Bluetooth config with key:', key);
    const stored = localStorage.getItem(key);

    let config = null;

    if (stored) {
      try {
        config = JSON.parse(stored);
        console.log('PrintBillPopup: Loaded Bluetooth config:', config);
      } catch (error) {
        console.warn('PrintBillPopup: Error parsing Bluetooth printer settings:', error);
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
        console.log(`PrintBillPopup: Created restaurant-specific config:`, config);
      } else if (!config.address || config.address !== restaurantPrinterAddress) {
        config = {
          ...config,
          address: restaurantPrinterAddress,
          enabled: true
        };
        console.log(`PrintBillPopup: Updated config with restaurant address:`, restaurantPrinterAddress);
      }
    }

    return config;
  };

  // Auto-print when component mounts
  useEffect(() => {
    const timer = setTimeout(() => handlePrint(), 300);
    return () => clearTimeout(timer);
  }, []);

  const formatAmount = (amount: number): string => {
    const formatted = amount.toFixed(2);
    return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
  };

  const handlePrint = async () => {
    setShowPrintAgain(true);
    setIsPrinting(true);

    try {
      // Get the bill content element
      const billElement = document.getElementById("bill-print-content");
      if (!billElement) {
        toast.error("Bill content not found");
        setIsPrinting(false);
        return;
      }

      console.log("🖼️ Converting to canvas...");
      // Convert to canvas with high quality
      const canvas = await html2canvas(billElement, {
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
          toast.success(`Bill printed: ${deviceName} (${deviceMacAddress})`);
        } else {
          toast.success(`Bill printed to device: ${deviceName}`);
        }
      } else {
        // Browser printing
        console.log("🖨️ Opening print window...");
        const printWindow = window.open("", "", "width=800,height=600");
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Bill</title>
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
              toast.success(`Bill printed: ${deviceName} (${deviceMacAddress})`);
            } else {
              toast.success(`Bill printed to printer: ${deviceName}`);
            }
          }, 250);
        }
      }

      setIsPrinting(false);
    } catch (error) {
      console.error("❌ Print error:", error);
      toast.error("Failed to print bill");
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
            Print Bill
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
          {/* Bill Content - 58mm width for thermal printer */}
          <div
            id="bill-print-content"
            className="bg-white text-black"
            style={{
              width: "58mm",
              maxWidth: "58mm",
              boxSizing: "border-box",
              padding: "10px",
              paddingBottom:"20px",
              paddingRight:"15px",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
            ref={billContentRef}
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
              {restaurantSettings.logo && (
                <div style={{ marginBottom: "6px" }}>
                  <img
                    src={restaurantSettings.logo}
                    alt="Logo"
                    style={{ maxWidth: "50px", maxHeight: "50px", margin: "0 auto" , width:"100%",height:"100%" }}
                  />
                </div>
              )}
              <p style={{ fontSize: "14px", margin: "2px 0", fontWeight: "bold" }}>
                {restaurantSettings.name || "RESTAURANT"}
              </p>
              
              {/* <p style={{ fontSize: "12px", margin: "4px 0", fontWeight: "bold" }}>
#{billNumber}
              </p> */}
              <p style={{ fontSize: "13px", margin: "2px 0" }}>
                {currentDate} {currentTime}
              </p>
            </div>

            {/* Order Info */}
            <div style={{ borderBottom: "1px dashed black", paddingBottom: "8px", marginBottom: "8px" }}>
              <table style={{ width: "100%", fontSize: "13px",display:"flex" , justifyContent:"space-evenly" }}>
                <div>
                  <td>Table:</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>{tableName}</td>
                </div>
                <div>
                  <td>Persons:</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>{persons}</td>
                </div>
              </table>
            </div>

            {/* Items Table */}
            <div style={{ borderBottom: "1px dashed black", paddingBottom: "8px", marginBottom: "8px" }}>
              <table style={{ width: "100%", fontSize: "10px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ccc" }}>
                    <th style={{ textAlign: "left", padding: "2px" }}>Item</th>
                    <th style={{ textAlign: "center", padding: "2px", width: "30px" }}>Qty</th>
                    <th style={{ textAlign: "center", padding: "2px", width: "30px" }}>Price</th>
                    <th style={{ textAlign: "center", padding: "2px", width: "40px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #eee",fontSize:"14px" }}>
                      <td style={{ textAlign: "left", padding: "2px" }}>
                        <div>{item.name}</div>
                        {item.discountAmount > 0 && (
                          <div style={{ fontSize: "9px", color: "#ef4444" }}>
                            Disc: -₹{item.discountAmount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {item.quantity}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {item.price}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {(item.quantity * item.price - (item.discountAmount || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ borderBottom: "1px dashed black", paddingBottom: "8px", marginBottom: "8px" }}>
              <table style={{ width: "100%", fontSize: "11px" }}>
 
                  <tr style={{fontSize:"16px"}}>
                    <td>Subtotal:</td>
                    <td style={{ textAlign: "center" }}>
                      ₹{formatAmount(
                        items.reduce((sum, item) => {
                          const itemTotal = item.price * item.quantity;
                          const itemDiscount = item.discountAmount || 0;
                          return sum + itemTotal - itemDiscount;
                        }, 0)
                      )}
                    </td>
                  </tr>
                  {discountAmount > 0 && (
                    <tr style={{ color: "#ef4444",fontSize:"16px" }}>
                      <td>Total Discount:</td>
                      <td style={{ textAlign: "center" }}>-₹{formatAmount(discountAmount)}</td>
                    </tr>
                  )}
                  {additionalCharges.length > 0 && additionalCharges.map((charge) => (
                    <tr key={charge.id}>
                      <td>{charge.name}:</td>
                      <td style={{ textAlign: "center" }}>+₹{formatAmount(charge.amount)}</td>
                    </tr>
                  ))}

              </table>
            </div>

            {/* Grand Total */}
            <div style={{ textAlign: "center", paddingBottom: "8px", marginBottom: "8px" }}>
              <p style={{ fontSize: "18px", fontWeight: "bold", margin: "4px 0" }}>
                TOTAL: ₹{formatAmount(grandTotal)}
              </p>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", fontSize: "10px", color: "#666" }}>
              {restaurantSettings.qrCode && (
                <div style={{ marginBottom: "6px" }}>
                  <img
                    src={restaurantSettings.qrCode}
                    alt="QR Code"
                    style={{ width: "35mm", height: "35mm", margin: "0 auto" }}
                  />
                </div>
              )}
              {restaurantSettings.address && (
                <p style={{ fontSize: "10px", margin: "2px 0", color: "#666" }}>
                  {restaurantSettings.address}
                </p>
              )}
              {restaurantSettings.phone && (
                <p style={{ margin: "2px 0" }}>Ph: {restaurantSettings.phone}</p>
              )}
              {restaurantSettings.website && (
                <p style={{ margin: "2px 0" }}>{restaurantSettings.website}</p>
              )}
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
                  Bill sent to printer
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
