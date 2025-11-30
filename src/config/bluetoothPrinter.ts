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
