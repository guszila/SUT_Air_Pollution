import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    th: {
        // Navigation
        home: "หน้าหลัก",
        dashboard: "แดชบอร์ด",
        table: "ตารางข้อมูล",
        map: "แผนที่",
        settings: "ตั้งค่า",
        faq: "คำถามที่พบบ่อย",

        // Header
        appTitle: "SUT Air Pollution",

        // Dashboard
        pm25Value: "ค่า PM2.5",
        temperature: "อุณหภูมิ (Temp)",
        humidity: "ความชื้น (Humidity)",
        realtime: "เรียลไทม์",
        summary: "สรุปสภาพอากาศ (Summary)",
        bestAir: "อากาศดีที่สุดที่",
        updateRecent: "อัปเดตล่าสุด",
        current: "ปัจจุบัน",
        avg1h: "เฉลี่ย 1 ชม.",
        avg24h: "เฉลี่ย 24 ชม.",
        lastUpdate: "อัปเดต",
        ranking: "อันดับคุณภาพอากาศ (Air Quality Ranking)",
        trend: "PM2.5 Trends",
        healthAdvice: "คำแนะนำสุขภาพ (Health Advice)",
        dailyStats: "สถิติค่าฝุ่น PM2.5 รายวัน",
        pm25Trend: "แนวโน้ม PM2.5 (20 ค่าล่าสุด)",
        rank: "อันดับ",
        location: "สถานที่",
        status: "สถานะ",
        good: "ดี",
        moderate: "ปานกลาง",
        unhealthy: "เริ่มมีผลกระทบ",
        hazardous: "อันตราย",
        excellent: "ดีมาก",
        aqiStandardTitle: "เกณฑ์ดัชนีคุณภาพอากาศ (TH AQI)",

        // Health Advice
        adviceExcellent: "อากาศดีมาก: เหมาะสำหรับทำกิจกรรมกลางแจ้ง",
        adviceGood: "อากาศดี: ประชาชนทั่วไปเดินทางได้ตามปกติ",
        adviceModerate: "ปานกลาง: ควรลดระยะเวลาการทำกิจกรรมกลางแจ้ง",
        adviceUnhealthy: "เริ่มมีผลกระทบ: หลีกเลี่ยงกิจกรรมกลางแจ้ง",
        adviceHazardous: "มีผลกระทบต่อสุขภาพ: หลีกเลี่ยงกิจกรรมกลางแจ้ง สวมหน้ากากอนามัย",

        // Table
        date: "วันที่",
        time: "เวลา",
        device: "อุปกรณ์ (Device)",

        // Map
        deviceStatus: "สถานะอุปกรณ์",
        online: "ออนไลน์",
        offline: "ออฟไลน์",
        close: "ปิด (Close)",
        loading: "กำลังโหลดข้อมูล...",
        recommendation: "ข้อแนะนำ",
        learningBuilding: "อาคารเรียนรวม 1",
        library: "อาคารบรรณสาร",
        updateTime: "เวลาอัปเดต",
        lastUpdateLabel: "อัพเดทล่าสุด:",

        // Settings
        notification: "การแจ้งเตือน (Notifications)",
        alertThreshold: "แจ้งเตือนเมื่อ PM2.5 เกินกว่า",
        autoRefresh: "อัปเดตข้อมูลอัตโนมัติ (Auto Refresh)",
        every1min: "ทุก 1 นาที",
        every5min: "ทุก 5 นาที",
        turnOff: "ปิด (Off)"
    },
    en: {
        // Navigation
        home: "Home",
        dashboard: "Dashboard",
        table: "Table",
        map: "Map",
        settings: "Settings",
        faq: "FAQ",

        // Header
        appTitle: "SUT Air Pollution",

        // Dashboard
        pm25Value: "PM2.5 Value",
        temperature: "Temperature",
        humidity: "Humidity",
        realtime: "Real-time",
        summary: "Weather Summary",
        bestAir: "Best Air Quality at",
        updateRecent: "Just Updated",
        current: "Current",
        avg1h: "1h Avg",
        avg24h: "24h Avg",
        lastUpdate: "Updated",
        ranking: "Air Quality Ranking",
        trend: "PM2.5 Trends",
        healthAdvice: "Health Advice",
        dailyStats: "Daily PM2.5 Statistics",
        pm25Trend: "PM2.5 Trend (Last 20 Readings)",
        rank: "Rank",
        location: "Location",
        status: "Status",
        good: "Good",
        moderate: "Moderate",
        unhealthy: "Unhealthy",
        hazardous: "Hazardous",
        excellent: "Excellent",
        aqiStandardTitle: "Thai AQI Standard",

        // Health Advice
        adviceExcellent: "Excellent: Great for outdoor activities.",
        adviceGood: "Good: Normal outdoor activities.",
        adviceModerate: "Moderate: Reduce outdoor activities.",
        adviceUnhealthy: "Unhealthy: Avoid outdoor activities.",
        adviceHazardous: "Hazardous: Avoid all outdoor activities, wear N95 mask.",

        // Table
        date: "Date",
        time: "Time",
        device: "Device",

        // Map
        deviceStatus: "Device Status",
        online: "Online",
        offline: "Offline",
        close: "Close",
        loading: "Loading data...",
        recommendation: "Recommendation",
        learningBuilding: "Learning Building 1",
        library: "Library",
        updateTime: "Update Time",
        lastUpdateLabel: "Last Updated:",

        // Settings
        notification: "Notifications",
        alertThreshold: "Alert when PM2.5 exceeds",
        autoRefresh: "Auto Refresh Data",
        every1min: "Every 1 min",
        every5min: "Every 5 min",
        turnOff: "Turn Off"
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('appLanguage') || 'th';
    });

    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
