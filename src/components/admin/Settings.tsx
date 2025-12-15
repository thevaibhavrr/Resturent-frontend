
export async function getRestaurantSettings(restaurantId: string): Promise<RestaurantSettings> {
  console.log("getRestaurantSettings: Called with restaurantId:", restaurantId);
  try {
    const { makeApi } = await import("../../api/makeapi");
    console.log("getRestaurantSettings: Making API call to:", `/api/settings/${restaurantId}`);
    const response = await makeApi(`/api/settings/${restaurantId}`, "GET");
    console.log("getRestaurantSettings: API response:", response);
    console.log("getRestaurantSettings: Response data:", response?.data);

    if (response && response.data) {
      const settings = {
        ...response.data,
        billBluetoothPrinter: {
          address: response.data.billPrinterAddress || "",
          enabled: response.data.billPrinterEnabled || false,
          name: "",
          status: 'disconnected' as const,
          serviceUuid: BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID,
          characteristicUuid: BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID
        },
        kotBluetoothPrinter: {
          address: response.data.kotPrinterAddress || "",
          enabled: response.data.kotPrinterEnabled || false,
          name: "",
          status: 'disconnected' as const,
          serviceUuid: BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID,
          characteristicUuid: BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID
        }
      };
      console.log("getRestaurantSettings: Returning settings:", settings);
      return settings;
    } else {
      console.log("getRestaurantSettings: No response data, will fallback to localStorage");
    }
  } catch (error) {
    console.error("getRestaurantSettings: Error fetching settings from API, falling back to localStorage:", error);
  }
  
  // Fallback to localStorage
  const key = getRestaurantKey("settings", restaurantId);
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    name: "Restaurant Name",
    address: "",
    phone: "",
    email: "",
    website: "",
    gstin: "",
    logo: "",
    qrCode: "",
    description: "",
    billBluetoothPrinter: {
      address: "",
      enabled: false,
      name: "",
      status: 'disconnected' as const
    },
    kotBluetoothPrinter: {
      address: "",
      enabled: false,
      name: "",
      status: 'disconnected' as const
    }
  };
}

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Settings as SettingsIcon, Upload, Save, Loader2, Bluetooth, Search, Printer, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { toast } from "sonner";
import { makeApi } from "../../api/makeapi";
import { BLUETOOTH_PRINTER_CONFIG, getRestaurantPrinterAddress } from "../../config/bluetoothPrinter";
import { BluetoothPrinterService, PrinterStatus, SavedPrinterConfig } from "../../utils/bluetoothPrinter";

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  logo: string;
  qrCode: string;
  description: string;
  billBluetoothPrinter: {
    address: string;
    enabled: boolean;
    name: string;
    status: PrinterStatus;
  };
  kotBluetoothPrinter: {
    address: string;
    enabled: boolean;
    name: string;
    status: PrinterStatus;
  };
}

export function Settings() {
  const user = getCurrentUser();
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    gstin: "",
    logo: "",
    qrCode: "",
    description: "",
    billBluetoothPrinter: {
      address: "",
      enabled: true,
      name: "",
      status: 'disconnected'
    },
    kotBluetoothPrinter: {
      address: "",
      enabled: true,
      name: "",
      status: 'disconnected'
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bluetooth printer states
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('disconnected');
  const [printerService] = useState(() => new BluetoothPrinterService(setPrinterStatus));
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Array<{name: string, id: string}>>([]);
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-save Bluetooth printer settings to localStorage when they change
  useEffect(() => {
    if (user) {
      const billKey = getRestaurantKey("billBluetoothPrinter", user.restaurantId);
      const kotKey = getRestaurantKey("kotBluetoothPrinter", user.restaurantId);
      
      if (settings.billBluetoothPrinter) {
        localStorage.setItem(billKey, JSON.stringify(settings.billBluetoothPrinter));
      }
      if (settings.kotBluetoothPrinter) {
        localStorage.setItem(kotKey, JSON.stringify(settings.kotBluetoothPrinter));
      }
    }
  }, [settings.billBluetoothPrinter, settings.kotBluetoothPrinter, user]);

  // Helper: resolve printer address from localStorage (restaurant-specific restaurantSettings_<id>),
  // then saved printer key (billBluetoothPrinter/kotBluetoothPrinter), then settings state
  const resolvePrinterAddressFromStorage = (printerType: 'bill' | 'kot') => {
    // 1) restaurant-specific settings key
    const restaurantSettingsKey = user?.restaurantId ? `restaurantSettings_${user.restaurantId}` : "restaurantSettings";
    const restaurantSettingsRaw = localStorage.getItem(restaurantSettingsKey) || localStorage.getItem("restaurantSettings");
    if (restaurantSettingsRaw) {
      try {
        const rs = JSON.parse(restaurantSettingsRaw);
        if (printerType === 'bill' && rs?.billPrinterAddress) return rs.billPrinterAddress;
        if (printerType === 'kot' && rs?.kotPrinterAddress) return rs.kotPrinterAddress;
        // also check nested objects
        if (printerType === 'bill' && rs?.billBluetoothPrinter?.address) return rs.billBluetoothPrinter.address;
        if (printerType === 'kot' && rs?.kotBluetoothPrinter?.address) return rs.kotBluetoothPrinter.address;
      } catch (err) {
        // ignore
      }
    }

    // 2) saved printer config under getRestaurantKey
    if (user?.restaurantId) {
      const key = getRestaurantKey(printerType === 'bill' ? 'billBluetoothPrinter' : 'kotBluetoothPrinter', user.restaurantId);
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const cfg = JSON.parse(stored);
          if (cfg?.address) return cfg.address;
        } catch (err) {
          // ignore
        }
      }
    }

    // 3) fall back to in-memory settings state
    const stateAddress = printerType === 'bill' ? settings.billBluetoothPrinter?.address : settings.kotBluetoothPrinter?.address;
    return stateAddress || null;
  };

  // Load saved printer config on mount
  useEffect(() => {
    if (user?.restaurantId) {
      const billKey = getRestaurantKey("billBluetoothPrinter", user.restaurantId);
      const kotKey = getRestaurantKey("kotBluetoothPrinter", user.restaurantId);
      
      const loadPrinterConfig = (key: string) => {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch (error) {
            console.warn('Error loading saved printer config:', error);
            return null;
          }
        }
        return null;
      };

      const billConfig = loadPrinterConfig(billKey);
      const kotConfig = loadPrinterConfig(kotKey);

      setSettings(prev => ({
        ...prev,
        billBluetoothPrinter: billConfig || { address: '', enabled: false, name: '', status: 'disconnected' },
        kotBluetoothPrinter: kotConfig || { address: '', enabled: false, name: '', status: 'disconnected' }
      }));
    }
  }, [user?.restaurantId]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Load Bill printer settings from localStorage
    const billKey = getRestaurantKey("billBluetoothPrinter", user.restaurantId);
    const storedBillPrinter = localStorage.getItem(billKey);
    let billPrinterDefaults = {
      address: "",
      enabled: false,
      name: "",
      status: 'disconnected' as PrinterStatus
    };
    
    if (storedBillPrinter) {
      try {
        billPrinterDefaults = JSON.parse(storedBillPrinter);
      } catch (error) {
        console.error("Error parsing stored Bill printer settings:", error);
      }
    }

    // Load KOT printer settings from localStorage
    const kotKey = getRestaurantKey("kotBluetoothPrinter", user.restaurantId);
    const storedKotPrinter = localStorage.getItem(kotKey);
    let kotPrinterDefaults = {
      address: "",
      enabled: false,
      name: "",
      status: 'disconnected' as PrinterStatus
    };
    
    if (storedKotPrinter) {
      try {
        kotPrinterDefaults = JSON.parse(storedKotPrinter);
      } catch (error) {
        console.error("Error parsing stored KOT printer settings:", error);
      }
    }
    
    try {
      const response = await makeApi(`/api/settings/${user.restaurantId}`, "GET");
      if (response.data) {
        // Apply settings from API response
        setSettings({
          name: response.data.name || user.restaurantName || "",
          address: response.data.address || "",
          phone: response.data.phone || "",
          email: response.data.email || "",
          website: response.data.website || "",
          gstin: response.data.gstin || "",
          logo: response.data.logo || "",
          qrCode: response.data.qrCode || "",
          description: response.data.description || "",
          billBluetoothPrinter: {
            address: response.data.billPrinterAddress || "",
            enabled: response.data.billPrinterEnabled || false,
            name: "",
            status: 'disconnected' as PrinterStatus
          },
          kotBluetoothPrinter: {
            address: response.data.kotPrinterAddress || "",
            enabled: response.data.kotPrinterEnabled || false,
            name: "",
            status: 'disconnected' as PrinterStatus
          }
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Fallback to localStorage if API fails
      const key = getRestaurantKey("settings", user.restaurantId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const storedSettings = JSON.parse(stored);
        setSettings({
          name: storedSettings.name || user.restaurantName || "",
          address: storedSettings.address || "",
          phone: storedSettings.phone || "",
          email: storedSettings.email || "",
          website: storedSettings.website || "",
          gstin: storedSettings.gstin || "",
          logo: storedSettings.logo || "",
          qrCode: storedSettings.qrCode || "",
          description: storedSettings.description || "",
          billBluetoothPrinter: storedSettings.billBluetoothPrinter || billPrinterDefaults,
          kotBluetoothPrinter: storedSettings.kotBluetoothPrinter || kotPrinterDefaults
        });
      } else {
        // If no stored settings, try to load from API response format
        try {
          const response = await makeApi(`/api/settings/${user.restaurantId}`, "GET");
          if (response.data) {
            setSettings({
              name: response.data.name || user.restaurantName || "",
              address: response.data.address || "",
              phone: response.data.phone || "",
              email: response.data.email || "",
              website: response.data.website || "",
              gstin: response.data.gstin || "",
              logo: response.data.logo || "",
              qrCode: response.data.qrCode || "",
              description: response.data.description || "",
              billBluetoothPrinter: {
                address: response.data.billPrinterAddress || "",
                enabled: response.data.billPrinterEnabled || false,
                name: "",
                status: 'disconnected' as PrinterStatus
              },
              kotBluetoothPrinter: {
                address: response.data.kotPrinterAddress || "",
                enabled: response.data.kotPrinterEnabled || false,
                name: "",
                status: 'disconnected' as PrinterStatus
              }
            });
          }
        } catch (apiError) {
          console.error("Error loading settings from API in fallback:", apiError);
          // Use defaults
          setSettings(prev => ({
            ...prev,
            billBluetoothPrinter: billPrinterDefaults,
            kotBluetoothPrinter: kotPrinterDefaults
          }));
        }
      toast.error("Failed to load settings");
    }
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({
          ...settings,
          logo: reader.result as string,
        });
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQRCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("QR code size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({
          ...settings,
          qrCode: reader.result as string,
        });
        toast.success("QR code uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!settings.name || !settings.address || !settings.phone) {
      toast.error("Please fill required fields");
      return;
    }

    setSaving(true);
    try {
      console.log("Saving settings:", {
        restaurantId: user.restaurantId,
        hasLogo: !!settings.logo,
        hasQRCode: !!settings.qrCode,
        logoLength: settings.logo?.length || 0,
        qrCodeLength: settings.qrCode?.length || 0
      });

      const response = await makeApi(
        `/api/settings/${user.restaurantId}`,
        "PUT",
        settings
      );
      
      if (response.data) {
        // Save to localStorage as backup
        const key = getRestaurantKey("settings", user.restaurantId);
        localStorage.setItem(key, JSON.stringify(settings));
        
        // Save printer settings individually
        const billKey = getRestaurantKey("billBluetoothPrinter", user.restaurantId);
        const kotKey = getRestaurantKey("kotBluetoothPrinter", user.restaurantId);
        
        if (settings.billBluetoothPrinter) {
          localStorage.setItem(billKey, JSON.stringify(settings.billBluetoothPrinter));
        }
        if (settings.kotBluetoothPrinter) {
          localStorage.setItem(kotKey, JSON.stringify(settings.kotBluetoothPrinter));
        }
      }
      
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrinterTest = async (printerType: 'bill' | 'kot') => {
    const printer = printerType === 'bill' ? settings.billBluetoothPrinter : settings.kotBluetoothPrinter;
    // Resolve address from localStorage / saved config / state
    const resolvedAddress = resolvePrinterAddressFromStorage(printerType);
    if (!resolvedAddress) {
      toast.error(`Please set up the ${printerType.toUpperCase()} Bluetooth printer first`);
      return;
    }
    
    setIsTestingPrint(true);

    // Compute preferred device address: prefer restaurant-specific settings, then global restaurantSettings, then saved setting
    const restaurantSettingsKey = user?.restaurantId ? `restaurantSettings_${user.restaurantId}` : "restaurantSettings";
    const restaurantSettingsRaw = localStorage.getItem(restaurantSettingsKey) || localStorage.getItem("restaurantSettings");
    let globalSettings: any = null;
    if (restaurantSettingsRaw) {
      try {
        globalSettings = JSON.parse(restaurantSettingsRaw);
      } catch (err) {
        globalSettings = null;
      }
    }

    const preferredAddress = printerType === 'bill'
      ? (globalSettings?.billPrinterAddress || globalSettings?.billBluetoothPrinter?.address || resolvedAddress || null)
      : (globalSettings?.kotPrinterAddress || globalSettings?.kotBluetoothPrinter?.address || resolvedAddress || null);

    const deviceName = printer?.name || globalSettings?.name || (printerType === 'bill' ? 'Bill Printer' : 'KOT Printer');

    try {
      if (window.MOBILE_CHANNEL) {
        // Create a small canvas with text indicating the printer type and address
        const canvas = document.createElement('canvas');
        canvas.width = 384; // typical thermal width in px
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          // Title line
          ctx.font = '22px Arial';
          const title = printerType === 'bill' ? 'Bill printer working' : 'KOT printer working';
          ctx.fillText(title, canvas.width / 2, 40);
          // Address line (if available)
          ctx.font = '16px Arial';
          const addrText = preferredAddress ? `Address: ${preferredAddress}` : 'Address: (not set)';
          ctx.fillText(addrText, canvas.width / 2, 80);
          // App/restaurant name line
          ctx.font = '14px Arial';
          const nameText = deviceName || '';
          ctx.fillText(nameText, canvas.width / 2, 120);
        }

        const imgData = canvas.toDataURL('image/png');

        window.MOBILE_CHANNEL.postMessage(JSON.stringify({
          event: 'flutterPrint',
          deviceMacAddress: preferredAddress,
          deviceName: deviceName,
          imageBase64: imgData.replace('data:image/png;base64,', ''),
        }));

        if (preferredAddress) {
          if (printerType === 'bill') {
            toast.success(`Bill printer working with address: ${preferredAddress}`);
          } else {
            toast.success(`KOT printer working with address: ${preferredAddress}`);
          }
        } else {
          if (printerType === 'bill') {
            toast.success('Bill printer working');
          } else {
            toast.success('KOT printer working');
          }
        }
      } else {
        // Fallback: use existing printerService testPrint for browser/bluetooth path
        await printerService.testPrint({
          ...printer,
          serviceUuid: BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID,
          characteristicUuid: BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID
        });
        if (preferredAddress) {
          toast.success(`Printer is working fine: ${deviceName} (${preferredAddress})`);
        } else {
          toast.success(`Printer is working fine: ${deviceName}`);
        }
      }
    } catch (error: any) {
      console.error('Error testing printer:', error);
      toast.error(`Failed to print test page: ${error?.message || error}`);
    } finally {
      setIsTestingPrint(false);
    }
  };

  const handleConnectToDevice = async (deviceAddress: string, printerType: 'bill' | 'kot') => {
    try {
      // Update settings with the selected device address
      let updatedSettings: RestaurantSettings;
      if (printerType === 'bill') {
        updatedSettings = {
          ...settings,
          billBluetoothPrinter: {
            ...(settings.billBluetoothPrinter || {}),
            address: deviceAddress,
            enabled: true,
            status: 'connected' as PrinterStatus,
          },
        };
      } else {
        updatedSettings = {
          ...settings,
          kotBluetoothPrinter: {
            ...(settings.kotBluetoothPrinter || {}),
            address: deviceAddress,
            enabled: true,
            status: 'connected' as PrinterStatus,
          },
        };
      }

      setSettings(updatedSettings);
      setShowDeviceDialog(false);

      toast.success(`Selected device: ${deviceAddress}`);
    } catch (error) {
      console.error('Error selecting device:', error);
      toast.error('Failed to select device');
    }
  };

  const getConnectionStatusText = (printerType: 'bill' | 'kot') => {
    const printer = printerType === 'bill' 
      ? settings.billBluetoothPrinter 
      : settings.kotBluetoothPrinter;
    switch (printer?.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getConnectionStatusColor = (printerType: 'bill' | 'kot') => {
    const printer = printerType === 'bill' 
      ? settings.billBluetoothPrinter 
      : settings.kotBluetoothPrinter;
    switch (printer?.status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleScanDevices = async () => {
    setIsScanningDevices(true);
    try {
      const devices = await printerService.scanDevices();
      setAvailableDevices(devices);
      setShowDeviceDialog(true);
      toast.success(`Found ${devices.length} devices`);
    } catch (error: any) {
      console.error('Error scanning devices:', error);
      toast.error(`Failed to scan devices: ${error.message}`);
    } finally {
      setIsScanningDevices(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between " style={{marginTop:"20px"}}>
        <div>
          <h1 className="text-3xl mb-2"> Settings</h1>
          
        </div>
        <Button onClick={handleSave} className="gap-2" disabled={saving || loading}>
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) =>
                      setSettings({ ...settings, name: e.target.value })
                    }
                    placeholder="Enter restaurant name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  placeholder="Enter restaurant address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                    placeholder="restaurant@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) =>
                      setSettings({ ...settings, website: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={settings.gstin}
                    onChange={(e) =>
                      setSettings({ ...settings, gstin: e.target.value })
                    }
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={settings.description}
                    onChange={(e) =>
                      setSettings({ ...settings, description: e.target.value })
                    }
                    placeholder="Brief description"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Bluetooth Printer Settings */}
          <Card className="p-6">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Bluetooth Printer Configuration
            </h2>
            <div className="space-y-6">
              {/* Bill Printer Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Bill Printer</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${getConnectionStatusColor('bill')}`}>
                      {getConnectionStatusText('bill')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="billPrinterAddress">Bill Printer Bluetooth Address</Label>
                  <Input
                    id="billPrinterAddress"
                    value={settings.billBluetoothPrinter.address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        billBluetoothPrinter: {
                          ...settings.billBluetoothPrinter,
                          address: e.target.value
                        }
                      })
                    }
                    placeholder="e.g., 00:11:22:33:44:55"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleScanDevices}
                    disabled={isScanningDevices}
                  >
                    {isScanningDevices ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Scan Devices
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handlePrinterTest('bill')}
                    disabled={isTestingPrint || !resolvePrinterAddressFromStorage('bill')}
                  >
                    {isTestingPrint ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4" />
                    )}
                    Test Bill Print
                  </Button>
                  
                </div>
              </div>

              <Separator />

              {/* KOT Printer Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">KOT Printer</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${getConnectionStatusColor('kot')}`}>
                      {getConnectionStatusText('kot')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="kotPrinterAddress">KOT Printer Bluetooth Address</Label>
                  <Input
                    id="kotPrinterAddress"
                    value={settings.kotBluetoothPrinter.address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        kotBluetoothPrinter: {
                          ...settings.kotBluetoothPrinter,
                          address: e.target.value
                        }
                      })
                    }
                    placeholder="e.g., 00:11:22:33:44:55"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleScanDevices}
                    disabled={isScanningDevices}
                  >
                    {isScanningDevices ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Scan Devices
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handlePrinterTest('kot')}
                    disabled={isTestingPrint || !resolvePrinterAddressFromStorage('kot')}
                  >
                    {isTestingPrint ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4" />
                    )}
                    Test KOT Print
                  </Button>
             
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Configure your Bluetooth printer for receipt printing. Use "Scan Devices" to find available printers and "Test Print" to verify the connection.
              </p>
            </div>

            {/* Device Selection Dialog */}
            <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Bluetooth Printer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {availableDevices.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Available devices:</p>
                      {availableDevices.map((device, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Bluetooth className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {device.id}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleConnectToDevice(device.id, 'bill')}
                              className="gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Bill
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConnectToDevice(device.id, 'kot')}
                              className="gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              KOT
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No devices found. Make sure your printer is turned on and in pairing mode.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card className="p-6">
            <h2 className="text-xl mb-4">Restaurant Logo</h2>
            <div className="space-y-4">
              {settings.logo ? (
                <div className="space-y-3">
                  <div className="w-full aspect-square border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={settings.logo}
                      alt="Restaurant Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSettings({ ...settings, logo: "" })}
                  >
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <div>
                  <Label
                    htmlFor="logo"
                    className="cursor-pointer"
                  >
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm mb-1">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Logo will appear on bills and receipts
              </p>
            </div>
          </Card>

          {/* QR Code Upload */}
          <Card className="p-6">
            <h2 className="text-xl mb-4">QR Code</h2>
            <div className="space-y-4">
              {settings.qrCode ? (
                <div className="space-y-3">
                  <div className="w-full aspect-square border rounded-lg overflow-hidden bg-muted flex items-center justify-center max-w-xs mx-auto">
                    <img
                      src={settings.qrCode}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSettings({ ...settings, qrCode: "" })}
                  >
                    Remove QR Code
                  </Button>
                </div>
              ) : (
                <div>
                  <Label
                    htmlFor="qrCode"
                    className="cursor-pointer"
                  >
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm mb-1">
                        Click to upload QR code
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="qrCode"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQRCodeUpload}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                QR code will appear on bills for customers to scan and view menu
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Restaurant ID: <span className="font-mono">{user?.restaurantId}</span>
              </p>
              <p className="text-muted-foreground">
                Account Type: <span className="font-semibold">Administrator</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}