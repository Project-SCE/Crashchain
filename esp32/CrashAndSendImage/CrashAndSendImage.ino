#include <Wire.h>
#define sensor_t mpu_sensor_t
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#undef sensor_t
#include <HTTPClient.h>
#include <WiFi.h>
#include "esp_camera.h"

const char* ssid = "SAINTGITS";
const char* password = "saintgitswifi";

const char* obdServerUrl = "http://10.10.160.81:3000/obd"; // Replace with your server's IP for OBD data
const char* imageServerUrl = "http://10.10.160.81:3000/image"; // Replace with your server's IP for image upload

#define SDA_PIN 2
#define SCL_PIN 14
#define ACCEL_THRESHOLD 3.5

Adafruit_MPU6050 mpu;

// Camera pin definitions for AI Thinker ESP32-CAM
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected");

  Wire.begin(SDA_PIN, SCL_PIN);

  if (!mpu.begin(0x68, &Wire)) {
    Serial.println("Failed to initialize MPU6050!");
    while (true);
  }
  Serial.println("MPU6050 initialized");

  // Initialize the camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 10;
  config.fb_count = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera init failed");
    while (true);
  }
  Serial.println("Camera initialized");
}

void sendObdData() {
  HTTPClient http;
  http.begin(obdServerUrl);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"VIN\": \"1HGCM82633A123456\", \"speed\": 45, \"throttle_position\": 30, \"brake_position\": 40, \"acceleration\": 15.5}";
  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    Serial.printf("OBD Data Response Code: %d\n", httpResponseCode);
  } else {
    Serial.printf("Failed to send OBD data: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

void sendImage(camera_fb_t* fb) {
  if (!fb || fb->len <= 0) {
    Serial.println("Invalid frame buffer. Skipping upload.");
    return;
  }

  HTTPClient http;
  http.begin(imageServerUrl);
  http.addHeader("Content-Type", "image/jpeg");

  int httpResponseCode = http.POST(fb->buf, fb->len);

  if (httpResponseCode > 0) {
    Serial.printf("Image Upload Response Code: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("Server response: " + response);
  } else {
    Serial.printf("Failed to upload image: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  esp_camera_fb_return(fb);
}

void loop() {
  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);

  float magnitude = sqrt(pow(accel.acceleration.x, 2) +
                         pow(accel.acceleration.y, 2) +
                         pow(accel.acceleration.z, 2)) - 9.8;
  Serial.println(magnitude);

  if (magnitude > ACCEL_THRESHOLD) {
    Serial.println("Crash detected!");

    // Capture and send OBD data
    sendObdData();

    // Capture and send image
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Failed to capture image");
    } else {
      Serial.printf("Image size: %d bytes\n", fb->len);
      sendImage(fb);
      esp_camera_fb_return(fb);
    }
  }

  delay(1000); // Sampling rate
}
