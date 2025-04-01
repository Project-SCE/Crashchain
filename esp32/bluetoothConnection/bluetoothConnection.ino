#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEClient.h>
#include <BLEAdvertisedDevice.h>

// OBD-II UUIDs (replace with actual UUIDs for your scanner)
#define OBD_SERVICE_UUID        "000018f0-0000-1000-8000-00805f9b34fb"
#define OBD_CHARACTERISTIC_UUID "00002af0-0000-1000-8000-00805f9b34fb"

BLEClient* pClient = nullptr;
BLEScan* pBLEScan = nullptr;
bool deviceConnected = false;
BLEAdvertisedDevice* obdDevice = nullptr;

// Callback class for BLE device discovery
class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    Serial.print("Found Device: ");
    Serial.println(advertisedDevice.getName().c_str());

    if (advertisedDevice.haveServiceUUID() && advertisedDevice.getServiceUUID().equals(BLEUUID(OBD_SERVICE_UUID))) {
      Serial.println("OBD-II Scanner Found!");
      obdDevice = new BLEAdvertisedDevice(advertisedDevice);
      deviceConnected = true;
      pBLEScan->stop(); // Stop scanning once device is found
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE...");

  // Initialize BLE
  BLEDevice::init("ESP32-OBD");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);

  // Start scanning for devices
  Serial.println("Scanning for BLE devices...");
  pBLEScan->start(10, false);

  // Wait for device discovery
  while (!deviceConnected) {
    delay(100);
  }

  // Connect to the discovered OBD-II scanner
  if (obdDevice != nullptr) {
    Serial.println("Connecting to OBD-II scanner...");
    pClient = BLEDevice::createClient();
    pClient->connect(obdDevice);
    Serial.println("Connected to OBD-II scanner!");

    // Access the OBD-II service and characteristic
    BLERemoteService* pService = pClient->getService(OBD_SERVICE_UUID);
    if (pService) {
      BLERemoteCharacteristic* pCharacteristic = pService->getCharacteristic(OBD_CHARACTERISTIC_UUID);
      if (pCharacteristic) {
        // Send an OBD-II command
        sendOBDCommand(pCharacteristic, "010D"); // Request vehicle speed
      }
    } else {
      Serial.println("OBD-II service not found!");
    }
  }
}

void loop() {
  // Keep the BLE connection alive
  if (deviceConnected) {
    delay(2000);
  } else {
    Serial.println("Device disconnected. Reconnecting...");
    setup();
  }
}

void sendOBDCommand(BLERemoteCharacteristic* pCharacteristic, const char* command) {
  if (pCharacteristic->canWrite()) {
    // Append a carriage return to the command
    String cmd = String(command) + "\r";

    // Write the command to the BLE characteristic
    pCharacteristic->writeValue(cmd.c_str(), cmd.length());
    Serial.println("Command sent: " + cmd);

    // Wait for response (read characteristic value)
    if (pCharacteristic->canRead()) {
      String value = pCharacteristic->readValue(); // Read value as Arduino String
      Serial.println("Response: " + value);
    } else {
      Serial.println("Characteristic cannot be read.");
    }
  } else {
    Serial.println("Characteristic cannot be written to.");
  }
}

