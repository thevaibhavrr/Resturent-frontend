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
      console.log('Attempting to connect to saved printer:', this.savedPrinterConfig);

      const serviceUuid = this.savedPrinterConfig.serviceUuid || BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID;
      console.log('Using service UUID:', serviceUuid);

      // First try with service UUID only (more reliable)
      try {
        console.log('Trying connection with service UUID filter only...');
        this.device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [serviceUuid] }],
          optionalServices: [serviceUuid]
        });
        console.log('Device found with service UUID:', this.device.name);
      } catch (serviceError) {
        console.warn('Service UUID filter failed, trying with device name only...', serviceError);

        // Fallback: try with device name only
        if (this.savedPrinterConfig.name) {
          try {
            this.device = await navigator.bluetooth.requestDevice({
              filters: [{ name: this.savedPrinterConfig.name }],
              optionalServices: [serviceUuid]
            });
            console.log('Device found with name filter:', this.device.name);
          } catch (nameError) {
            console.warn('Name filter also failed, trying without filters...', nameError);

            // Last resort: let user pick any device and hope they choose the right one
            this.device = await navigator.bluetooth.requestDevice({
              optionalServices: [serviceUuid]
            });
            console.log('User selected device:', this.device.name);
          }
        } else {
          throw new Error('No device name available for fallback connection');
        }
      }

      if (!this.device.gatt) {
        throw new Error('Bluetooth GATT not available on selected device');
      }

      console.log('Connecting to GATT server...');
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      this.server = await this.device.gatt.connect();
      console.log('GATT server connected, getting service...');

      this.service = await this.server.getPrimaryService(serviceUuid);
      console.log('Service obtained, getting characteristic...');

      const characteristicUuid = this.savedPrinterConfig.characteristicUuid || BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID;
      console.log('Using characteristic UUID:', characteristicUuid);

      this.characteristic = await this.service.getCharacteristic(characteristicUuid);
      console.log('Characteristic obtained, printer ready!');

      this.setStatus('connected');
      return true;
    } catch (error) {
      console.error('Saved printer connection error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        savedConfig: this.savedPrinterConfig
      });
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
    console.log('Print request received, content length:', content.length);
    console.log('Current status:', this.status);
    console.log('Characteristic available:', !!this.characteristic);

    if (!this.characteristic || this.status !== 'connected') {
      console.log('Not connected, attempting to connect...');
      const connected = await this.connect();
      if (!connected || !this.characteristic) {
        console.error('Failed to connect or no characteristic available');
        return false;
      }
    }

    try {
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      console.log('Data encoded, length:', data.length);

      // Send data to printer
      console.log('Sending data to printer...');
      await this.characteristic.writeValueWithoutResponse(data);
      console.log('Print data sent successfully');
      return true;
    } catch (error) {
      console.error('Print error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      });
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
