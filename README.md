# 🌍 IoT Based Air Quality Mapping System
Website: https://sut-air-pollution.vercel.app/

> **Visualizing the air we breathe.**

Air pollution is an invisible threat. This project bridges the gap between complex environmental data and everyday decision-making by transforming raw air quality metrics from IoT sensors into an intuitive, real-time interactive map.

---

### 🚀 Key Features
* **Real-time Monitoring:** ดึงข้อมูลสดจากเซนเซอร์ IoT (เช่น PM2.5, AQI) มาแสดงผลทันที
* **Interactive Heatmap:** แสดงความเข้มข้นของมลพิษด้วยสีสันบนแผนที่ (Geospatial Visualization)
* **Location Intelligence:** ตรวจสอบคุณภาพอากาศตามพิกัดที่ผู้ใช้ผ่านระบบแผนที่อัจฉริยะ
* **Historical Analysis:** มีกราฟแสดงแนวโน้มของคุณภาพอากาศย้อนหลัง

### 🛠️ Tech Stack 
* **Hardware:** ESP32 / Arduino พร้อมเซนเซอร์ตระกูล PMS (เช่น PMS5003)
* **Frontend:** React.js
* **Backend & Cloud:** Firebase Google Sheets

---

### 📖 How it Works
1. **Sensing:** เซนเซอร์ IoT วัดค่าฝุ่นและส่งข้อมูลผ่านโปรโตคอล MQTT หรือ HTTP
2. **Processing:** Server ประมวลผลและจัดเก็บข้อมูลลง Database
3. **Visualizing:** Web App ดึงข้อมูลพิกัดมา Plot ลงบนแผนที่แบบ Interactive
