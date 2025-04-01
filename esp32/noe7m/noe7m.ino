#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

TinyGPSPlus gps;
HardwareSerial SerialGPS(2); // Use UART2

void setup() {
  Serial.begin(115200);
  SerialGPS.begin(9600, SERIAL_8N1, 13, 14);  // RX=13, TX=14
  
  Serial.println(F("NEO-7M GPS Detailed Status"));
  Serial.println(F("-------------------------"));
}

void loop() {
  // Process available GPS data
  while (SerialGPS.available() > 0) {
    if (gps.encode(SerialGPS.read())) {
      displayGPSDetails();
    }
  }

  // Check if GPS is working after 5 seconds
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println(F("WARNING: No GPS data - check wiring!"));
    while(true);
  }
}

void displayGPSDetails() {
  Serial.println(F("\n=== GPS Status ==="));
  
  // Location
  Serial.print(F("Location: ")); 
  if (gps.location.isValid()) {
    Serial.print(F("Lat: "));
    Serial.print(gps.location.lat(), 6);
    Serial.print(F(" Long: "));
    Serial.println(gps.location.lng(), 6);
  } else {
    Serial.println(F("INVALID"));
  }

  // Satellites
  Serial.print(F("Satellites: "));
  if (gps.satellites.isValid()) {
    Serial.print(gps.satellites.value());
    Serial.print(F(" in view. Quality: "));
    Serial.println(gps.hdop.value()); // Lower = better. <1 = excellent
  } else {
    Serial.println(F("INVALID"));
  }

  // Altitude
  Serial.print(F("Altitude: "));
  if (gps.altitude.isValid()) {
    Serial.print(gps.altitude.meters());
    Serial.println(F("m"));
  } else {
    Serial.println(F("INVALID"));
  }

  // Speed
  Serial.print(F("Speed: "));
  if (gps.speed.isValid()) {
    Serial.print(gps.speed.kmph());
    Serial.println(F(" km/h"));
  } else {
    Serial.println(F("INVALID"));
  }

  // Course
  Serial.print(F("Course: "));
  if (gps.course.isValid()) {
    Serial.print(gps.course.deg());
    Serial.println(F("°"));
  } else {
    Serial.println(F("INVALID"));
  }

  // Date/Time
  Serial.print(F("Date/Time: "));
  if (gps.date.isValid() && gps.time.isValid()) {
    Serial.print(gps.date.year());
    Serial.print(F("-"));
    Serial.print(gps.date.month());
    Serial.print(F("-"));
    Serial.print(gps.date.day());
    Serial.print(F(" "));
    if (gps.time.hour() < 10) Serial.print(F("0"));
    Serial.print(gps.time.hour());
    Serial.print(F(":"));
    if (gps.time.minute() < 10) Serial.print(F("0"));
    Serial.print(gps.time.minute());
    Serial.print(F(":"));
    if (gps.time.second() < 10) Serial.print(F("0"));
    Serial.println(gps.time.second());
  } else {
    Serial.println(F("INVALID"));
  }

  // Stats
  Serial.println(F("\n=== Signal Stats ==="));
  Serial.print(F("Characters processed: ")); 
  Serial.println(gps.charsProcessed());
  Serial.print(F("Sentences with fix: ")); 
  Serial.println(gps.sentencesWithFix());
  Serial.print(F("Failed checksum: ")); 
  Serial.println(gps.failedChecksum());
  
  // Show raw NMEA sentences
  Serial.println(F("\n=== Raw NMEA Data ==="));
  while (SerialGPS.available() > 0) {
    Serial.write(SerialGPS.read());
  }
  
  Serial.println(F("\n-----------------"));
  delay(2000); // Update every 2 seconds
}