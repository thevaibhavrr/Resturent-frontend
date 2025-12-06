import { BLUETOOTH_PRINTER_CONFIG } from '../config/bluetoothPrinter';

// Web Bluetooth API type declarations
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }

  interface BluetoothDevice {
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }

  interface BluetoothLEScanFilter {
    name?: string;
    services?: (string | number)[];
  }

  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: (string | number)[];
  }
}

// Bluetooth printer connection status
type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface BluetoothPrinter {
  id: string;
  name: string;
}

interface SavedPrinterConfig {
  name: string;
  address: string;
  enabled: boolean;
  serviceUuid: string;
  characteristicUuid: string;
}

class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private status: PrinterStatus = 'disconnected';
  private onStatusChange: ((status: PrinterStatus) => void) | null = null;
  private savedPrinterConfig: SavedPrinterConfig | null = null;

  constructor(onStatusChange?: (status: PrinterStatus) => void, savedConfig?: SavedPrinterConfig) {
    if (onStatusChange) {
      this.onStatusChange = onStatusChange;
    }
    if (savedConfig) {
      this.savedPrinterConfig = savedConfig;
    }
  }

  private setStatus(status: PrinterStatus) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  async connect(): Promise<boolean> {
    if (this.status === 'connected') return true;

    try {
      this.setStatus('connecting');

      // If we have saved printer configuration, try to connect to the specific printer
      if (this.savedPrinterConfig && this.savedPrinterConfig.name) {
        return await this.connectToSavedPrinter();
      }

      // Fallback to device selection
      return await this.connectToAnyPrinter();
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      this.setStatus('error');
      return false;
    }
  }

  async connectToSavedPrinter(): Promise<boolean> {
    if (!this.savedPrinterConfig) {
      throw new Error('No saved printer configuration available');
    }

    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API is not supported');
    }

    try {
      this.setStatus('connecting');

      // Request Bluetooth device with specific filters for the saved printer
      const filters: BluetoothLEScanFilter[] = [];

      // Add name filter if printer name is available
      if (this.savedPrinterConfig.name) {
        filters.push({ name: this.savedPrinterConfig.name });
      }

      // Add service filter
      const serviceUuid = this.savedPrinterConfig.serviceUuid || BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID;
      filters.push({ services: [serviceUuid] });

      this.device = await navigator.bluetooth.requestDevice({
        filters,
        optionalServices: [serviceUuid]
      });

      if (!this.device.gatt) {
        throw new Error('Bluetooth GATT not available');
      }

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      this.server = await this.device.gatt.connect();

      const service = await this.server.getPrimaryService(serviceUuid);
      const characteristicUuid = this.savedPrinterConfig.characteristicUuid || BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID;
      this.characteristic = await service.getCharacteristic(characteristicUuid);

      this.setStatus('connected');
      return true;
    } catch (error) {
      console.error('Saved printer connection error:', error);
      this.setStatus('error');
      return false;
    }
  }

  async connectToAnyPrinter(): Promise<boolean> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API is not supported');
    }

    try {
      // Request Bluetooth device with service UUID for thermal printers
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLUETOOTH_PRINTER_CONFIG.STANDARD_SERVICE_UUID] }],
        optionalServices: [BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID]
      });

      if (!this.device.gatt) {
        throw new Error('Bluetooth GATT not available');
      }

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      this.server = await this.device.gatt.connect();
      this.service = await this.server.getPrimaryService(BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID);
      this.characteristic = await this.service.getCharacteristic(BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID);

      this.setStatus('connected');
      return true;
    } catch (error) {
      console.error('Any printer connection error:', error);
      this.setStatus('error');
      return false;
    }
  }

  async print(content: string): Promise<boolean> {
    if (!this.characteristic || this.status !== 'connected') {
      const connected = await this.connect();
      if (!connected || !this.characteristic) return false;
    }

    try {
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(content);

      // Send data to printer
      await this.characteristic.writeValueWithoutResponse(data);
      return true;
    } catch (error) {
      console.error('Print error:', error);
      this.setStatus('error');
      return false;
    }
  }

  disconnect() {
    if (this.device && this.device.gatt) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
    this.setStatus('disconnected');
  }

  private handleDisconnect = () => {
    this.cleanup();
    this.setStatus('disconnected');
  };

  private cleanup() {
    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
      this.device = null;
    }
    this.server = null;
    this.service = null;
    this.characteristic = null;
  }

  getStatus(): PrinterStatus {
    return this.status;
  }

  getConnectedPrinterName(): string {
    if (this.device && this.device.name) {
      return this.device.name;
    }
    if (this.savedPrinterConfig && this.savedPrinterConfig.name) {
      return this.savedPrinterConfig.name;
    }
    return 'Unknown Printer';
  }

  updateSavedPrinterConfig(config: SavedPrinterConfig): void {
    this.savedPrinterConfig = config;
  }

  async reconnect(): Promise<boolean> {
    if (this.status === 'connected') return true;

    // Try to reconnect to the saved printer if available
    if (this.savedPrinterConfig && this.savedPrinterConfig.enabled) {
      console.log('Attempting to reconnect to saved printer:', this.savedPrinterConfig.name);
      return await this.connectToSavedPrinter();
    }

    return false;
  }
}

export { BluetoothPrinterService };
export type { PrinterStatus, BluetoothPrinter };
