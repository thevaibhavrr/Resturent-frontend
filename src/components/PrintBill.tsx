import React from "react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Bluetooth,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { printCommands, type BillData } from "../utils/commands/printCommands";
import { BluetoothPrinterStatus } from "./BluetoothPrinterStatus";

// Type declarations for Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth?: any;
  }
}

interface PrintBillProps {
  billNumber: string;
  tableName: string;
  persons: number;
  items: import("../utils/commands/printCommands").BillItem[];
  additionalCharges: import("../utils/commands/printCommands").AdditionalCharge[];
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
  const [printAttempted, setPrintAttempted] = useState(false);
  const [showPrintAgain, setShowPrintAgain] = useState(false);
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [billHTML, setBillHTML] = useState<string>("");

  // Create bill data object
  const billData: BillData = {
    billNumber,
    tableName,
    persons,
    items,
    additionalCharges,
    discountAmount,
    cgst,
    sgst,
    grandTotal,
  };

  useEffect(() => {
    const loadBillPreview = async () => {
        try {
        const html = await printCommands.getBillPreviewHTML(billData);
        setBillHTML(html);
        } catch (error) {
        console.error("Error loading bill preview:", error);
        toast.error("Failed to load bill preview");
      }
    };
    loadBillPreview();
  }, [billData]);

  const handlePrint = async (useBluetooth: boolean = false) => {
    setPrintAttempted(true);

    try {
      if (useBluetooth) {
        setIsBluetoothPrinting(true);
        await printCommands.printBillViaBluetooth(billData);
      } else {
        await printCommands.printBillToPDF(billData, "bill-content");
      }

      // Show print again button after a delay
      setTimeout(() => {
        setShowPrintAgain(true);
      }, 1000);
    } catch (error) {
      console.error("Error printing bill:", error);
      toast.error("Failed to print bill");
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handlePrintAgain = (useBluetooth: boolean = false) => {
    handlePrint(useBluetooth);
    if (!useBluetooth) {
      toast.success("Print dialog opened. Please confirm to print.");
    }
  };

  useEffect(() => {
    // Auto print on mount (regular print, not Bluetooth)
    const timer = setTimeout(() => {
      handlePrint(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Action Buttons - Hidden on print */}
      <div className="print:hidden p-4 border-b bg-card">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Bill
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
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Printing via Bluetooth...</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {navigator.bluetooth && (
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

        {navigator.bluetooth && (
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
          dangerouslySetInnerHTML={{ __html: billHTML }}
        />
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
