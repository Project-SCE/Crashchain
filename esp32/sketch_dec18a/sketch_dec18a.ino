#include <FS.h>
#include <SD_MMC.h>

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("Initializing SD card...");
    if (!SD_MMC.begin()) {
        Serial.println("SD card initialization failed!");
        return;
    }

    Serial.println("SD card initialized successfully!");
}

void loop() {
    // Nothing to do in loop
}
