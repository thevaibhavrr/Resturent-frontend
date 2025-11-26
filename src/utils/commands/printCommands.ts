import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getCurrentUser } from "../auth";
import { getRestaurantSettings } from "../../components/admin/Settings";
import { BluetoothPrinterService } from "../bluetoothPrinter";

// Types for bill data
export interface BillItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  discountAmount?: number; // Discount in ₹ for this item
}

export interface AdditionalCharge {
  id: number;
  name: string;
  amount: number;
}

export interface BillData {
  billNumber: string;
  tableName: string;
  persons: number;
  items: BillItem[];
  additionalCharges: AdditionalCharge[];
  discountAmount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

export interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  gstin: string;
  logo: string;
  qrCode: string;
  email: string;
  website: string;
  description: string;
}

// Type declarations for Flutter webview communication
declare global {
  interface Window {
    MOBILE_CHANNEL?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Print Command Class - Handles all bill printing functionality
 * Provides reusable functions for printing bills in different scenarios
 */
export class PrintCommands {
  private bluetoothPrinterService: BluetoothPrinterService | null = null;
  private restaurantSettings: RestaurantSettings | null = null;

  constructor() {
    // Initialize Bluetooth printer service if supported
    if (navigator.bluetooth) {
      this.bluetoothPrinterService = new BluetoothPrinterService((status) => {
        console.log('Bluetooth printer status:', status);
      });
    }
  }

  /**
   * Load restaurant settings for the current user
   * @returns Promise<RestaurantSettings> - Restaurant settings
   */
  async loadRestaurantSettings(): Promise<RestaurantSettings> {
    if (this.restaurantSettings) {
      return this.restaurantSettings;
    }

    const user = getCurrentUser();
    if (!user?.restaurantId) {
      throw new Error("User information not available");
    }

    try {
      this.restaurantSettings = await getRestaurantSettings(user.restaurantId);
      return this.restaurantSettings;
    } catch (error) {
      console.error("Error loading restaurant settings:", error);
      // Return default settings if API fails
      return {
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
    }
  }

  /**
   * Generate HTML content for the bill
   * @param billData - Bill data to render
   * @param settings - Restaurant settings
   * @returns string - HTML content for the bill
   */
  generateBillHTML(billData: BillData, settings: RestaurantSettings): string {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const currentTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Calculate subtotal with item discounts
    const subtotal = billData.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const itemDiscount = item.discountAmount || 0;
      return sum + itemTotal - itemDiscount;
    }, 0);

    const additionalTotal = billData.additionalCharges.reduce(
      (sum, charge) => sum + Number(charge.amount),
      0
    );

    return `
      <div style="
        width: 58mm;
        background: white;
        color: black;
        padding: 2mm;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.2;
      ">
        <!-- Premium Header with Logo -->
        <div style="
          text-align: center;
          margin-bottom: 2mm;
          padding-bottom: 2mm;
          border-bottom: 4px double #000;
        ">
          ${settings.logo ? `
            <div style="margin-bottom: 1mm; display: flex; justify-content: center;">
              <div style="
                width: 16mm;
                height: 16mm;
                border: 4px solid #000;
                padding: 1px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
              ">
                <img
                  src="${settings.logo}"
                  alt="Logo"
                  style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;"
                />
              </div>
            </div>
          ` : `
            <div style="margin-bottom: 1mm; display: flex; justify-content: center;">
              <div style="
                width: 14mm;
                height: 14mm;
                background: linear-gradient(135deg, #000 0%, #666 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 900;
                border: 4px solid #000;
                box-shadow: 1px 1px 2px rgba(0,0,0,0.1);
              ">
                ${settings.name ? settings.name.charAt(0).toUpperCase() : "R"}
              </div>
            </div>
          `}
          <h1 style="
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          ">
            ${settings.name || "Restaurant Name"}
          </h1>
          <div style="display: flex; align-items: center; justify-content: center; gap: 2mm; margin-top: 1mm;">
            <div style="height: 1px; background: #666; flex: 1;"></div>
            <div style="font-size: 6px; color: #999; font-weight: 600;">* * *</div>
            <div style="height: 1px; background: #666; flex: 1;"></div>
          </div>
        </div>

        <!-- Bill Information -->
        <div style="margin-bottom: 2mm; padding-bottom: 2mm; border-bottom: 2px dashed #999;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; padding: 1mm; border-radius: 2px;">
              <span style="font-weight: 600; color: #333;">Date:</span>
              <span style="font-weight: 500;">${currentDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; padding: 1mm; border-radius: 2px;">
              <span style="font-weight: 600; color: #333;">Time:</span>
              <span style="font-weight: 500;">${currentTime}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; padding: 1mm; border-radius: 2px;">
              <span style="font-weight: 600; color: #333;">Table:</span>
              <span style="font-weight: 700; color: #000;">${billData.tableName}</span>
            </div>
            <div style="grid-column: span 2; display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; padding: 1mm; border-radius: 2px;">
              <span style="font-weight: 600; color: #333;">Persons:</span>
              <span style="font-weight: 700; color: #000;">${billData.persons}</span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 2mm; padding-bottom: 2mm; border-bottom: 2px dashed #999;">
          <table style="width: 100%; font-size: 11px;">
            <thead>
              <tr style="background: #000; color: #fff;">
                <th style="text-align: left; padding: 1.5mm 1mm; font-weight: 700;">Item</th>
                <th style="text-align: center; padding: 1.5mm 1mm; font-weight: 700; width: 12mm;">Qty</th>
                <th style="text-align: right; padding: 1.5mm 1mm; font-weight: 700; width: 16mm;">Price</th>
                <th style="text-align: right; padding: 1.5mm 1mm; font-weight: 700; width: 20mm;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${billData.items.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                const itemDiscount = item.discountAmount || 0;
                const itemFinalAmount = itemTotal - itemDiscount;

                return `
                  <tr style="background: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                    <td style="padding: 1.5mm 1mm;">
                      <div>
                        <span style="font-weight: 600; color: #000;">${item.name}</span>
                        ${item.note ? `<div style="font-size: 9px; color: #666; font-style: italic; margin-top: 0.5mm;">Note: ${item.note}</div>` : ''}
                        ${itemDiscount > 0 ? `<div style="font-size: 9px; color: #d00; margin-top: 0.5mm; font-weight: 600;">Discount: -₹${itemDiscount.toFixed(2)}</div>` : ''}
                      </div>
                    </td>
                    <td style="text-align: center; font-weight: 500; color: #333;">${item.quantity}</td>
                    <td style="text-align: right; font-weight: 500; color: #666;">₹${item.price.toFixed(2)}</td>
                    <td style="text-align: right; font-weight: 700; color: #000;">₹${itemFinalAmount.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Additional Charges -->
        ${billData.additionalCharges.length > 0 ? `
          <div style="margin-bottom: 2mm; padding-bottom: 1.5mm; border-bottom: 1px dashed #ccc;">
            ${billData.additionalCharges.map(charge => `
              <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 0.5mm 0;">
                <span style="font-weight: 500; color: #333;">${charge.name}:</span>
                <span style="font-weight: 600; color: #000;">₹${charge.amount.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Total Section -->
        <div style="margin-bottom: 0; padding-bottom: 0; border-top: 4px double #000; padding-top: 2mm;">
          <div style="margin-bottom: 2mm;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 1mm;">
              <span style="color: #666;">Subtotal:</span>
              <span style="font-weight: 600; color: #000;">₹${subtotal.toFixed(2)}</span>
            </div>
            ${billData.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #d00; margin-bottom: 1mm;">
                <span>Total Discount:</span>
                <span style="font-weight: 600;">-₹${billData.discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            ${additionalTotal > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #080; margin-bottom: 1mm;">
                <span>Additional Charges:</span>
                <span style="font-weight: 600;">+₹${additionalTotal.toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
          <div style="background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 100%); margin: 0 -2mm; padding: 2mm; border-radius: 2px; border: 1px solid #ccc;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #000;">TOTAL</span>
              <span style="font-size: 16px; font-weight: 900; color: #000;">₹${billData.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- QR Code Section -->
        ${settings.qrCode ? `
          <div style="margin-bottom: 2mm; padding-bottom: 2mm; border-top: 2px dashed #999; padding-top: 2mm; text-align: center;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 2mm;">
              <div style="width: 32mm; height: 32mm; border: 2px solid #ccc; padding: 2mm; background: white; border-radius: 4px;">
                <img src="${settings.qrCode}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <p style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #333;">Scan and view our menu</p>
            </div>
          </div>
        ` : ''}

        <!-- Thank You Section -->
        <div style="text-align: center; margin-bottom: 0; padding-bottom: 0; border-top: 2px dashed #999; padding-top: 0;">
          <div style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin: 2mm 0;">THANK YOU</div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 2px dashed #999; padding-top: 2mm;">
          <div style="font-size: 10px; line-height: 1.3;">
            ${settings.name ? `<p style="font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 1px; margin: 0;">${settings.name}</p>` : ''}
            ${settings.address ? `<p style="font-weight: 500; color: #333; margin: 0.5mm 0; line-height: 1.2;">${settings.address}</p>` : ''}
            ${settings.phone ? `<p style="font-weight: 600; color: #000; margin: 0.5mm 0;">Phone: ${settings.phone}</p>` : ''}
            ${settings.gstin ? `<p style="font-size: 9px; color: #666; margin: 0.5mm 0;">GSTIN: ${settings.gstin}</p>` : ''}
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 2mm; margin-top: 1.5mm; padding-top: 1.5mm; border-top: 1px dashed #ccc;">
            <div style="height: 1px; background: #666; flex: 1;"></div>
            <div style="font-size: 6px; color: #999; font-weight: 600;">* * *</div>
            <div style="height: 1px; background: #666; flex: 1;"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format bill data for thermal printer (58mm)
   * @param billData - Bill data to format
   * @param settings - Restaurant settings
   * @returns string - Formatted thermal printer content
   */
  formatForThermalPrinter(billData: BillData, settings: RestaurantSettings): string {
    // Calculate subtotal with item discounts
    const subtotal = billData.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const itemDiscount = item.discountAmount || 0;
      return sum + itemTotal - itemDiscount;
    }, 0);

    const additionalTotal = billData.additionalCharges.reduce(
      (sum, charge) => sum + Number(charge.amount),
      0
    );

    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const currentTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create thermal printer receipt
    let receipt = "\x1B@"; // Initialize printer
    receipt += "\x1B!\x00"; // Normal text

    // Add header
    receipt += `${"=".repeat(32)}\n`;
    receipt += `${settings.name || "RESTAURANT"}\n`;
    receipt += `${"=".repeat(32)}\n\n`;

    // Add order info
    receipt += `Bill #: ${billData.billNumber.padEnd(20)}${currentDate}\n`;
    receipt += `Table: ${billData.tableName.padEnd(20)}${currentTime}\n`;
    receipt += `Persons: ${billData.persons.toString().padEnd(16)}${" ".repeat(6)}\n`;
    receipt += "-".repeat(32) + "\n";

    // Add items
    billData.items.forEach((item) => {
      const name = item.name.length > 20 ? item.name.substring(0, 17) + "..." : item.name;
      const price = `₹${(item.price * item.quantity).toFixed(2)}`;
      receipt += `${name}\n`;
      receipt += `  ${item.quantity} x ₹${item.price.toFixed(2)}`.padEnd(20) + price.padStart(12) + "\n";
      if (item.note) {
        receipt += `  (${item.note})\n`;
      }
      if (item.discountAmount && item.discountAmount > 0) {
        receipt += `  Discount: -₹${item.discountAmount.toFixed(2)}\n`;
      }
    });

    // Add totals
    receipt += "\n";
    receipt += "Subtotal:".padEnd(20) + `₹${subtotal.toFixed(2)}\n`;

    if (billData.discountAmount > 0) {
      receipt += "Discount:".padEnd(20) + `-₹${billData.discountAmount.toFixed(2)}\n`;
    }

    if (billData.additionalCharges.length > 0) {
      billData.additionalCharges.forEach((charge) => {
        receipt += `${charge.name}:`.padEnd(20) + `₹${charge.amount.toFixed(2)}\n`;
      });
    }

    if (billData.cgst > 0) {
      receipt += "CGST:".padEnd(20) + `₹${billData.cgst.toFixed(2)}\n`;
    }

    if (billData.sgst > 0) {
      receipt += "SGST:".padEnd(20) + `₹${billData.sgst.toFixed(2)}\n`;
    }

    receipt += "\n";
    receipt += "TOTAL:".padEnd(20) + `₹${billData.grandTotal.toFixed(2)}\n\n`;

    // Add footer
    receipt += "\n";
    receipt += `${"Thank you for dining with us!".padStart(24)}\n`;
    receipt += `${"=".repeat(32)}\n\n\n\n`;

    // Add paper cut command (if supported by printer)
    receipt += "\x1DVA\x00"; // Partial cut

    return receipt;
  }

  /**
   * Print bill using html2canvas and jsPDF (web printing)
   * @param billData - Bill data to print
   * @param elementId - HTML element ID containing the bill (optional)
   * @returns Promise<void>
   */
  async printBillToPDF(billData: BillData, elementId?: string): Promise<void> {
    try {
      let element: HTMLElement;

      if (elementId) {
        element = document.getElementById(elementId) as HTMLElement;
        if (!element) {
          throw new Error(`Element with ID '${elementId}' not found`);
        }
      } else {
        // Create a temporary element with the bill HTML
        const settings = await this.loadRestaurantSettings();
        const billHTML = this.generateBillHTML(billData, settings);

        element = document.createElement('div');
        element.innerHTML = billHTML;
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.top = '-9999px';
        document.body.appendChild(element);
      }

      // Capture the bill content as canvas for thermal printer
      const canvas = await html2canvas(element, {
        scale: 1.1, // Higher scale for crisp thermal printing
        backgroundColor: '#ffffff',
        useCORS: true,
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
        // Fallback for web browsers - open print dialog
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Bill - ${billData.billNumber}</title>
                <style>
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
                  }
                  body {
                    margin: 0;
                    padding: 10px;
                    font-family: monospace;
                  }
                </style>
              </head>
              <body>
                <img src="${imgData}" style="width: 100%; max-width: 58mm;" />
                <script>
                  window.onload = function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 1000);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }

        toast.success("Print dialog opened successfully!");
      }

      // Clean up temporary element if created
      if (!elementId && element.parentNode) {
        element.parentNode.removeChild(element);
      }

    } catch (error) {
      console.error("Error printing bill:", error);
      toast.error("Failed to generate print content");
      throw error;
    }
  }

  /**
   * Print bill via Bluetooth thermal printer
   * @param billData - Bill data to print
   * @returns Promise<void>
   */
  async printBillViaBluetooth(billData: BillData): Promise<void> {
    if (!this.bluetoothPrinterService) {
      throw new Error("Bluetooth printing not supported in this browser");
    }

    try {
      const settings = await this.loadRestaurantSettings();
      const thermalContent = this.formatForThermalPrinter(billData, settings);

      const success = await this.bluetoothPrinterService.print(thermalContent);

      if (success) {
        toast.success("Bill printed via Bluetooth successfully!");
      } else {
        throw new Error("Failed to print via Bluetooth");
      }
    } catch (error) {
      console.error("Bluetooth printing error:", error);
      toast.error("Bluetooth printing failed");
      throw error;
    }
  }

  /**
   * Print & Save bill (saves to database and prints)
   * @param billData - Bill data to save and print
   * @param saveFunction - Function to save bill to database
   * @param elementId - Optional HTML element ID for printing
   * @returns Promise<void>
   */
  async printAndSaveBill(
    billData: BillData,
    saveFunction: (data: any) => Promise<any>,
    elementId?: string
  ): Promise<void> {
    try {
      // First save the bill
      await saveFunction({
        billNumber: billData.billNumber,
        tableName: billData.tableName,
        persons: billData.persons,
        items: billData.items,
        additionalCharges: billData.additionalCharges,
        discountAmount: billData.discountAmount,
        cgst: billData.cgst,
        sgst: billData.sgst,
        grandTotal: billData.grandTotal,
      });

      toast.success("Bill saved successfully!");

      // Then print the bill
      await this.printBillToPDF(billData, elementId);

    } catch (error) {
      console.error("Error in print and save:", error);
      toast.error("Failed to save and print bill");
      throw error;
    }
  }

  /**
   * Print draft bill (prints without saving to database)
   * @param billData - Bill data to print
   * @param elementId - Optional HTML element ID for printing
   * @returns Promise<void>
   */
  async printDraftBill(billData: BillData, elementId?: string): Promise<void> {
    try {
      // Add draft watermark to bill data
      const draftBillData = {
        ...billData,
        billNumber: `DRAFT-${billData.billNumber}`,
      };

      await this.printBillToPDF(draftBillData, elementId);
      toast.success("Draft bill printed successfully!");

    } catch (error) {
      console.error("Error printing draft bill:", error);
      toast.error("Failed to print draft bill");
      throw error;
    }
  }

  /**
   * Get bill preview HTML (for display purposes)
   * @param billData - Bill data to preview
   * @returns Promise<string> - HTML content for preview
   */
  async getBillPreviewHTML(billData: BillData): Promise<string> {
    const settings = await this.loadRestaurantSettings();
    return this.generateBillHTML(billData, settings);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.bluetoothPrinterService) {
      this.bluetoothPrinterService.disconnect();
    }
  }
}

// Export singleton instance for easy usage
export const printCommands = new PrintCommands();
