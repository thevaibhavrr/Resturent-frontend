// Bluetooth Printer Configuration
export const BLUETOOTH_PRINTER_CONFIG = {
  // Main service UUID for thermal printers
  SERVICE_UUID: '0000ff00-0000-1000-8000-00805f9b34fb',
  
  // Characteristic UUID for sending data to the printer
  CHARACTERISTIC_UUID: '0000ff02-0000-1000-8000-00805f9b34fb',
  
  // Standard service UUID for thermal printers (short form)
  STANDARD_SERVICE_UUID: 0xFF00,
  
  // Default printer name (can be overridden)
  PRINTER_NAME: 'ThermalPrinter',
  
  // Maximum number of reconnection attempts
  MAX_RECONNECT_ATTEMPTS: 3,
  
  // Reconnection delay in milliseconds
  RECONNECTION_DELAY: 2000
} as const;

export type BluetoothPrinterConfig = typeof BLUETOOTH_PRINTER_CONFIG;

// Restaurant-specific Bluetooth printer mappings
export const RESTAURANT_PRINTER_MAPPING: Record<string, string> = {
  '692825b4865129222e968613': '66:32:B1:BE:4E:AF', // Restaurant 1
  '692adbcd8190e7a502218ea9': '66:32:2F:D3:1D:E0', // Restaurant 2
};

// Get Bluetooth printer address for a specific restaurant
export const getRestaurantPrinterAddress = (restaurantId: string): string | null => {
  return RESTAURANT_PRINTER_MAPPING[restaurantId] || null;
};

