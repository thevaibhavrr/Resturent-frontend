import { useEffect, useState } from 'react';
import { Bluetooth, BluetoothOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { NewtonsCradleLoader } from './ui/newtons-cradle-loader';
import { toast } from 'sonner';
import { BluetoothPrinterService, PrinterStatus, SavedPrinterConfig } from '../utils/bluetoothPrinter';
import { getCurrentUser, getRestaurantKey } from '../utils/auth';

// Export the service type for use in other components
export type { SavedPrinterConfig };

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
  const [savedPrinterConfig, setSavedPrinterConfig] = useState<SavedPrinterConfig | null>(null);

  // Initialize printer service
  const [printerService] = useState(
    () =>
      new BluetoothPrinterService((newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'connected' && onConnect) onConnect();
        if (newStatus === 'disconnected' && onDisconnect) onDisconnect();
      })
  );

  // Load saved printer configuration
  useEffect(() => {
    const loadSavedPrinterConfig = () => {
      const user = getCurrentUser();
      if (!user?.restaurantId) {
        console.log('No user or restaurantId found for Bluetooth printer config');
        return;
      }

      const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
      console.log('Loading Bluetooth printer config with key:', key);
      const stored = localStorage.getItem(key);

      if (stored) {
        try {
          const config: SavedPrinterConfig = JSON.parse(stored);
          console.log('Loaded Bluetooth printer config:', config);
          setSavedPrinterConfig(config);
          printerService.updateSavedPrinterConfig(config);
          setPrinterName(config.name || '');

          // Auto-reconnect if enabled and not already connected
          if (config.enabled && status === 'disconnected' && navigator.bluetooth) {
            console.log('Auto-reconnecting to saved printer...');
            setTimeout(() => {
              printerService.reconnect().then(connected => {
                if (connected) {
                  setPrinterName(config.name || '');
                  toast.success(`Reconnected to ${config.name}`);
                } else {
                  console.log('Auto-reconnection failed');
                }
              }).catch(error => {
                console.log('Auto-reconnection failed:', error);
              });
            }, 1000); // Small delay to ensure component is fully mounted
          }
        } catch (error) {
          console.error('Error parsing saved printer config:', error);
        }
      } else {
        console.log('No saved Bluetooth printer config found in localStorage');
      }
    };

    loadSavedPrinterConfig();
  }, [printerService, status]);

  const handleConnect = async () => {
    if (!navigator.bluetooth) {
      toast.error('Web Bluetooth API is not supported in your browser');
      return;
    }

    try {
      setIsInitializing(true);
      const connected = await printerService.connect();

      if (connected) {
        const printerName = printerService.getConnectedPrinterName();
        setPrinterName(printerName);
        toast.success(`Connected to ${printerName}`);
      } else {
        const message = savedPrinterConfig?.name
          ? `Failed to connect to ${savedPrinterConfig.name}`
          : 'Failed to connect to printer';
        toast.error(message);
      }
    } catch (error) {
      console.error('Connection error:', error);
      const message = savedPrinterConfig?.name
        ? `Failed to connect to ${savedPrinterConfig.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.error(message);
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
    const displayName = printerName || savedPrinterConfig?.name || 'Printer';

    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Bluetooth className="w-4 h-4" />
            <span className="text-sm font-medium">
              {displayName} Connected
            </span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <NewtonsCradleLoader size={20} speed={1.2} color="#3b82f6" />
            <span className="text-sm font-medium">
              Connecting to {displayName}...
            </span>
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
            <span className="text-sm font-medium">
              {savedPrinterConfig?.enabled ? `${displayName} Disconnected` : 'Printer Disconnected'}
            </span>
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
            {savedPrinterConfig?.name ? `Connect to ${savedPrinterConfig.name}` : 'Connect Printer'}
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
