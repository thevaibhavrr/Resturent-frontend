// Test Bluetooth printer connection
console.log("=== Bluetooth Printer Test ===");

// Check if Web Bluetooth API is supported
if (!navigator.bluetooth) {
  console.error("❌ Web Bluetooth API is not supported in this browser");
} else {
  console.log("✅ Web Bluetooth API is supported");
}

// Check localStorage for saved printer config
const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
if (user && user.restaurantId) {
  const key = `restaurant_${user.restaurantId}_bluetoothPrinter`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    const config = JSON.parse(stored);
    console.log("📋 Saved Bluetooth printer config:", config);
    
    if (config.enabled) {
      console.log("🔄 Printer is enabled, attempting connection test...");
      
      // Test connection
      navigator.bluetooth.requestDevice({
        filters: [{ services: [config.serviceUuid] }],
        optionalServices: [config.serviceUuid]
      })
      .then(device => {
        console.log("✅ Device found:", device.name);
        return device.gatt.connect();
      })
      .then(server => {
        console.log("✅ GATT server connected");
        return server.getPrimaryService(config.serviceUuid);
      })
      .then(service => {
        console.log("✅ Service obtained");
        return service.getCharacteristic(config.characteristicUuid);
      })
      .then(characteristic => {
        console.log("✅ Characteristic obtained - Printer ready!");
      })
      .catch(error => {
        console.error("❌ Connection test failed:", error);
      });
    } else {
      console.log("⚠️ Printer is disabled in settings");
    }
  } else {
    console.log("❌ No saved Bluetooth printer config found");
  }
} else {
  console.log("❌ No current user or restaurant ID found");
}
