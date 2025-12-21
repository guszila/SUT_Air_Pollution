#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <HardwareSerial.h>
#include "time.h"

// ---------- DHT11 ----------
#define DHTPIN 15
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

float temp = 0;
float hum  = 0;

// ---------- PMS5003 ----------
#define RX 22
#define TX 21
HardwareSerial PMSSerial(2);

int pm1_0 = 0, pm2_5 = 0, pm10_0 = 0;

// ---------- WiFi ----------
const char* ssid = "FOCUS";
const char* password = "35984000";
//const char* ssid = "@SUT-IoT";
//const char* password = "";

// ---------- Google Script ----------
const char* scriptURL = "https://script.google.com/macros/s/AKfycbwEn4qtCXgDW150ufX307pNeNAO7qHSySh0y0J8aXSQaRbA2R5MQtbNUo9OJICWxioZ/exec";

// ---------- NTP ----------
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 7 * 3600;
const int daylightOffset_sec = 0;

// ---------- Config ----------
const char* deviceName = "C_Test_Point";
//const char* deviceName = "A_Learning_Building_1"; 
//const char* deviceName = "B_Library_Building"; 

// ---------- LINE Token (Messaging API) ----------
const char* lineToken  = "r6HgHzteNFp6eZdFaJ7PVIAOewqv+jqzYCK+MpiHQqb6QVfB6fm7CYJ0PTOMQHEXXuqrO+MrMY6NCM1odCYP89TY6JiGuXtq6zh3ZrHygrXc5yatOgnMo0mMUsw6Dv9AEVRZaYmfOMtifhVyzG+szwdB04t89/1O/w1cDnyilFU=";

const char* lineUserId[] = {
  "Ub3910c430f940bcf723e72fe32ed16fd",
  // "Ubc722e5b5a82ae47608dbdfbacc87160"
};
const int userCount = 1;

// ==========================================
// [สำคัญ!] ตัวแปรสำหรับ Smart Alert (ต้องมีบรรทัดนี้ ไม่งั้น Error)
// ==========================================
int lastLevel = -1; 

// ฟังก์ชันคำนวณระดับ (เกณฑ์เดิม: 36, 56, 151, 250)
int getAirLevel(int pm) {
  if (pm < 36) return 0;        // ปกติ
  if (pm <= 55) return 1;       // เริ่มอันตราย
  if (pm <= 150) return 2;      // อันตรายมาก
  if (pm <= 250) return 3;      // อันตรายมากที่สุด
  return 4;                     // วิกฤต
}
// ==========================================


// ----------- URL Encode -----------
String urlencode(String str) {
  String encoded = "";
  char c;
  char code0;
  char code1;

  for (int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (isalnum(c)) encoded += c;
    else {
      code1 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) code1 = (c & 0xf) - 10 + 'A';
      c = (c >> 4) & 0xf;
      code0 = c + '0';
      if (c > 9) code0 = c - 10 + 'A';
      encoded += '%';
      encoded += code0;
      encoded += code1;
    }
  }
  return encoded;
}


// ----------- ส่ง LINE (Messaging API) -----------
void sendLineAlert(String msg) {
  if (WiFi.status() != WL_CONNECTED) return;

  msg.replace("\n", "\\n");

  for (int i = 0; i < userCount; i++) {
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient https;
    String url = "https://api.line.me/v2/bot/message/push";

    if (!https.begin(client, url)) return;

    https.addHeader("Content-Type", "application/json");
    https.addHeader("Authorization", String("Bearer ") + lineToken);

    String payload =
      "{"
        "\"to\":\"" + String(lineUserId[i]) + "\","
        "\"messages\":["
          "{"
            "\"type\":\"text\","
            "\"text\":\"" + msg + "\""
          "}"
        "]"
      "}";

    https.POST(payload);
    https.end();
  }
}


void setup() {
  Serial.begin(115200);
  delay(1000);
  
  dht.begin();
  PMSSerial.begin(9600, SERIAL_8N1, RX, TX);

  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");

  // NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}


// ----------- อ่าน PMS + DHT -----------
void readSensors() {
  unsigned long start = millis();
  while (PMSSerial.available() < 32) {
    if (millis() - start > 2000) return;
    delay(5);
  }

  if (PMSSerial.read() != 0x42) return;
  if (PMSSerial.read() != 0x4D) return;

  PMSSerial.read(); PMSSerial.read();

  uint16_t data[13];
  for (int i = 0; i < 13; i++) {
    data[i] = (PMSSerial.read() << 8) | PMSSerial.read();
  }

  pm1_0  = data[0];
  pm2_5  = data[1];
  pm10_0 = data[2];

  temp = dht.readTemperature();
  hum  = dht.readHumidity();

  if (isnan(temp) || isnan(hum)) return;

  struct tm timeinfo;
  getLocalTime(&timeinfo);
  char t[16];
  strftime(t, sizeof(t), "%H:%M:%S", &timeinfo);

  Serial.printf("[%s] PM1:%d PM2.5:%d PM10:%d Temp:%.1f Hum:%.1f\n",
                t, pm1_0, pm2_5, pm10_0, temp, hum);
}


// ----------- ส่งข้อมูลทุก 90 วิ -----------
void sendData() {
  struct tm timeinfo;
  getLocalTime(&timeinfo);

  char timeStr[16];
  strftime(timeStr, sizeof(timeStr), "%H:%M:%S", &timeinfo);

  // ============================================================
  // แจ้งเตือน LINE 
  // ============================================================
  if (pm2_5 > 0) { 
    int currentLevel = getAirLevel(pm2_5);

    // เช็คว่าระดับเปลี่ยนไหม
    if (currentLevel != lastLevel) {
      
      String msg = "";

      // กรณีที่ 1: อากาศแย่ลง 
      if (currentLevel > lastLevel) {
        if (currentLevel == 1) {
           msg = "⚠️ PM2.5 เริ่มอันตราย (" + String(pm2_5) + " µg/m³)\n"
                 "เหมาะกับการหลีกเลี่ยงกิจกรรมกลางแจ้ง";
        } 
        else if (currentLevel == 2) {
           msg = "❗ PM2.5 อันตรายมาก! (" + String(pm2_5) + " µg/m³)\n"
                 "ควรอยู่ในอาคาร และสวมหน้ากากเมื่อออกข้างนอก";
        } 
        else if (currentLevel == 3) {
           msg = "🔴 PM2.5 อันตรายมากที่สุด! (" + String(pm2_5) + " µg/m³)\n"
                 "มีความเสี่ยงต่อปอดและหัวใจสูง ควรเลี่ยงออกนอกอาคาร";
        }
        else if (currentLevel == 4) {
           msg = "🚨 ภาวะวิกฤติ PM2.5 > 250 (" + String(pm2_5) + " µg/m³)\n"
                 "ไม่ควรออกนอกอาคารเด็ดขาด!";
        }
      }
      
      // กรณีที่ 2: อากาศดีขึ้น (กลับมาเป็นสีเขียว)
      else if (currentLevel == 0 && lastLevel > 0) {
         msg = "✅ คุณภาพอากาศกลับมาดีแล้ว (" + String(pm2_5) + " µg/m³)\n"
               "ปลอดภัยครับ";
      }

      // ส่งข้อความ
      if (msg != "") {
        sendLineAlert(msg);
        lastLevel = currentLevel; // จำค่าไว้
      }
    }
  }
  // ============================================================

  // สร้าง URL ส่ง Google Sheet
  String url = String(scriptURL) + 
               "?device=" + deviceName +
               "&pm1=" + String(pm1_0) +
               "&pm2_5=" + String(pm2_5) +
               "&pm10=" + String(pm10_0) +
               "&temp=" + String(temp) + 
               "&hum=" + String(hum) +
               "&esptime=" + urlencode(timeStr);

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  https.begin(client, url);

  int httpCode = https.GET();
  Serial.println("HTTP: " + String(httpCode));

  https.end();
}


// ---------- Loop -----------
unsigned long lastRead = 0;
unsigned long lastSend = 0;

void loop() {
  unsigned long now = millis();

  // อ่านทุก 1 วิ
  if (now - lastRead >= 1000) {
    readSensors();
    lastRead = now;
  }

  // ส่งทุก 90 วิ
  if (now - lastSend >= 90000) {
    sendData();
    lastSend = now;
    Serial.println("-------------------------");
  }
}