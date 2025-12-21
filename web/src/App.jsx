import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Menu, Spin, Space, notification, Card, Row, Col, Badge } from 'antd';
import { DashboardOutlined, TableOutlined, GlobalOutlined, EnvironmentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import DashboardView from './components/DashboardView';
import TableView from './components/TableView';
import AirMap from './components/AirMap';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const AirDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data States
  const [historyData, setHistoryData] = useState([]);
  const [device1, setDevice1] = useState(null); // ESP32_01 (Learning Bldg 1)
  const [device2, setDevice2] = useState(null); // ESP32_02 (Library)
  const [dailyStats, setDailyStats] = useState([]);
  const [bestLocation, setBestLocation] = useState(null);

  // Alert Cooldown Ref
  const lastAlertTime = useRef(0);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  // Check for Alerts
  useEffect(() => {
    const checkAlert = (pm25, deviceName) => {
      if (pm25 > 75) {
        const now = Date.now();
        // 10 minutes cooldown (600,000 ms)
        if (now - lastAlertTime.current > 600000) {
          if (Notification.permission === 'granted') {
            new Notification("แจ้งเตือนคุณภาพอากาศ!", {
              body: `${deviceName} ค่า PM2.5 สูง: ${pm25} µg/m³ กรุณาสวมหน้ากาก!`,
              icon: '/vite.svg'
            });
          }
          notification.error({
            message: 'ตรวจพบค่าฝุ่นละอองสูง',
            description: `ที่ ${deviceName} มีค่า PM2.5 อยู่ที่ ${pm25} µg/m³ ควรหลีกเลี่ยงกิจกรรมกลางแจ้ง`,
            duration: 10,
          });
          lastAlertTime.current = now;
        }
      }
    };

    if (device1) checkAlert(device1.pm25, 'อาคารเรียนรวม 1');
    if (device2) checkAlert(device2.pm25, 'อาคารบรรณสาร');

  }, [device1, device2]);

  // Data Fetching
  const fetchAirQuality = async () => {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5C1Xn7PWmRy_um7zBoQsvC2KRaVbvY4f7xjqWVOw7qVX-J6sCYIg0SJkeb237Yb8R7jo_86c_l9B1/pub?gid=0&single=true&output=csv";
    try {
      const response = await axios.get(csvUrl);
      const rows = response.data.split('\n').filter(row => row.trim() !== "");
      // Remove header
      const dataRows = rows.slice(1);

      const parsedData = dataRows.map(row => {
        const cols = row.split(',');
        // Device ID is in Column 3 (Index 3) based on CSV inspection
        const deviceId = cols[3].trim();

        return {
          date: cols[0],
          time: cols[1],
          deviceId: deviceId,
          pm25: parseFloat(cols[5]),
          pm10: parseFloat(cols[6]),
          temp: parseFloat(cols[7]),
          humidity: parseFloat(cols[8]),
        };
      });

      setHistoryData(parsedData);

      // Filter Data by Device Name
      const d1Data = parsedData.filter(d => d.deviceId === 'A_Learning_Building_1');
      const d2Data = parsedData.filter(d => d.deviceId === 'B_Library_Building');

      // --- Calculate Daily Averages for Grouped Chart ---
      const dailyMap = {};

      // Helper to process data
      const processForDaily = (data, keyPrefix) => {
        data.forEach(item => {
          const parts = item.date.split('/');
          if (parts.length === 3) {
            const dateKey = `${parts[2]}-${parts[1]}-${parts[0]}`; // yyyy-mm-dd
            if (!dailyMap[dateKey]) {
              dailyMap[dateKey] = { date: item.date, sumA: 0, countA: 0, sumB: 0, countB: 0 };
            }
            if (keyPrefix === 'A') {
              dailyMap[dateKey].sumA += item.pm25;
              dailyMap[dateKey].countA += 1;
            } else {
              dailyMap[dateKey].sumB += item.pm25;
              dailyMap[dateKey].countB += 1;
            }
          }
        });
      };

      processForDaily(d1Data, 'A');
      processForDaily(d2Data, 'B');

      const dailyStatsArray = Object.keys(dailyMap).sort().slice(-7).map(key => {
        const entry = dailyMap[key];
        const avgA = entry.countA ? (entry.sumA / entry.countA).toFixed(0) : 0;
        const avgB = entry.countB ? (entry.sumB / entry.countB).toFixed(0) : 0;

        const dateObj = new Date(key);
        const thaiDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

        return {
          date: thaiDate,
          pm25_A: parseInt(avgA),
          pm25_B: parseInt(avgB),
          fullDate: key
        };
      });
      setDailyStats(dailyStatsArray);

      const latestD1 = d1Data.length > 0 ? d1Data[d1Data.length - 1] : null;
      const latestD2 = d2Data.length > 0 ? d2Data[d2Data.length - 1] : null;

      setDevice1(latestD1);
      setDevice2(latestD2);

      // Determine Best Air Quality
      if (latestD1 && latestD2) {
        if (latestD1.pm25 < latestD2.pm25) {
          setBestLocation({ name: 'อาคารเรียนรวม 1', value: latestD1.pm25 });
        } else {
          setBestLocation({ name: 'อาคารบรรณสาร', value: latestD2.pm25 });
        }
      } else if (latestD1) {
        setBestLocation({ name: 'อาคารเรียนรวม 1', value: latestD1.pm25 });
      } else if (latestD2) {
        setBestLocation({ name: 'อาคารบรรณสาร', value: latestD2.pm25 });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirQuality();
    const interval = setInterval(fetchAirQuality, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

    switch (currentView) {
      case 'dashboard':
        return <DashboardView device1={device1} device2={device2} historyData={historyData} dailyStats={dailyStats} />;
      case 'table':
        return <TableView data={historyData} />;
      case 'map':
        return <AirMap
          device1={device1}
          device2={device2}
          dailyStats={dailyStats}
        />;
      default:
        return <DashboardView device1={device1} device2={device2} historyData={historyData} dailyStats={dailyStats} />;
    }
  };

  const navItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'แดชบอร์ด' },
    { key: 'table', icon: <TableOutlined />, label: 'ตารางข้อมูล' },
    { key: 'map', icon: <GlobalOutlined />, label: 'แผนที่' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', fontFamily: 'Kanit, sans-serif' }}>
      <Header style={{ position: 'fixed', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.2)',
            marginRight: '12px',
            borderRadius: '5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            SUT
          </div>
          <Title level={4} style={{ color: 'white', margin: 0, marginRight: '20px', whiteSpace: 'nowrap', fontSize: '1.2rem', fontFamily: 'Kanit, sans-serif' }}>
            <span className="desktop-only">SUT Air Pollution</span>
          </Title>
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['dashboard']}
          items={navItems}
          onSelect={({ key }) => setCurrentView(key)}
          style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end', borderBottom: 'none', fontFamily: 'Kanit, sans-serif' }}
          disabledOverflow={true}
        />

        <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginLeft: '16px', whiteSpace: 'nowrap', fontFamily: 'Kanit, sans-serif' }}>
          {currentTime.toLocaleTimeString('th-TH')}
        </div>
      </Header>

      <Content style={{ padding: '0 16px', marginTop: 84 }}>

        {/* Summary Card */}
        {bestLocation && (
          <Card style={{ marginBottom: '16px', borderRadius: '10px', background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  <div>
                    <Text strong style={{ fontSize: '16px', fontFamily: 'Kanit, sans-serif' }}>สรุปสภาพอากาศ (Summary)</Text>
                    <div style={{ fontFamily: 'Kanit, sans-serif', color: '#52c41a' }}>
                      อากาศดีที่สุดที่: <b>{bestLocation.name}</b> (PM2.5: {bestLocation.value})
                    </div>
                  </div>
                </Space>
              </Col>
              <Col>
                <Badge status="processing" text={<span style={{ fontFamily: 'Kanit, sans-serif' }}>อัปเดตล่าสุด</span>} />
              </Col>
            </Row>
          </Card>
        )}

        <div style={{ background: '#fff', padding: 16, minHeight: 450, borderRadius: '10px' }}>
          {renderContent()}
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', padding: '20px 10px', fontFamily: 'Kanit, sans-serif' }}>
        © 2025 SUT Air Pollution
      </Footer>
    </Layout>
  );
};

export default AirDashboard;