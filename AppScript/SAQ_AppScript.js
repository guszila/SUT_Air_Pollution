// ========== CONFIG ==========
const LOC_SHEET_NAME = "Device_Locations";
const CHANNEL_ACCESS_TOKEN = "/9/5+tmTFZb0ic6tLLUgkbpyHdYBE1ZpUzMQoJzyVx9W6m+5eeuHwtGYnnRT21OBXuqrO+MrMY6NCM1odCYP89TY6JiGuXtq6zh3ZrHygrW69mf9rXGbRwQbbSYn9mu9geLMNFtn6gJNfzLZSEWMFQdB04t89/1O/w1cDnyilFU=";
const MAX_SERVICE_DISTANCE = 5000; // meters

// =====================================================
// LINE WEBHOOK (POST) — Verify ผ่าน + ใช้งานจริง
// =====================================================
function doPost(e) {
  // ต้องใช้ HtmlService เพื่อให้ LINE Verify ผ่าน
  const res = HtmlService.createHtmlOutput("OK");

  try {
    if (e && e.postData && e.postData.contents) {
      handleLineEvent_(e);
    }
  } catch (err) {
    console.error(err);
  }

  return res;
}

// =====================================================
// ESP32 → Google Sheets (GET)
// =====================================================
function doGet(e) {
  if (!e || !e.parameter) return ok_();

  const device = normalizeDeviceName_(e.parameter.device || "");
  if (!/^ESP32_\d+$/.test(device)) return ok_();

  const sheet = getOrCreateDeviceSheet_(device);

  var date   = e.parameter.date || "";
  var time   = e.parameter.time || "";
  var pm1  = e.parameter.pm1 || "";
  var pm25 = e.parameter.pm2_5 || "";
  var pm10 = e.parameter.pm10 || "";

  var temp = e.parameter.temp || "";
  var hum  = e.parameter.hum || "";

  sheet.appendRow([
    date,
    time,
    device,
    pm1,
    pm25,
    pm10,
    temp,
    hum
  ]);

  checkAndBroadcast_(device, pm25);
  return ok_();
}

// =====================================================
// CORE: แยกชีทตามชื่ออุปกรณ์ (🔥 ห้ามลบ)
// =====================================================
function getOrCreateDeviceSheet_(device) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(device);

  if (!sheet) {
    sheet = ss.insertSheet(device);
    sheet.appendRow([
      "Date","Time","Device",
      "PM1","PM2.5","PM10",
      "Temp","Humidity"
    ]);
  }
  return sheet;
}

// =====================================================
// LINE EVENT HANDLER
// =====================================================
function handleLineEvent_(e) {
  const json = JSON.parse(e.postData.contents);
  if (!json.events) return;

  json.events.forEach(event => {
    if (event.type !== "message") return;

    // ---------- TEXT ----------
    if (event.message.type === "text") {
      const fullText = (event.message.text || "").trim();

      // ⭐⭐⭐ 1. วิธีใช้งาน (มาจาก Rich Menu)
      if (fullText === "วิธีใช้งาน" || fullText === "HOW TO USE") {
        sendReply_(
          event.replyToken,
        `📘 วิธีใช้งาน SUT AIR POLLUTION

🔹 1) เช็คฝุ่นใกล้ตัว
พิมพ์:
👉 เช็คฝุ่นใกล้ตัว

จากนั้น
📍 กดปุ่ม +  
📍 เลือก “ตำแหน่งที่ตั้ง”

หมายเหตุ:
ระบบจะดึงข้อมูลจากอุปกรณ์วัดฝุ่น
ที่อยู่ใกล้คุณมากที่สุด


🔹 2) เช็คฝุ่นจากสถานที่
พิมพ์:
👉 ค่าฝุ่น อาคารบรรณสาร 🏫
👉 ค่าฝุ่น อาคารเรียนรวม 1 🏫


🔹 3) ระบบแจ้งเตือนอัตโนมัติ
🚨 แจ้งเตือนทันที
เมื่อค่าฝุ่น PM2.5 เปลี่ยนระดับ

📌 ข้อมูลแสดงผลแบบ Real-time
`
        );
        return;
      }

      // ⭐⭐⭐ 2. ขอพิกัด
      if (fullText === "เช็คฝุ่นใกล้ตัว" || fullText === "ส่งพิกัด") {
        sendReply_(
          event.replyToken,
          "📍 กรุณากดปุ่ม + แล้วเลือก 'ตำแหน่งที่ตั้ง'"
        );
        return;
      }

      // ⭐⭐⭐ 3. เช็คฝุ่นทั้งหมด (Check Air Quality Now)
      if (fullText.toLowerCase() === "check air quality now" || fullText === "เช็คฝุ่นทั้งหมด") {
        replyWithAllLatestData_(event.replyToken);
        return;
      }

      // ⭐⭐⭐ 4. เช็คค่าฝุ่นตามสถานที่ (เช่น ค่าฝุ่น อาคารบรรณสาร)
      if (fullText.startsWith("ค่าฝุ่น")) {
        // ตัดคำว่า "ค่าฝุ่น" ออก (ความยาว 7 ตัวอักษร) แล้วลบช่องว่างส่วนเกิน
        const locationInput = fullText.substring(7).trim(); 
        
        // โยนไปให้ฟังก์ชันแปลงชื่อสถานที่ -> เป็นรหัสอุปกรณ์
        const device = mapLocationToDevice_(locationInput);

        replyWithLatestData_(event.replyToken, device);
        return;
      }
    }

    // ---------- LOCATION ----------
    if (event.message.type === "location") {
      const lat = event.message.latitude;
      const lon = event.message.longitude;

      const device = findClosestDevice_(lat, lon);
      if (!device) {
        sendReply_(
          event.replyToken,
          `ไม่พบเครื่องวัดในระยะ ${MAX_SERVICE_DISTANCE / 1000} กม.`
        );
      } else {
        replyWithLatestData_(event.replyToken, device, lat, lon);
      }
    }
  }); // ปิดวงเล็บ forEach ที่ถูกต้อง
}

// =====================================================
// ส่งค่าฝุ่นล่าสุด
// =====================================================
function replyWithLatestData_(replyToken, device, userLat, userLon) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ถ้าไม่ระบุ device → แจ้งให้พิมพ์ชื่ออุปกรณ์
  if (!device) {
    sendReply_(replyToken, "กรุณาพิมพ์ชื่อสถานที่ เช่น `ค่าฝุ่น อาคารบรรณสาร`");
    return;
  }

  const sheet = ss.getSheetByName(device);
  if (!sheet) {
    sendReply_(replyToken, `ยังไม่มีข้อมูลจาก ${device}`);
    return;
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) {
    sendReply_(replyToken, `ยังไม่มีข้อมูลจาก ${device}`);
    return;
  }

  // แถวล่าสุด
  const r = rows[rows.length - 1];

  // ===== ดึงค่าตามโครงสร้างชีท =====
  const date = r[0];   // Date
  const time = r[1];   // Time
  const pm1  = r[3];   // PM1
  const pm25 = r[4];   // PM2.5
  const pm10 = r[5];   // PM10
  const temp = r[6];   // Temp
  const hum  = r[7];   // Humidity

  // ===== จัดรูปแบบวันที่/เวลา =====
  const tz = Session.getScriptTimeZone();
  const dateStr = (date instanceof Date)
    ? Utilities.formatDate(date, tz, "dd/MM/yyyy")
    : date;
  const timeStr = (time instanceof Date)
    ? Utilities.formatDate(time, tz, "HH:mm:ss")
    : time;

  // ===== คำนวณระยะทาง (ถ้ามีพิกัด) =====
  let distanceText = "";
  if (userLat && userLon) {
    const locSheet = ss.getSheetByName(LOC_SHEET_NAME);
    if (locSheet) {
      const locData = locSheet.getDataRange().getValues().slice(1);
      const loc = locData.find(x => x[0].toString().trim() === device);
      if (loc) {
        const d = calculateDistance_(userLat, userLon, loc[1], loc[2]);
        distanceText = d > 1000
          ? `(${(d / 1000).toFixed(1)} กม.)`
          : `(${Math.round(d)} ม.)`;
      }
    }
  }

  // ===== ส่งข้อความ =====
  sendReply_(
    replyToken,
    `📍 ${getDeviceLabel_(device)} ${distanceText}\n` +
    `🗓 วันที่: ${dateStr}\n` +
    `⏰ เวลา: ${timeStr}\n\n` +
    `🌫 PM1.0 : ${pm1} µg/m³\n` +
    `🌫 PM2.5 : ${pm25} µg/m³\n` +
    `🌫 PM10  : ${pm10} µg/m³\n\n` +
    `🌡 Temp  : ${temp} °C\n` +
    `💧 Hum   : ${hum} %\n\n` +
    `🚩 สถานะ : ${getAQILevel_(pm25)}`
  );
}

// =====================================================
// แจ้งเตือนเฉพาะ "ฝุ่นหนักจริง" (ครั้งเดียวต่อเหตุการณ์)
// =====================================================
function checkAndBroadcast_(device, pm) {
  if (isNaN(pm)) return;

  const props = PropertiesService.getScriptProperties();

  const stateKey = "DANGER_STATE_" + device;

  // เกณฑ์ฝุ่นอันตรายจริง (ปรับได้)
  const DANGER_PM = 75;

  // สถานะก่อนหน้า (true = เคยอันตรายแล้ว)
  const wasDanger = props.getProperty(stateKey) === "1";

  // ตอนนี้อันตรายไหม
  const isDanger = pm >= DANGER_PM;

  // ❌ ยังไม่อันตราย → รีเซ็ตสถานะ
  if (!isDanger) {
    if (wasDanger) {
      props.setProperty(stateKey, "0");
    }
    return;
  }

  // ❌ ยังอันตรายต่อเนื่อง → ไม่แจ้งซ้ำ
  if (wasDanger) return;

  // ✅ เพิ่งเข้าสู่ช่วงอันตราย → แจ้งครั้งเดียว
  sendBroadcast_(
    `🚨 คุณภาพอากาศอันตราย\n` +
    `📍 ${getDeviceLabel_(device)}\n` +
    `🌫 PM2.5: ${pm} µg/m³\n` +
    `🚩 ${getAQILevel_(pm)}\n\n` +
    `⚠️ ควรหลีกเลี่ยงกิจกรรมกลางแจ้ง`
  );

  // บันทึกว่าเคยแจ้งแล้ว
  props.setProperty(stateKey, "1");
}

// =====================================================
// LINE API
// =====================================================
function sendReply_(token, text) {
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", {
    method: "post",
    headers: {
      Authorization: "Bearer " + CHANNEL_ACCESS_TOKEN,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({
      replyToken: token,
      messages: [{ type: "text", text }]
    })
  });
}

function sendBroadcast_(text) {
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "post",
    headers: {
      Authorization: "Bearer " + CHANNEL_ACCESS_TOKEN,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({
      messages: [{ type: "text", text }]
    })
  });
}

// =====================================================
// HELPERS
// =====================================================
function normalizeDeviceName_(name) {
  if (!name) return "";

  name = name.toString().trim().toUpperCase();

  // รับเฉพาะ ESP32 + ตัวเลข
  const match = name.match(/^ESP32[_\-\s]?(\d+)$/);
  if (!match) return "";

  // เติม 0 ด้านหน้าให้เป็น 2 หลัก
  const num = match[1].padStart(2, "0");

  return `ESP32_${num}`;
}

// 🔥 เพิ่มฟังก์ชันนี้: แปลงข้อความชื่อสถานที่ ให้กลับมาเป็นรหัสอุปกรณ์
function mapLocationToDevice_(input) {
  if (!input) return "";
  const text = input.toString().trim();

  // จับคู่ชื่อสถานที่
  if (text === "อาคารบรรณสาร") return "ESP32_01";
  if (text === "อาคารเรียนรวม 1") return "ESP32_02";

  // หากผู้ใช้พิมพ์มาเป็น "ESP32_01" ตรงๆ ก็ยังคงรองรับอยู่
  return normalizeDeviceName_(text);
}

// แปลงรหัสอุปกรณ์เป็นชื่อสถานที่สำหรับนำไปแสดงผล
function getDeviceLabel_(device) {
  if (device === "ESP32_01") return "ESP32_01 (อาคารบรรณสาร)";
  if (device === "ESP32_02") return "ESP32_02 (อาคารเรียนรวม 1)";
  
  // ถ้ามีอุปกรณ์อื่นเพิ่มในอนาคต แต่ยังไม่ได้ตั้งชื่อ ให้คืนค่ารหัสอุปกรณ์เดิม
  return device; 
}

function findClosestDevice_(lat, lon) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(LOC_SHEET_NAME);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues().slice(1);
  let min = Infinity;
  let name = null;

  data.forEach(r => {
    if (r[0] && r[1] && r[2]) {
      const d = calculateDistance_(lat, lon, r[1], r[2]);
      if (d < min) {
        min = d;
        name = r[0].toString().trim();
      }
    }
  });

  return min <= MAX_SERVICE_DISTANCE ? name : null;
}

function calculateDistance_(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getAQILevel_(pm) {
  const p = parseFloat(pm);
  if (p <= 15) return "🔵 ดีมาก";
  if (p <= 25) return "🟢 ดี";
  if (p <= 37) return "🟡 ปานกลาง";
  if (p <= 75) return "🟠 เริ่มมีผลกระทบ";
  return "🔴 มีผลกระทบต่อสุขภาพ";
}

// =====================================================
// RESPONSE OK (GET)
// =====================================================
function ok_() {
  return ContentService
    .createTextOutput("OK")
    .setMimeType(ContentService.MimeType.TEXT);
}

// =====================================================
// ดึงค่าฝุ่นล่าสุดจาก "ทุกอุปกรณ์"
// =====================================================
function replyWithAllLatestData_(replyToken) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  let messageText = "📊 สรุปข้อมูลค่าฝุ่นปัจจุบันจากทุกจุดติดตั้ง:\n";
  let hasData = false;

  // วนลูปตรวจสอบทุกชีทใน Spreadsheet
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    
    // ตรวจสอบว่าเป็นชีทของอุปกรณ์หรือไม่ (ชื่อต้องเป็น ESP32_ ตามด้วยตัวเลข)
    if (/^ESP32_\d+$/.test(sheetName)) {
      const rows = sheet.getDataRange().getValues();
      
      // ตรวจสอบว่ามีข้อมูลมากกว่าแค่ Header หรือไม่
      if (rows.length >= 2) {
        hasData = true;
        const r = rows[rows.length - 1]; // ดึงข้อมูลแถวล่าสุด

        const date = r[0];
        const time = r[1];
        const pm1  = r[3];
        const pm25 = r[4];
        const pm10 = r[5];
        const temp = r[6];
        const hum  = r[7];

        // จัดรูปแบบวันที่/เวลา
        const tz = Session.getScriptTimeZone();
        const dateStr = (date instanceof Date) ? Utilities.formatDate(date, tz, "dd/MM/yyyy") : date;
        const timeStr = (time instanceof Date) ? Utilities.formatDate(time, tz, "HH:mm:ss") : time;

        // นำข้อมูลของแต่ละอุปกรณ์มาต่อกัน
        messageText += `\n📍 ${getDeviceLabel_(sheetName)}\n` +
                       `🗓 ${dateStr} ⏰ ${timeStr}\n` +
                       `🌫 PM2.5 : ${pm25} µg/m³ (PM1: ${pm1}, PM10: ${pm10})\n` +
                       `🌡 Temp : ${temp} °C | 💧 Hum : ${hum} %\n` +
                       `🚩 ${getAQILevel_(pm25)}\n` +
                       `----------------------`;
      }
    }
  });

  // ถ้าไม่มีข้อมูลเลยจากทุกเครื่อง
  if (!hasData) {
    messageText = "⚠️ ขณะนี้ยังไม่มีข้อมูลจากอุปกรณ์ใดในระบบเลยครับ";
  }

  // ส่งข้อความกลับไปที่ผู้ใช้
  sendReply_(replyToken, messageText);
}