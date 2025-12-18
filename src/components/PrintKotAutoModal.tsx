import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markKotsAsPrinted } from "../api/tableDraftApi";
import { getKotPrinterDimensions, getPrintStyles, getPrintContainerStyles, getPrinterWidthFromStorage } from "../utils/printerUtils";

interface PrintKotAutoModalProps {
  tableName: string;
  persons: number;
  printData: {
    unprintedKots: any[];
    kotIds: string[];
  };
  onClose: () => void;
  onPrintComplete: () => void;
  tableId: string | number;
  user: any;
}

export function PrintKotAutoModal({
  tableName,
  persons,
  printData,
  onClose,
  onPrintComplete,
  tableId,
  user,
}: PrintKotAutoModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);

  // Get KOT printer width from localStorage
  const kotPrinterWidth = getPrinterWidthFromStorage(user, 'kot', 2);
  const printerDimensions = getKotPrinterDimensions(kotPrinterWidth);

  // Auto-print when modal opens
  useEffect(() => {
    if (!autoStarted && printData) {
      setAutoStarted(true);
      handleAutoPrint();
    }
  }, [printData, autoStarted]);

  const handleAutoPrint = async () => {
    try {
      setIsPrinting(true);
      console.log("🖨️ Starting auto-print...");

      // Mark KOTs as printed in the database
      if (user?.restaurantId) {
        console.log("📝 Marking KOTs as printed in database...");
        await markKotsAsPrinted(tableId.toString(), user.restaurantId, printData.kotIds);
        console.log("✅ KOTs marked as printed");
      }

      // Give a small delay to ensure marking is complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify print preview element exists
      const printElement = document.getElementById("print-kot-preview");
      console.log("🔍 Print element found:", !!printElement);
      if (printElement) {
        console.log("📋 Print element content:", printElement.innerHTML.substring(0, 100));
      }

      // Trigger browser print dialog
      console.log("🖨️ Triggering window.print()...");
      window.print();

      toast.success(
        `Printing ${printData.unprintedKots.length} KOT${
          printData.unprintedKots.length > 1 ? "s" : ""
        }...`
      );

      setIsPrinting(false);
    } catch (error) {
      console.error("❌ Error printing:", error);
      toast.error("Failed to mark KOTs as printed");
      setIsPrinting(false);
    }
  };

  // Handle print again
  const handlePrintAgain = async () => {
    try {
      setIsPrinting(true);
      console.log("🖨️ Starting re-print...");

      // Trigger browser print dialog
      console.log("🖨️ Triggering window.print()...");
      window.print();

      toast.success(
        `Re-printing ${printData.unprintedKots.length} KOT${
          printData.unprintedKots.length > 1 ? "s" : ""
        }...`
      );

      setIsPrinting(false);
    } catch (error) {
      console.error("❌ Error printing:", error);
      toast.error("Failed to print");
      setIsPrinting(false);
    }
  };

  return (
    <>
      {/* Print Preview - Visible for printing only */}
      <div id="print-kot-preview" style={{ width: "100%", position: "fixed", top: "-9999px", left: "-9999px" }}>
        <div style={getPrintContainerStyles(printerDimensions)}>
          {/* KOT Header */}
          <div style={{ textAlign: "center", marginBottom: `${printerDimensions.padding * 1.5}px`, paddingBottom: `${printerDimensions.padding}px`, borderBottom: "2px solid #000" }}>
            <h3 className="print-title" style={{ fontSize: `${printerDimensions.fontSize.title}px`, fontWeight: "bold", margin: "0 0 8px 0" }}>
              KITCHEN ORDER TICKET
            </h3>
            <p style={{ fontSize: `${printerDimensions.fontSize.normal}px`, margin: "4px 0", fontWeight: "bold" }}>
              Table: {tableName}
            </p>
            <p style={{ fontSize: `${printerDimensions.fontSize.normal}px`, margin: "4px 0" }}>
              Persons: {persons}
            </p>
            <p className="print-small" style={{ fontSize: `${printerDimensions.fontSize.small}px`, color: "#666", margin: "4px 0" }}>
              {new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* KOTs */}
          {printData.unprintedKots.map((kot, kotIndex) => (
            <div key={kot.kotId} style={{ marginBottom: `${printerDimensions.padding}px`, paddingBottom: `${printerDimensions.padding * 0.75}px`, borderBottom: "1px solid #ddd" }}>
              {printData.unprintedKots.length > 1 && (
                <div style={{ fontSize: `${printerDimensions.fontSize.small}px`, fontWeight: "bold", marginBottom: "8px", backgroundColor: "#f0f0f0", padding: "4px" }}>
                  KOT #{kotIndex + 1} - {new Date(kot.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
              )}
              <div>
                {kot.items?.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} style={{ fontSize: `${printerDimensions.fontSize.normal}px`, marginBottom: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: "bold" }}>{Math.abs(item.quantity)}</span>
                    </div>
                    {item.quantity < 0 && (
                      <div className="print-tiny" style={{ fontSize: `${printerDimensions.fontSize.tiny}px`, color: "#dc2626", fontWeight: "bold" }}>REMOVED</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div style={{ textAlign: "center", fontSize: `${printerDimensions.fontSize.tiny}px`, color: "#666", marginTop: `${printerDimensions.padding}px`, paddingTop: `${printerDimensions.padding * 0.75}px`, borderTop: "2px solid #000" }}>
            <p style={{ margin: "0" }}>{new Date().toLocaleString("en-IN")}</p>
            <p style={{ margin: "4px 0 0 0" }}>DRAFT - For Kitchen Use Only</p>
          </div>
        </div>
      </div>

      {/* Loading/Status Modal */}
      <div
        style={{
          position: "fixed",
          inset: "0",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            maxWidth: "450px",
            width: "100%",
            margin: "0 16px",
            overflow: "hidden",
            boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: "600", margin: "0" }}>
              KOT Print Status
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#9ca3af",
                padding: "0",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: "32px", textAlign: "center" }}>
            {isPrinting ? (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <Loader2
                    style={{
                      width: "48px",
                      height: "48px",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto",
                      color: "#3b82f6",
                    }}
                  />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                  Printing...
                </h3>
                <p style={{ fontSize: "14px", color: "#666", marginBottom: "0" }}>
                  Please wait while the KOT is being sent to the printer
                </p>
              </>
            ) : (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <Printer
                    style={{
                      width: "48px",
                      height: "48px",
                      margin: "0 auto",
                      color: "#10b981",
                    }}
                  />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                  Print Successful ✓
                </h3>
                <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
                  {printData.unprintedKots.length} KOT
                  {printData.unprintedKots.length > 1 ? "s" : ""} sent to printer
                </p>
              </>
            )}
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              padding: "20px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              gap: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            <Button
              onClick={handlePrintAgain}
              disabled={isPrinting}
              style={{
                flex: 1,
                backgroundColor: "#3b82f6",
                color: "white",
                fontWeight: "600",
                padding: "10px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: isPrinting ? "not-allowed" : "pointer",
                opacity: isPrinting ? 0.6 : 1,
              }}
            >
              {isPrinting ? "Printing..." : "Print Again"}
            </Button>
            <Button
              onClick={onClose}
              disabled={isPrinting}
              variant="outline"
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "6px",
                fontWeight: "600",
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        ${getPrintStyles(printerDimensions)}

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
