# 🌍 IoT Based Air Quality Mapping System
Website: https://sut-air-pollution.vercel.app/

> **Visualizing the air we breathe.**

Air pollution is an invisible threat. This project bridges the gap between complex environmental data and everyday decision-making by transforming raw air quality metrics from IoT sensors into an intuitive, real-time interactive map.

---
### 📱 LINE OA Rich Menu Integration A custom-designed LINE Rich Menu was developed to provide users with quick access to system features. 
* Direct access to real-time air quality dashboard
* Simplified navigation for non-technical users
* Deep linking from LINE to the web application

### 🚀 Key Features
* **Real-time Monitoring:** ดึงข้อมูลสดจากเซนเซอร์ IoT มาแสดงผลทันที
* **Interactive Heatmap:** แสดงความเข้มข้นของมลพิษด้วยสีสันบนแผนที่ (Geospatial Visualization)
* **Location Intelligence:** ตรวจสอบคุณภาพอากาศตามพิกัดที่ผู้ใช้ผ่านระบบแผนที่อัจฉริยะ
* **Historical Analysis:** มีกราฟแสดงแนวโน้มของคุณภาพอากาศย้อนหลัง

### 🛠️ Tech Stack 
* **Hardware:** ESP32, PMS5003, DHT22, SD Card Module
* **Frontend:** React.js
* **Backend & Cloud:** Google Sheets, JavaScript, C++
* **Integration / API:** LINE Messaging API (LINE Official Account)

---

### 📖 How it Works
1. **Sensing:**  
   IoT sensors (PMS5003, DHT22) collect air quality and environmental data via ESP32.

2. **Transmission:**  
   Data is transmitted to the cloud using MQTT or HTTP protocol.

3. **Processing & Storage:**  
   Google Apps Script processes incoming data and stores it in Google Sheets as a lightweight database.

4. **Monitoring & Threshold Analysis:**  
   The system continuously evaluates PM values against predefined safety thresholds.

5. **Notification System:**  
   When pollution levels exceed safe limits, the system automatically triggers the LINE Messaging API to send real-time alerts to subscribed users via LINE Official Account.

6. **Visualization:**  
   The React.js web application fetches live data and renders:
   - Interactive geospatial heatmaps
   - Location-based air quality insights
   - Historical trend charts for analysis
