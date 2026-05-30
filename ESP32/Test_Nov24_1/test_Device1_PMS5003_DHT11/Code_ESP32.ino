/**
 * ============================================================
 * ESP32 Air Quality Monitor — with WiFiManager
 * ============================================================
 * อุปกรณ์: ESP32 + PMS5003 + DHT11 + RTC DS3231 + SD Card
 * ฟังก์ชัน:
 *   - อ่านค่า PM / Temp / Hum
 *   - ส่ง Google Sheets เมื่อ Online
 *   - บันทึก SD Card เมื่อ Offline
 *   - Auto Reconnect WiFi ทุก 5 นาที
 *   - Flush ข้อมูลจาก SD → Google Sheets เมื่อ WiFi กลับมา

 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <SD.h>
#include <DHT.h>
#include <HardwareSerial.h>
#include <Wire.h>
#include <RTClib.h>


// ============================================================
// การตั้งค่า Pin และฮาร์ดแวร์
// ============================================================
#define DHTPIN       15
#define DHTTYPE      DHT22
#define PMS_RX       22
#define PMS_TX       21
#define I2C_SDA      25
#define I2C_SCL      26
#define SD_CS        5

// ============================================================
// การตั้งค่าเวลา
// ============================================================
#define READ_INTERVAL_MS         2000UL
#define SEND_INTERVAL_MS       120000UL
#define WIFI_TIMEOUT_MS         10000UL
#define WIFI_RETRY_INTERVAL_MS 300000UL
#define HTTP_DELAY_MS             200UL
#define MAX_FLUSH_ROWS              50

// ============================================================
// WiFi / Google Script
// ============================================================
//const char* WIFI_SSID      = "53/139_2.4G";
//const char* WIFI_PASSWORD  = "DeX_0123new";
const char* WIFI_SSID      = "@SUT-IoT";
const char* WIFI_PASSWORD  = "";


const char* GOOGLE_SCRIPT =
"https://script.google.com/macros/s/AKfycbwe6SrrOPDcO8eCOEEX57zzcJ5T5XN7g5NgOce9c4fKVW5s2oOuWHyfzAR6ZqAf-pmQ/exec";

const char* DEVICE_NAME    = "ESP32_02";

const char* SD_FILENAME    = "/datalog.csv";
const char* SD_TEMP_FILE   = "/temp.csv";

const char* CSV_HEADER =
"date,time,pm1,pm2.5,pm10,temp,hum";

// ============================================================
// Hardware Objects
// ============================================================
RTC_DS3231 rtc;
DHT dht(DHTPIN, DHTTYPE);
HardwareSerial PMSSerial(2);

// ============================================================
// Sensor Structure
// ============================================================
struct SensorData {
  float pm1_0  = 0;
  float pm2_5  = 0;
  float pm10_0 = 0;
  float temp   = 0;
  float hum    = 0;
};

SensorData sensor;

// ============================================================
// Timer Variables
// ============================================================
unsigned long lastReadMs      = 0;
unsigned long lastSendMs      = 0;
unsigned long lastReconnectMs = 0;

// ============================================================
// URL Encode
// ============================================================
String urlEncode(const String& str) {

  String encoded = "";

  for (size_t i = 0; i < str.length(); i++) {

    char c = str[i];

    if (isalnum(c) || c == '-' || c == '_' ||
        c == '.' || c == '~') {

      encoded += c;

    } else {

      char hex[4];

      snprintf(hex, sizeof(hex),
               "%%%02X", (unsigned char)c);

      encoded += hex;
    }
  }

  return encoded;
}

// ============================================================
// RTC Date
// ============================================================
String getRTCDate() {

  DateTime now = rtc.now();

  char buf[11];

  snprintf(buf, sizeof(buf),
           "%04d-%02d-%02d",
           now.year(),
           now.month(),
           now.day());

  return String(buf);
}

// ============================================================
// RTC Time
// ============================================================
String getRTCTime() {

  DateTime now = rtc.now();

  char buf[9];

  snprintf(buf, sizeof(buf),
           "%02d:%02d:%02d",
           now.hour(),
           now.minute(),
           now.second());

  return String(buf);
}

// ============================================================
// Count SD Lines
// ============================================================
int countSDLines() {

  File file = SD.open(SD_FILENAME);

  if (!file) return 0;

  int count = 0;

  while (file.available()) {
    file.readStringUntil('\n');
    count++;
  }

  file.close();

  return count;
}

// ============================================================
// WiFi Status
// ============================================================
bool isWiFiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

// ============================================================
// Reconnect WiFi
// ============================================================
void reconnectWiFi() {

  if (isWiFiConnected()) return;

  Serial.println("[WiFi] Trying reconnect...");

  WiFi.disconnect(true);

  delay(1000);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - startAttempt < WIFI_TIMEOUT_MS) {

    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("\n[WiFi] Reconnected ✓");
    Serial.println("[WiFi] IP: " +
                   WiFi.localIP().toString());

  } else {

    Serial.println("\n[WiFi] Reconnect Failed");
  }
}

// ============================================================
// Read Sensors
// ============================================================
bool readSensors() {

  if (PMSSerial.available() < 32)
    return false;

  while (PMSSerial.available() > 32)
    PMSSerial.read();

  if (PMSSerial.read() != 0x42 ||
      PMSSerial.read() != 0x4D)
    return false;

  PMSSerial.read();
  PMSSerial.read();

  uint16_t data[13];

  for (int i = 0; i < 13; i++) {

    data[i] =
      ((uint16_t)PMSSerial.read() << 8)
      | PMSSerial.read();
  }

  sensor.pm1_0  = data[0];
  sensor.pm2_5  = data[1];
  sensor.pm10_0 = data[2];

  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (!isnan(t)) sensor.temp = t;
  if (!isnan(h)) sensor.hum  = h;

  return true;
}

// ============================================================
// Save to SD Card
// ============================================================
bool saveToSD(const String& dateStr,
              const String& timeStr,
              const SensorData& s) {

  File file = SD.open(SD_FILENAME,
                      FILE_APPEND);

  if (!file) {

    Serial.println("[SD] Open Failed");

    return false;
  }

  file.printf(
    "%s,%s,%.2f,%.2f,%.2f,%.2f,%.2f\n",
    dateStr.c_str(),
    timeStr.c_str(),
    s.pm1_0,
    s.pm2_5,
    s.pm10_0,
    s.temp,
    s.hum
  );

  file.close();

  Serial.println("[SD] Saved");

  return true;
}

// ============================================================
// Send to Google Sheets
// ============================================================
bool sendToGoogle(const String& dateStr,
                  const String& timeStr,
                  const SensorData& s) {

  if (!isWiFiConnected())
    return false;

  String url = String(GOOGLE_SCRIPT)
    + "?device="  + DEVICE_NAME
    + "&date="   + urlEncode(dateStr)
    + "&pm1="     + String(s.pm1_0, 2)
    + "&pm2_5="   + String(s.pm2_5, 2)
    + "&pm10="    + String(s.pm10_0, 2)
    + "&temp="    + String(s.temp, 2)
    + "&hum="     + String(s.hum, 2)
    + "&esptime=" + urlEncode(timeStr);

  WiFiClientSecure client;

  client.setInsecure();

  HTTPClient https;

  https.setFollowRedirects(
    HTTPC_STRICT_FOLLOW_REDIRECTS
  );

  bool success = false;

  if (https.begin(client, url)) {

    int httpCode = https.GET();

    success = (httpCode == 200);

    Serial.printf(
      "[HTTP] Code: %d\n",
      httpCode
    );

    https.end();
  }

  return success;
}

// ============================================================
// Flush SD → Google
// ============================================================
int flushSDtoGoogle() {

  if (!isWiFiConnected())
    return 0;

  File file = SD.open(SD_FILENAME);

  if (!file) {

    Serial.println("[SD] Open Failed");

    return 0;
  }

  File tempFile =
    SD.open(SD_TEMP_FILE, FILE_WRITE);

  if (!tempFile) {

    file.close();

    Serial.println("[SD] Temp File Failed");

    return 0;
  }

  int successCount = 0;

  while (file.available() &&
         successCount < MAX_FLUSH_ROWS) {

    String line =
      file.readStringUntil('\n');

    line.trim();

    if (line.isEmpty())
      continue;

    // Skip Header
    if (line == CSV_HEADER)
      continue;
    
    char dateStr[20];
    char timeStr[20];

    SensorData row;

    int parsed = sscanf(
      line.c_str(),
      "%19[^,],%19[^,],%f,%f,%f,%f,%f",
      dateStr,
      timeStr,
      &row.pm1_0,
      &row.pm2_5,
      &row.pm10_0,
      &row.temp,
      &row.hum
    );

    if (parsed == 7) {

      bool sent =
        sendToGoogle(
          String(dateStr),
          String(timeStr),
          row
        );

      if (sent) {

        successCount++;

        Serial.printf(
          "[FLUSH] ✓ %s PM1:%.2f PM2.5:%.2f PM10:%.2f Temp:%.2f Hum:%.2f\n",
          timeStr,
          row.pm1_0,
          row.pm2_5,
          row.pm10_0,
          row.temp,
          row.hum
        );

      } else {

        tempFile.println(line);

        Serial.printf(
          "[FLUSH] Failed Keep: %s\n",
          line.c_str()
        );
      }

    } else {

      tempFile.println(line);

      Serial.printf(
        "[FLUSH] Parse Error: %s\n",
        line.c_str()
      );
    }

    delay(HTTP_DELAY_MS);
  }

  // Copy Remaining Lines
  while (file.available()) {

    tempFile.println(
      file.readStringUntil('\n')
    );
  }

  file.close();
  tempFile.close();

  SD.remove(SD_FILENAME);

  SD.rename(SD_TEMP_FILE,
            SD_FILENAME);

  return successCount;
}

// ============================================================
// Setup
// ============================================================
void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println(
    "\n=== ESP32 Air Quality Monitor ==="
  );


  // DHT
  dht.begin();

  // PMS5003
  PMSSerial.begin(
    9600,
    SERIAL_8N1,
    PMS_RX,
    PMS_TX
  );

  // I2C
  Wire.begin(I2C_SDA, I2C_SCL);

  // RTC
  if (!rtc.begin()) {

    Serial.println(
      "[RTC] RTC Not Found"
    );

    while (true)
      delay(1000);
  }

  if (rtc.lostPower()) {

    Serial.println(
      "[RTC] Lost Power Set Compile Time"
    );

    rtc.adjust(
      DateTime(
        F(__DATE__),
        F(__TIME__)
      )
    );
  }

  Serial.println(
    "[RTC] " + getRTCTime()
  );

  // WiFi
  Serial.print(
    "[WiFi] Connecting..."
  );

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  unsigned long t0 = millis();

  while (!isWiFiConnected() &&
         millis() - t0 <
         WIFI_TIMEOUT_MS) {

    delay(500);

    Serial.print(".");
  }

  if (isWiFiConnected()) {

    Serial.println(
      "\n[WiFi] Connected"
    );

    Serial.println(
      "[WiFi] IP: " +
      WiFi.localIP().toString()
    );

  } else {

    Serial.println(
      "\n[WiFi] Failed Offline Mode"
    );
  }

  // SD Card
  if (!SD.begin(SD_CS)) {

    Serial.println(
      "[SD] Mount Failed"
    );

    return;
  }

  if (!SD.exists(SD_FILENAME)) {

    File f =
      SD.open(
        SD_FILENAME,
        FILE_WRITE
      );

    if (f) {

      f.println(CSV_HEADER);

      f.close();
    }
  }

  Serial.println(
    "[SD] Ready | Lines: " +
    String(countSDLines())
  );

  Serial.println(
    "================================\n"
  );
}

// ============================================================
// Loop
// ============================================================
void loop() {

  unsigned long now = millis();

  // ========================================================
  // Auto Reconnect WiFi
  // ========================================================
  if (!isWiFiConnected()) {

    if (now - lastReconnectMs >=
        WIFI_RETRY_INTERVAL_MS) {

      reconnectWiFi();

      lastReconnectMs = now;
    }
  }

  // ========================================================
  // Read Sensors
  // ========================================================
  if (now - lastReadMs >=
      READ_INTERVAL_MS) {

    if (readSensors()) {

      String dateStr = getRTCDate();
      String t = getRTCTime();

      Serial.printf(
        "[%s %s] PM1:%.2f PM2.5:%.2f PM10:%.2f | Temp:%.2f°C Hum:%.2f%%\n",
        dateStr.c_str(),
        t.c_str(),
        sensor.pm1_0,
        sensor.pm2_5,
        sensor.pm10_0,
        sensor.temp,
        sensor.hum
      );
    }

    lastReadMs = now;
  }

  // ========================================================
  // Send Data
  // ========================================================
  if (now - lastSendMs >=
      SEND_INTERVAL_MS) {

    String dateStr = getRTCDate();
    String t = getRTCTime();

    if (isWiFiConnected()) {

      int flushed =
        flushSDtoGoogle();

      bool sent =
        sendToGoogle(
          dateStr,
          t,
          sensor
        );

      int sdLines =
        countSDLines();

      if (sent) {

        Serial.printf(
          "[SEND] ✓ WiFi | Flushed:%d | SD:%d | [%s %s] PM1:%.2f PM2.5:%.2f PM10:%.2f | Temp:%.2f Hum:%.2f\n",
          flushed,
          sdLines,
          dateStr.c_str(),
          t.c_str(),
          sensor.pm1_0,
          sensor.pm2_5,
          sensor.pm10_0,
          sensor.temp,
          sensor.hum
        );

      } else {

        saveToSD(dateStr,t, sensor);

        Serial.printf(
          "[SEND] ✗ Google Failed | SD:%d | [%s %s] PM1:%.2f PM2.5:%.2f PM10:%.2f | Temp:%.2f Hum:%.2f\n",
          countSDLines(),
          dateStr.c_str(),
          t.c_str(),
          sensor.pm1_0,
          sensor.pm2_5,
          sensor.pm10_0,
          sensor.temp,
          sensor.hum
        );
      }

    } else {

      saveToSD(dateStr,t, sensor);

      Serial.printf(
        "[SEND] Offline | SD:%d | [%s %s] PM1:%.2f PM2.5:%.2f PM10:%.2f | Temp:%.2f Hum:%.2f\n",
        countSDLines(),
        dateStr.c_str(),
        t.c_str(),
        sensor.pm1_0,
        sensor.pm2_5,
        sensor.pm10_0,
        sensor.temp,
        sensor.hum
      );
    }

    lastSendMs = now;

    Serial.println(
      "--------------------------------------------"
    );
  }
}