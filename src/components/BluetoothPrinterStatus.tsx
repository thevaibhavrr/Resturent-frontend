import { useEffect, useState } from 'react';
import { Bluetooth, BluetoothOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { NewtonsCradleLoader } from './ui/newtons-cradle-loader';
import { toast } from 'sonner';
import { BluetoothPrinterService, PrinterStatus } from '../utils/bluetoothPrinter';

// Type declaration for Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth?: any; // Web Bluetooth API
  }
  
  interface Window {
    MOBILE_CHANNEL?: {
      postMessage: (message: string) => void;
    };
  }
}

interface BluetoothPrinterStatusProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function BluetoothPrinterStatus({
  onConnect,
  onDisconnect,
  onError,
}: BluetoothPrinterStatusProps) {
  const [status, setStatus] = useState<PrinterStatus>('disconnected');
  const [printerName, setPrinterName] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Initialize printer service
  const [printerService] = useState(
    () =>
      new BluetoothPrinterService((newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'connected' && onConnect) onConnect();
        if (newStatus === 'disconnected' && onDisconnect) onDisconnect();
      })
  );

  const handleConnect = async () => {
    if (!navigator.bluetooth) {
      toast.error('Web Bluetooth API is not supported in your browser');
      return;
    }

    try {
      setIsInitializing(true);
      const connected = await printerService.connect();
      if (connected) {
        toast.success('Bluetooth printer connected successfully');
      } else {
        toast.error('Failed to connect to printer');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (onError) onError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisconnect = () => {
    try {
      printerService.disconnect();
      toast.info('Disconnected from printer');
    } catch (error) {
      console.error('Disconnection error:', error);
      toast.error('Failed to disconnect from printer');
    }
  };

  const getStatusUI = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Bluetooth className="w-4 h-4" />
            <span className="text-sm font-medium">
              {printerName || 'Printer'} Connected
            </span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <NewtonsCradleLoader size={20} speed={1.2} color="#3b82f6" />
            <span className="text-sm font-medium">Connecting...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Connection Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <BluetoothOff className="w-4 h-4" />
            <span className="text-sm font-medium">Printer Disconnected</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">Bluetooth Printer</h3>
        {getStatusUI()}
      </div>
      
      <div className="flex gap-2 mt-2">
        {status === 'disconnected' ? (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isInitializing}
            className="gap-2"
          >
            {isInitializing ? (
              <NewtonsCradleLoader size={16} speed={1.2} color="#ffffff" />
            ) : (
              <Bluetooth className="w-4 h-4" />
            )}
            Connect Printer
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={status === 'connecting'}
            className="gap-2"
          >
            <BluetoothOff className="w-4 h-4" />
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
}
