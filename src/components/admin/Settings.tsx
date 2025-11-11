import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Settings as SettingsIcon, Upload, Save } from "lucide-react";
import { getCurrentUser, getRestaurantKey } from "../../utils/auth";
import { toast } from "sonner@2.0.3";
import { makeApi } from "../../api/makeapi";

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
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
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
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Fallback to localStorage if API fails
      const key = getRestaurantKey("settings", user.restaurantId);
      const stored = localStorage.getItem(key);
      if (stored) {
        setSettings(JSON.parse(stored));
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
  try {
    const { makeApi } = await import("../../api/makeapi");
    const response = await makeApi(`/api/settings/${restaurantId}`, "GET");
    if (response.data) {
      return {
        name: response.data.name || "",
        address: response.data.address || "",
        phone: response.data.phone || "",
        email: response.data.email || "",
        website: response.data.website || "",
        gstin: response.data.gstin || "",
        logo: response.data.logo || "",
        qrCode: response.data.qrCode || "",
        description: response.data.description || "",
      };
    }
  } catch (error) {
    console.error("Error fetching settings from API, falling back to localStorage:", error);
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
  };
}
