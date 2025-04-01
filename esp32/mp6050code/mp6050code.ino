#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

#define SDA_PIN 2  // Change to the GPIO pin connected to SDA
#define SCL_PIN 14 // Change to the GPIO pin connected to SCL

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  Serial.println("Initializing MPU6050...");

  // Initialize I2C communication
  Wire.begin(SDA_PIN, SCL_PIN);

  // Initialize the MPU6050
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 sensor. Check wiring!");
    while (1) {
      delay(1000); // Stay here if MPU6050 is not found
    }
  }

  Serial.println("MPU6050 initialized successfully!");

  // Set sensor ranges (optional)
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);

  // Set sample rate (optional)
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("MPU6050 configuration complete.");
}

void loop() {
  // Read accelerometer and gyroscope data
  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);

  // Print accelerometer data
  Serial.print("Accelerometer (m/s^2): ");
  Serial.print("X = ");
  Serial.print(accel.acceleration.x, 2);
  Serial.print(", Y = ");
  Serial.print(accel.acceleration.y, 2);
  Serial.print(", Z = ");
  Serial.println(accel.acceleration.z, 2);

  // Print gyroscope data
  Serial.print("Gyroscope (deg/s): ");
  Serial.print("X = ");
  Serial.print(gyro.gyro.x, 2);
  Serial.print(", Y = ");
  Serial.print(gyro.gyro.y, 2);
  Serial.print(", Z = ");
  Serial.println(gyro.gyro.z, 2);

  // Print temperature
  Serial.print("Temperature (C): ");
  Serial.println(temp.temperature, 2);

  Serial.println("-------------------------------------");
  delay(500); // Delay for readability
}
