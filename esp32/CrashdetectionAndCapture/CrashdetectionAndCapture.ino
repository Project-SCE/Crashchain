#include <Wire.h>
#define sensor_t mpu_sensor_t
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#undef sensor_t

#include <WiFi.h>
#include <WiFiClient.h>
#include "esp_camera.h"

const char* ssid = "realme 8";
const char* password = "12345678";

const char* serverUrl = "192.168.248.91";
const int serverPort = 3000;
const char* serverPath = "/api/upload";

#define SDA_PIN 2
#define SCL_PIN 14

const float ACCEL_THRESHOLD = 3.5; // Higher threshold for crashes

Adafruit_MPU6050 mpu;

#define PWDN_GPIO_NUM  32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM  0
#define SIOD_GPIO_NUM  26
#define SIOC_GPIO_NUM  27
#define Y9_GPIO_NUM    35
#define Y8_GPIO_NUM    34
#define Y7_GPIO_NUM    39
#define Y6_GPIO_NUM    36
#define Y5_GPIO_NUM    21
#define Y4_GPIO_NUM    19
#define Y3_GPIO_NUM    18
#define Y2_GPIO_NUM     5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM  23
#define PCLK_GPIO_NUM  22

#define NUM_READINGS 10
float accel_readings[NUM_READINGS] = {0};
int current_index = 0;

float getSmoothedAcceleration(float magnitude) {
  accel_readings[current_index] = magnitude;
  current_index = (current_index + 1) % NUM_READINGS;

  float sum = 0;
  for (int i = 0; i < NUM_READINGS; i++) {
    sum += accel_readings[i];
  }
  return sum / NUM_READINGS;
}

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
    Serial.println("Failed to find MPU6050 sensor!");
    while (1) delay(1000);
  }
  Serial.println("MPU6050 initialized successfully!");

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

  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return;
  }
  Serial.println("Camera initialized successfully");
}

void loop() {
  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);

  float magnitude = sqrt(pow(accel.acceleration.x, 2) +
                         pow(accel.acceleration.y, 2) +
                         pow(accel.acceleration.z, 2)) - 9.8;
  if (magnitude < 0) magnitude = 0;

  float smoothed_magnitude = getSmoothedAcceleration(magnitude);

  if (smoothed_magnitude > ACCEL_THRESHOLD) {
    Serial.println("Crash detected! Capturing image...");
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed.");
      return;
    }
    // Upload image logic
    esp_camera_fb_return(fb);
  }
  delay(100);
}
