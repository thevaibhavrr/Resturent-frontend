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
import { BLUETOOTH_PRINTER_CONFIG } from "../../config/bluetoothPrinter";
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
  bluetoothPrinter: {
    name: string;
    address: string;
    enabled: boolean;
    serviceUuid: string;
    characteristicUuid: string;
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
    bluetoothPrinter: {
      name: "",
      address: "",
      enabled: false,
      serviceUuid: BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID,
      characteristicUuid: BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID
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
    if (user && settings.bluetoothPrinter) {
      const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
      localStorage.setItem(key, JSON.stringify(settings.bluetoothPrinter));
      // Update printer service with new config
      printerService.updateSavedPrinterConfig(settings.bluetoothPrinter);
    }
  }, [settings.bluetoothPrinter, user, printerService]);

  // Load saved printer config on mount
  useEffect(() => {
    if (user?.restaurantId) {
      const key = getRestaurantKey("bluetoothPrinter", user.restaurantId);
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const config: SavedPrinterConfig = JSON.parse(stored);
          printerService.updateSavedPrinterConfig(config);
        } catch (error) {
          console.warn('Error loading saved printer config:', error);
        }
      }
    }
  }, [user, printerService]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // First, load Bluetooth printer settings from localStorage for immediate persistence
    const bluetoothKey = getRestaurantKey("bluetoothPrinter", user.restaurantId);
    const storedBluetoothPrinter = localStorage.getItem(bluetoothKey);
    let bluetoothPrinterDefaults = {
      name: "",
      address: "",
      enabled: false,
      serviceUuid: BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID,
      characteristicUuid: BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID
    };
    
    if (storedBluetoothPrinter) {
      try {
        bluetoothPrinterDefaults = JSON.parse(storedBluetoothPrinter);
      } catch (error) {
        console.error("Error parsing stored Bluetooth printer settings:", error);
      }
    }
    
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
          bluetoothPrinter: response.data.bluetoothPrinter || bluetoothPrinterDefaults
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
          bluetoothPrinter: storedSettings.bluetoothPrinter || bluetoothPrinterDefaults
        });
      } else {
        // Set default from user data
        setSettings({
          name: user.restaurantName || "",
          address: "",
          phone: "",
          email: "",
          website: "",
          gstin: "",
          logo: "",
          qrCode: "",
          description: "",
          bluetoothPrinter: bluetoothPrinterDefaults
        });
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
        console.log("Settings saved successfully:", response.data);
        
        // Update local state with response data to ensure sync
        if (response.data.settings) {
          setSettings({
            ...settings,
            ...response.data.settings
          });
        }
        
        // Also save to localStorage as backup
        const key = getRestaurantKey("settings", user.restaurantId);
        const settingsToSave = response.data.settings || settings;
        localStorage.setItem(key, JSON.stringify(settingsToSave));
        
        toast.success("Settings saved successfully");
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`Failed to save settings: ${errorMessage}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  // Bluetooth printer functions
  const handleTestPrint = async () => {
    if (!navigator.bluetooth) {
      toast.error('Web Bluetooth API is not supported in your browser');
      return;
    }

    setIsTestingPrint(true);
    try {
      const testContent = `
===============================
        TEST PRINT
===============================
Date: ${new Date().toLocaleString()}
Printer: ${settings.bluetoothPrinter.name || 'Unknown'}
Address: ${settings.bluetoothPrinter.address || 'Not set'}
Service UUID: ${settings.bluetoothPrinter.serviceUuid}
===============================
      PRINT TEST SUCCESSFUL!
===============================

`;
      const success = await printerService.print(testContent);
      if (success) {
        toast.success('Test print sent successfully!');
      } else {
        toast.error('Test print failed');
      }
    } catch (error) {
      console.error('Test print error:', error);
      toast.error(`Test print failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingPrint(false);
    }
  };

  const handleScanDevices = async () => {
    if (!navigator.bluetooth) {
      toast.error('Web Bluetooth API is not supported in your browser');
      return;
    }

    setIsScanningDevices(true);
    setAvailableDevices([]);

    try {
      // Request device discovery with acceptAllDevices to see all available devices
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [settings.bluetoothPrinter.serviceUuid || BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID]
      });

      if (device) {
        const deviceInfo = {
          name: device.name || 'Unknown Device',
          id: device.id || 'unknown'
        };

        setAvailableDevices([deviceInfo]);
        setShowDeviceDialog(true);
        toast.success(`Found device: ${deviceInfo.name}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        toast.info('No devices selected');
      } else {
        console.error('Device scan error:', error);
        toast.error('Failed to scan for devices');
      }
    } finally {
      setIsScanningDevices(false);
    }
  };

  const handleConnectToDevice = async (deviceName: string) => {
    try {
      // Update settings with the selected device name
      const updatedSettings = {
        ...settings,
        bluetoothPrinter: {
          ...settings.bluetoothPrinter,
          name: deviceName,
          enabled: true
        }
      };

      setSettings(updatedSettings);
      setShowDeviceDialog(false);

      toast.success(`Selected device: ${deviceName}`);
    } catch (error) {
      console.error('Error selecting device:', error);
      toast.error('Failed to select device');
    }
  };

  const getConnectionStatusText = () => {
    switch (printerStatus) {
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

  const getConnectionStatusColor = () => {
    switch (printerStatus) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Restaurant Settings</h1>
          <p className="text-muted-foreground">
            Manage your restaurant information and preferences
          </p>
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
                    placeholder="info@restaurant.com"
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
                    placeholder="www.restaurant.com"
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
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) =>
                    setSettings({ ...settings, description: e.target.value })
                  }
                  placeholder="Brief description about your restaurant"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Legal Information */}
          <Card className="p-6">
            <h2 className="text-xl mb-4">Legal Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={settings.gstin}
                  onChange={(e) =>
                    setSettings({ ...settings, gstin: e.target.value })
                  }
                  placeholder="22AAAAA0000A1Z5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Goods and Services Tax Identification Number
                </p>
              </div>
            </div>
          </Card>

          {/* Bluetooth Printer Settings */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl flex items-center gap-2">
                <Bluetooth className="w-5 h-5" />
                Bluetooth Printer Settings
              </h2>
              {settings.bluetoothPrinter.enabled && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${printerStatus === 'connected' ? 'bg-green-500' : printerStatus === 'connecting' ? 'bg-blue-500' : printerStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                    <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                      {getConnectionStatusText()}
                    </span>
                  </div>
                  {settings.bluetoothPrinter.address && (
                    <Badge variant="outline" className="text-xs">
                      {settings.bluetoothPrinter.address}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bluetoothEnabled"
                    checked={settings.bluetoothPrinter.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bluetoothPrinter: {
                          ...settings.bluetoothPrinter,
                          enabled: e.target.checked
                        }
                      })
                    }
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="bluetoothEnabled">Enable Bluetooth Printing</Label>
                </div>

                {settings.bluetoothPrinter.enabled && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleScanDevices}
                      disabled={isScanningDevices}
                      className="gap-2"
                    >
                      {isScanningDevices ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Scan Devices
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestPrint}
                      disabled={isTestingPrint || printerStatus === 'connecting'}
                      className="gap-2"
                    >
                      {isTestingPrint ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                      Test Print
                    </Button>
                  </div>
                )}
              </div>

              {settings.bluetoothPrinter.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="printerName">Printer Name</Label>
                      <Input
                        id="printerName"
                        value={settings.bluetoothPrinter.name}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bluetoothPrinter: {
                              ...settings.bluetoothPrinter,
                              name: e.target.value
                            }
                          })
                        }
                        placeholder="e.g., EPON TM-T82"
                      />
                    </div>
                    <div>
                      <Label htmlFor="printerAddress">Bluetooth Address</Label>
                      <div className="relative">
                        <Input
                          id="printerAddress"
                          value={settings.bluetoothPrinter.address}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              bluetoothPrinter: {
                                ...settings.bluetoothPrinter,
                                address: e.target.value
                              }
                            })
                          }
                          placeholder="e.g., 00:11:22:33:44:55"
                        />
                        {settings.bluetoothPrinter.connectedDeviceName && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceUuid">Service UUID</Label>
                      <Input
                        id="serviceUuid"
                        value={settings.bluetoothPrinter.serviceUuid}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bluetoothPrinter: {
                              ...settings.bluetoothPrinter,
                              serviceUuid: e.target.value
                            }
                          })
                        }
                        placeholder="e.g., 0000ff00-0000-1000-8000-00805f9b34fb"
                      />
                    </div>
                    <div>
                      <Label htmlFor="characteristicUuid">Characteristic UUID</Label>
                      <Input
                        id="characteristicUuid"
                        value={settings.bluetoothPrinter.characteristicUuid}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bluetoothPrinter: {
                              ...settings.bluetoothPrinter,
                              characteristicUuid: e.target.value
                            }
                          })
                        }
                        placeholder="e.g., 0000ff02-0000-1000-8000-00805f9b34fb"
                      />
                    </div>
                  </div>

                  {settings.bluetoothPrinter.connectedDeviceName && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Connected to: {settings.bluetoothPrinter.connectedDeviceName}
                        </span>
                        {settings.bluetoothPrinter.lastConnectedAt && (
                          <span className="text-xs text-green-600 ml-auto">
                            Last connected: {new Date(settings.bluetoothPrinter.lastConnectedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Configure your Bluetooth printer for receipt printing. Use "Scan Devices" to find available printers and "Test Print" to verify the connection.
                  </p>
                </>
              )}
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
                          <Button
                            size="sm"
                            onClick={() => handleConnectToDevice(device.name)}
                            className="gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Select
                          </Button>
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

        {/* Logo Upload */}
        <div className="space-y-6">
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

      {/* Save Button (Mobile) */}
      <div className="lg:hidden">
        <Button onClick={handleSave} className="w-full gap-2" disabled={saving || loading}>
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// Export function to get restaurant settings (with API fallback to localStorage)
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
        name: response.data.name || "",
        address: response.data.address || "",
        phone: response.data.phone || "",
        email: response.data.email || "",
        website: response.data.website || "",
        gstin: response.data.gstin || "",
        logo: response.data.logo || "",
        qrCode: response.data.qrCode || "",
        description: response.data.description || "",
        bluetoothPrinter: response.data.bluetoothPrinter || {
          name: "",
          address: "",
          enabled: false,
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
    bluetoothPrinter: {
      name: "",
      address: "",
      enabled: false,
      serviceUuid: BLUETOOTH_PRINTER_CONFIG.SERVICE_UUID,
      characteristicUuid: BLUETOOTH_PRINTER_CONFIG.CHARACTERISTIC_UUID
    }
  };
}
