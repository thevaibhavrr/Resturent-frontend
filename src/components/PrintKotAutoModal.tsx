import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markKotsAsPrinted } from "../api/tableDraftApi";

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

      // Mark KOTs as printed in the database
      if (user?.restaurantId) {
        await markKotsAsPrinted(tableId.toString(), user.restaurantId, printData.kotIds);
      }

      // Give a small delay to ensure marking is complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger browser print dialog
      window.print();

      toast.success(
        `Printing ${printData.unprintedKots.length} KOT${
          printData.unprintedKots.length > 1 ? "s" : ""
        }...`
      );

      setIsPrinting(false);
    } catch (error) {
      console.error("Error printing:", error);
      toast.error("Failed to mark KOTs as printed");
      setIsPrinting(false);
    }
  };

  // Handle print again
  const handlePrintAgain = async () => {
    try {
      setIsPrinting(true);

      // Trigger browser print dialog
      window.print();

      toast.success(
        `Re-printing ${printData.unprintedKots.length} KOT${
          printData.unprintedKots.length > 1 ? "s" : ""
        }...`
      );

      setIsPrinting(false);
    } catch (error) {
      console.error("Error printing:", error);
      toast.error("Failed to print");
      setIsPrinting(false);
    }
  };

  return (
    <>
      {/* Print Preview Hidden (for print styles) */}
      <div id="print-kot-preview" style={{ display: "none" }}>
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
          {/* KOT Header */}
          <div style={{ textAlign: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid #000" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>
              KITCHEN ORDER TICKET (KOT)
            </h3>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
              Table: <span style={{ fontWeight: "bold" }}>{tableName}</span>
            </p>
            <p style={{ fontSize: "14px", color: "#666" }}>
              Persons: <span style={{ fontWeight: "bold" }}>{persons}</span>
            </p>
            <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
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
            <div key={kot.kotId} style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #ccc" }}>
              {printData.unprintedKots.length > 1 && (
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    marginBottom: "12px",
                    backgroundColor: "#f0f0f0",
                    padding: "8px",
                    borderRadius: "4px",
                  }}
                >
                  KOT #{kotIndex + 1} -{" "}
                  {new Date(kot.timestamp).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              )}
              <div>
                {kot.items?.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} style={{ fontSize: "13px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "500" }}>{item.name}</span>
                      <span style={{ fontWeight: "bold" }}>
                        {Math.abs(item.quantity)}
                      </span>
                    </div>
                    {item.quantity < 0 && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#dc2626",
                          fontWeight: "bold",
                        }}
                      >
                        - REMOVED
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              fontSize: "11px",
              color: "#666",
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "2px solid #000",
            }}
          >
            <p>Print generated at {new Date().toLocaleString("en-IN")}</p>
            <p style={{ marginTop: "4px" }}>DRAFT - For Kitchen Use Only</p>
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
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          * {
            display: none;
          }
          #print-kot-preview {
            display: block !important;
            margin: 0;
            padding: 0;
          }
        }
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
