import { getRestaurantSettings } from "../components/admin/Settings";
import { getCurrentUser } from "./auth";

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

class SettingsService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = "restaurantSettings";
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Get settings from localStorage
  getSettings(): RestaurantSettings | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error reading settings from localStorage:", error);
      return null;
    }
  }

  // Save settings to localStorage
  private saveSettings(settings: RestaurantSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      console.log("Settings saved to localStorage:", settings);
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
    }
  }

  // Fetch settings from API and save to localStorage
  private async fetchAndSaveSettings(): Promise<void> {
    try {
      const user = getCurrentUser();
      if (!user?.restaurantId) {
        console.log("No user or restaurantId found, skipping settings fetch");
        return;
      }

      console.log("Fetching restaurant settings for:", user.restaurantId);
      const settings = await getRestaurantSettings(user.restaurantId);
      this.saveSettings(settings);
    } catch (error) {
      console.error("Error fetching restaurant settings:", error);
      // Don't overwrite existing settings if API fails
    }
  }

  // Initialize the service
  async initialize(): Promise<void> {
    console.log("Initializing SettingsService...");

    // Fetch settings immediately
    await this.fetchAndSaveSettings();

    // Set up periodic refresh
    this.refreshInterval = setInterval(async () => {
      console.log("Refreshing restaurant settings...");
      await this.fetchAndSaveSettings();
    }, this.REFRESH_INTERVAL);

    console.log("SettingsService initialized with 5-minute refresh interval");
  }

  // Cleanup
  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log("SettingsService destroyed");
    }
  }

  // Force refresh settings
  async refresh(): Promise<void> {
    await this.fetchAndSaveSettings();
  }
}

// Create singleton instance
export const settingsService = new SettingsService();
