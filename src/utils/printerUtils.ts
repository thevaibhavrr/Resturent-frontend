// Printer utility functions for handling different printer widths

export interface PrinterDimensions {
  width: number; // in inches
  widthPx: number; // in pixels (assuming 96 DPI)
  widthMm: number; // in millimeters
  maxWidthPx: number; // maximum width for content
  padding: number; // padding in pixels
  fontSize: {
    title: number;
    normal: number;
    small: number;
    tiny: number;
  };
}

/**
 * Convert inches to millimeters
 */
export const inchesToMm = (inches: number): number => {
  return inches * 25.4;
};

/**
 * Convert inches to pixels (assuming 96 DPI)
 */
export const inchesToPx = (inches: number): number => {
  return inches * 96;
};

/**
 * Get printer dimensions based on width in inches
 */
export const getPrinterDimensions = (widthInches: number): PrinterDimensions => {
  const widthPx = inchesToPx(widthInches);
  const widthMm = inchesToMm(widthInches);

  // Calculate padding based on printer width
  const padding = Math.max(8, Math.min(16, widthPx * 0.05));

  // Calculate font sizes based on printer width - Increased for better readability
  const baseFontSize = Math.max(14, Math.min(20, widthPx * 0.05));
  const titleFontSize = Math.max(18, Math.min(24, widthPx * 0.07));
  const smallFontSize = Math.max(12, Math.min(14, widthPx * 0.04));
  const tinyFontSize = Math.max(10, Math.min(12, widthPx * 0.03));

  return {
    width: widthInches,
    widthPx: Math.round(widthPx),
    widthMm: Math.round(widthMm * 100) / 100,
    maxWidthPx: Math.round(widthPx - (padding * 2)),
    padding,
    fontSize: {
      title: Math.round(titleFontSize),
      normal: Math.round(baseFontSize),
      small: Math.round(smallFontSize),
      tiny: Math.round(tinyFontSize)
    }
  };
};

/**
 * Get printer dimensions for KOT printing
 * Supports 2", 3", and 4" printers
 */
export const getKotPrinterDimensions = (widthInches: number = 3): PrinterDimensions => {
  return getPrinterDimensions(widthInches);
};

/**
 * Get printer dimensions for bill printing
 * Supports 2", 3", and 4" printers
 */
export const getBillPrinterDimensions = (widthInches: number = 2): PrinterDimensions => {
  return getPrinterDimensions(widthInches);
};

/**
 * Get printer width from localStorage with fallback to default
 */
export const getPrinterWidthFromStorage = (
  user: any,
  printerType: 'bill' | 'kot',
  defaultWidth: number = 2
): number => {
  if (!user?.restaurantId) return defaultWidth;

  try {
    // Try to get from restaurant-specific printer settings
    const printerKey = `${user.restaurantId}_${printerType}BluetoothPrinter`;
    const storedPrinter = localStorage.getItem(printerKey);

    if (storedPrinter) {
      const printerConfig = JSON.parse(storedPrinter);
      if (printerConfig.width && typeof printerConfig.width === 'number') {
        return printerConfig.width;
      }
    }

    // Fallback to global settings
    const settingsKey = `${user.restaurantId}_settings`;
    const storedSettings = localStorage.getItem(settingsKey);

    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      const widthKey = `${printerType}PrinterWidth`;
      if (settings[widthKey] && typeof settings[widthKey] === 'number') {
        return settings[widthKey];
      }
    }
  } catch (error) {
    console.warn(`Error getting ${printerType} printer width from localStorage:`, error);
  }

  return defaultWidth;
};

/**
 * Get CSS styles for print layout based on printer dimensions
 */
export const getPrintStyles = (dimensions: PrinterDimensions): string => {
  return `
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        width: 100% !important;
        background: white !important;
      }

      * {
        margin: 0 !important;
        padding: 0 !important;
      }

      body * {
        display: none !important;
        visibility: hidden !important;
      }

      #print-content, #print-kot-preview, #print-bill-preview {
        display: block !important;
        visibility: visible !important;
        position: static !important;
        top: auto !important;
        left: auto !important;
        width: ${dimensions.widthPx}px !important;
        max-width: ${dimensions.widthPx}px !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        box-shadow: none !important;
        font-size: ${dimensions.fontSize.normal}px !important;
      }

      #print-content *, #print-kot-preview *, #print-bill-preview * {
        display: block !important;
        visibility: visible !important;
        font-size: inherit !important;
      }

      #print-content .print-title, #print-kot-preview .print-title, #print-bill-preview .print-title {
        font-size: ${dimensions.fontSize.title}px !important;
        font-weight: bold !important;
      }

      #print-content .print-small, #print-kot-preview .print-small, #print-bill-preview .print-small {
        font-size: ${dimensions.fontSize.small}px !important;
      }

      #print-content .print-tiny, #print-kot-preview .print-tiny, #print-bill-preview .print-tiny {
        font-size: ${dimensions.fontSize.tiny}px !important;
      }
    }
  `;
};

/**
 * Get inline styles for print content container
 */
export const getPrintContainerStyles = (dimensions: PrinterDimensions): React.CSSProperties => {
  return {
    padding: `${dimensions.padding}px`,
    fontFamily: "Arial, sans-serif",
    width: `${dimensions.widthPx}px`,
    maxWidth: `${dimensions.widthPx}px`,
    margin: "0 auto",
    backgroundColor: "white",
    color: "black",
    fontSize: `${dimensions.fontSize.normal}px`,
    lineHeight: "1.2",
    boxSizing: "border-box"
  };
};