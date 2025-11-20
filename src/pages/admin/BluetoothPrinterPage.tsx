import { useState } from 'react';
import { Bluetooth, Printer, CheckCircle, AlertCircle } from 'lucide-react';

export default function BluetoothPrinter() {
  const [isScanning, setIsScanning] = useState(false);
  const [printers, setPrinters] = useState<BluetoothDevice[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<BluetoothDevice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Disconnected');

  const requestBluetooth = async () => {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not supported in your browser. Please use Chrome 56+ or Edge 79+');
      }

      setStatus('Scanning for Bluetooth devices...');
      setIsScanning(true);
      setError(null);

      // Request Bluetooth device with specific services for printers
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'], // Common printer service
      });

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('Disconnected');
        setConnectedPrinter(null);
      });

      setStatus('Connecting to printer...');
      const server = await device.gatt?.connect();
      
      if (server) {
        setConnectedPrinter(device);
        setStatus('Connected to printer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Bluetooth device');
      setStatus('Connection failed');
    } finally {
      setIsScanning(false);
    }
  };

  const disconnectPrinter = async () => {
    if (connectedPrinter && connectedPrinter.gatt?.connected) {
      connectedPrinter.gatt.disconnect();
      setConnectedPrinter(null);
      setStatus('Disconnected');
    }
  };

  const testPrint = async () => {
    if (!connectedPrinter) return;
    
    try {
      setStatus('Sending test print...');
      // This is a simplified example. Actual implementation will depend on your printer's protocol
      // You'll need to implement the specific ESC/POS or other printer commands
      const service = await connectedPrinter.gatt?.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service?.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
      // Example ESC/POS commands for a test print
      const encoder = new TextEncoder();
      const commands = [
        0x1B, 0x40, // Initialize printer
        0x1B, 0x61, 0x01, // Center align
        0x1D, 0x21, 0x11, // Double height and width
        ...encoder.encode('TEST PRINT\n'),
        0x1D, 0x21, 0x00, // Normal text
        0x1B, 0x61, 0x00, // Left align
        ...encoder.encode('Restaurant Management\n'),
        ...encoder.encode('Test Print\n'),
        ...encoder.encode('----------------\n'),
        ...encoder.encode('Thank you!\n'),
        0x1D, 0x56, 0x41, 0x10, // Cut paper (may vary by printer)
      ];
      
      const commandBuffer = new Uint8Array(commands).buffer;
      await characteristic?.writeValue(commandBuffer);
      
      setStatus('Test print sent successfully');
    } catch (err) {
      setError('Failed to send print job');
      console.error('Print error:', err);
      setStatus('Print failed');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bluetooth Printer</h1>
        <p className="text-gray-600">Connect and manage your Bluetooth thermal printer</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Printer Connection</h2>
            <p className="text-sm text-gray-500">
              {connectedPrinter 
                ? `Connected to ${connectedPrinter.name || 'Unknown Device'}` 
                : 'Not connected to any printer'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              connectedPrinter ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {connectedPrinter ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Disconnected
                </>
              )}
            </span>
            
            {!connectedPrinter ? (
              <button
                onClick={requestBluetooth}
                disabled={isScanning}
                className={`inline-flex bg-black items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isScanning ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <Bluetooth className="w-4 h-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Connect Printer'}
              </button>
            ) : (
              <button
                onClick={disconnectPrinter}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Status</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {connectedPrinter && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Printer Actions</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Test Print</h3>
                <p className="text-sm text-gray-500">Print a test page to verify the connection</p>
              </div>
              <button
                onClick={testPrint}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Test Page
              </button>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Printer Information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{connectedPrinter.name || 'Unknown'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 truncate">{connectedPrinter.id}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing type definitions
interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: {
    connect(): Promise<BluetoothRemoteGATTServer>;
    connected: boolean;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  };
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  connected: boolean;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: ArrayBuffer): Promise<void>;
}

// Add missing icon component
function InformationCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}
