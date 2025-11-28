// import { useEffect, useState } from "react";
// import { Button } from "./ui/button";
// import { ArrowLeft, CheckCircle2, Printer } from "lucide-react";
// import { toast } from "sonner";
// import html2canvas from "html2canvas";

// interface DraftBillItem {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
//   spiceLevel?: number;
//   spicePercent?: number;
//   isJain?: boolean;
//   note?: string;
// }

// interface PrintDraftBillProps {
//   tableName: string;
//   persons: number;
//   items: DraftBillItem[];
//   onBack: () => void;
// }

// declare global {
//   interface Window {
//     MOBILE_CHANNEL?: {
//       postMessage: (message: string) => void;
//     };
//   }
// }

// export function PrintDraftBill({ tableName, persons, items, onBack }: PrintDraftBillProps) {
//   const currentDate = new Date().toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   });
//   const currentTime = new Date().toLocaleTimeString("en-IN", {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   const [printAttempted, setPrintAttempted] = useState(false);
//   const [showPrintAgain, setShowPrintAgain] = useState(false);
//   const [pdfUrl, setPdfUrl] = useState<string | null>(null);

//   const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

//   const handlePrint = async () => {
//     setPrintAttempted(true);

//     try {
//       const billElement = document.getElementById("draft-bill-content");
//       if (!billElement) {
//         toast.error("Draft bill content not found");
//         return;
//       }

//       // Capture the bill content as canvas for 58mm thermal printer
//       const canvas = await html2canvas(billElement, {
//         scale: 1.1, // Higher scale for crisp thermal printing
//       });

//       const imgData = canvas.toDataURL("image/png", 1.0); // Maximum quality

//       // Check if running in Flutter webview
//       if (window.MOBILE_CHANNEL) {
//         // Send print request to Flutter
//         window.MOBILE_CHANNEL.postMessage(
//           JSON.stringify({
//             event: "flutterPrint",
//             deviceMacAddress: "66:32:B1:BE:4E:AF", // TODO: Get device MAC address from API
//             imageBase64: imgData.replace("data:image/png;base64,", ""), // Remove data URL prefix
//           })
//         );

//         toast.success("Print request sent to Flutter!");
//       } else {
//         // Fallback for web browsers - use native print dialog
//         const printWindow = window.open();
//         if (printWindow) {
//           printWindow.document.write(`
//             <html>
//               <head>
//                 <title>Draft Bill</title>
//                 <style>
//                   @page { size: 58mm auto; margin: 0; }
//                   body { margin: 0; padding: 0; }
//                   img { width: 100%; height: auto; display: block; }
//                 </style>
//               </head>
//               <body>
//                 <img src="${imgData}" />
//               </body>
//             </html>
//           `);
//           printWindow.document.close();
//           setTimeout(() => {
//             printWindow.print();
//             printWindow.close();
//           }, 250);
//         }
//         toast.success("Print dialog opened. Please confirm to print.");
//       }

//       // Show print again button after a delay
//       setTimeout(() => {
//         setShowPrintAgain(true);
//       }, 1000);
//     } catch (error) {
//       console.error("Error generating image:", error);
//       toast.error("Failed to generate draft bill image");
//     }
//   };

//   const handlePrintAgain = () => {
//     handlePrint();
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       handlePrint();
//     }, 300);
//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div className="min-h-screen bg-background">
//       <div className="print:hidden p-4 border-b bg-card">
//         <div className="flex items-center justify-between gap-4">
//           <Button variant="outline" onClick={onBack} className="gap-2">
//             <ArrowLeft className="w-4 h-4" />
//             Back
//           </Button>

//           <div className="flex items-center gap-3">
//             {printAttempted && (
//               <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                 <CheckCircle2 className="w-4 h-4 text-green-600" />
//                 <span>
//                   {window.MOBILE_CHANNEL 
//                     ? "Print sent to device"
//                     : "Draft bill generated"}
//                 </span>
//               </div>
//             )}

//             <Button
//               variant="default"
//               onClick={handlePrintAgain}
//               className="gap-2 bg-primary hover:bg-primary/90"
//             >
//               <Printer className="w-4 h-4" />
//               {showPrintAgain ? "Print Again" : "Print"}
//             </Button>
//           </div>
//         </div>

//         {showPrintAgain && (
//           <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//             <p className="text-sm text-blue-800">
//               <strong>Note:</strong> If the draft bill didn't print, click "Print Again" to retry.
//             </p>
//           </div>
//         )}
//       </div>

//       <div className="flex items-center justify-center min-h-screen p-2 print:p-0 print:block">
//         <div className="w-full max-w-[58mm] bg-white text-black p-2 print:p-0" id="draft-bill-content">
//           <div className="text-center border-b border-black pb-1 mb-1">
//             <h1 className="text-sm font-bold uppercase">Draft Bill</h1>
//             <p className="text-[10px]">Table: {tableName} • Persons: {persons}</p>
//             <p className="text-[10px]">{currentDate} {currentTime}</p>
//           </div>

//           <div className="border-b border-dashed border-black pb-1 mb-1">
//             <table className="w-full text-[10px]">
//               <thead>
//                 <tr className="border-b border-black">
//                   <th className="text-center py-0.5 w-10">Qty</th>
//                   <th className="text-left py-0.5">Item</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {items.map((item) => (
//                   <tr key={item.id}>
//                     <td className="text-center align-top py-0.5 pr-1">
//                       <span className="font-semibold">{item.quantity}</span>
//                     </td>
//                     <td className="py-0.5">
//                       <div>
//                         <span className="font-medium">{item.name}</span>
//                         {typeof item.spicePercent === 'number' && item.spicePercent > 0 && (
//                           <span className="ml-1 text-[9px] text-red-600 font-medium">
//                             🌶️ {Math.round(item.spicePercent)}%
//                           </span>
//                         )}
//                         {item.isJain && (
//                           <span className="ml-1 text-[9px] text-green-700 font-medium">[Jain]</span>
//                         )}
//                       </div>
//                       {item.note && (
//                         <div className="text-[9px] text-gray-600 italic mt-0.5">
//                           Note: {item.note}
//                         </div>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//         </div>
//       </div>

//       <style>{`
//         @media print {
//           @page { size: 58mm auto; margin: 0; }
//           body { margin: 0; padding: 0; }
//           body * { visibility: hidden; }
//           #draft-bill-content, #draft-bill-content * { visibility: visible; }
//           #draft-bill-content { position: absolute; left: 0; top: 0; width: 58mm; padding: 2mm; }
//           .print\\:hidden { display: none !important; }
//           .print\\:p-0 { padding: 0 !important; }
//           .print\\:block { display: block !important; }
//         }
//       `}</style>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, CheckCircle2, Printer } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

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

interface PrintDraftBillProps {
  tableName: string;
  persons: number;
  items: DraftBillItem[];
  onBack: () => void;
}

declare global {
  interface Window {
    MOBILE_CHANNEL?: {
      postMessage: (message: string) => void;
    };
  }
}

export function PrintDraftBill({ tableName, persons, items, onBack }: PrintDraftBillProps) {
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePrint = async () => {
    setPrintAttempted(true);

    try {
      const billElement = document.getElementById("draft-bill-content");
      if (!billElement) {
        toast.error("Draft bill content not found");
        return;
      }

      // Capture the bill content as canvas for 58mm thermal printer
      const canvas = await html2canvas(billElement, {
        scale: 1.1, // Higher scale for crisp thermal printing
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
        // Fallback for web browsers - use native print dialog
        const printWindow = window.open();
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Draft Bill</title>
                <style>
                  @page { size: 58mm auto; margin: 0; }
                  body { margin: 0; padding: 0; }
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
        toast.success("Print dialog opened. Please confirm to print.");
      }

      // Show print again button after a delay
      setTimeout(() => {
        setShowPrintAgain(true);
      }, 1000);
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate draft bill image");
    }
  };

  const handlePrintAgain = () => {
    handlePrint();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
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
                  {window.MOBILE_CHANNEL 
                    ? "Print sent to device"
                    : "Draft bill generated"}
                </span>
              </div>
            )}

            <Button
              variant="default"
              onClick={handlePrintAgain}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Printer className="w-4 h-4" />
              {showPrintAgain ? "Print Again" : "Print"}
            </Button>
          </div>
        </div>

        {showPrintAgain && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If the draft bill didn't print, click "Print Again" to retry.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center min-h-screen p-2 print:p-0 print:block">
        <div className="w-full max-w-[58mm] bg-white text-black p-3 print:p-2" id="draft-bill-content">
          <div className="text-center border-b border-black pb-2 mb-2">
            <h1 className="text-base font-bold uppercase">Draft Bill</h1>
            <p className="text-xs">Table: {tableName} • Persons: {persons}</p>
            <p className="text-xs">{currentDate} {currentTime}</p>
          </div>

          <div className="border-b border-dashed border-black pb-2 mb-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-center py-1 w-12">Qty</th>
                  <th className="text-left py-1">Item</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center align-top py-1 pr-2">
                      <span className="font-semibold">{item.quantity}</span>
                    </td>
                    <td className="py-1">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {typeof item.spicePercent === 'number' && item.spicePercent > 0 && (
                          <span className="ml-1 text-xs text-red-600 font-medium">
                            🌶️ {Math.round(item.spicePercent)}%
                          </span>
                        )}
                        {item.isJain && (
                          <span className="ml-1 text-xs text-green-700 font-medium">[Jain]</span>
                        )}
                      </div>
                      {item.note && (
                        <div className="text-xs text-gray-600 italic mt-1">
                          Note: {item.note}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Added bottom padding section */}
          <div className="pb-4"></div>

        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 58mm auto; margin: 0; }
          body { margin: 0; padding: 0; }
          body * { visibility: hidden; }
          #draft-bill-content, #draft-bill-content * { visibility: visible; }
          #draft-bill-content { position: absolute; left: 0; top: 0; width: 58mm; padding: 3mm; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}