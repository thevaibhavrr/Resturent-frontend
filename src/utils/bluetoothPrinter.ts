// Bluetooth printer connection status
type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface BluetoothPrinter {
  id: string;
  name: string;
}

class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private status: PrinterStatus = 'disconnected';
  private onStatusChange: ((status: PrinterStatus) => void) | null = null;

  constructor(onStatusChange?: (status: PrinterStatus) => void) {
    if (onStatusChange) {
      this.onStatusChange = onStatusChange;
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
      
      // Request Bluetooth device with service UUID for thermal printers (0xFF00)
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [0xFF00] }],
        optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb']
      });

      if (!this.device.gatt) {
        throw new Error('Bluetooth GATT not available');
      }

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);
      
      this.server = await this.device.gatt.connect();
      this.service = await this.server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
      this.characteristic = await this.service.getCharacteristic('0000ff02-0000-1000-8000-00805f9b34fb');
      
      this.setStatus('connected');
      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      this.setStatus('error');
      return false;
    }
  }

  async print(content: string): Promise<boolean> {
    if (!this.characteristic || this.status !== 'connected') {
      const connected = await this.connect();
      if (!connected) return false;
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
}

export { BluetoothPrinterService };
export type { PrinterStatus, BluetoothPrinter };
