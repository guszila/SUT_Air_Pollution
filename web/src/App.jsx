// Build update: 22/12/2025
import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Menu, Spin, Space, notification, Card, Row, Col, Badge, Drawer, Button } from 'antd';
import { DashboardOutlined, TableOutlined, GlobalOutlined, MenuOutlined, EnvironmentOutlined, CheckCircleOutlined, HomeOutlined } from '@ant-design/icons';
import axios from 'axios';
import DashboardView from './components/DashboardView';
import TableView from './components/TableView';
import AirMap from './components/AirMap';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const AirDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data States
  const [historyData, setHistoryData] = useState([]);
  const [device1, setDevice1] = useState(null); // ESP32_01 (Learning Bldg 1)
  const [device2, setDevice2] = useState(null); // ESP32_02 (Library)
  const [dailyStats, setDailyStats] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [averagePM25, setAveragePM25] = useState(0);
  const [bestLocation, setBestLocation] = useState(null);

  // Alert Cooldown Ref
  const lastAlertTime = useRef(0);

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
        // Device ID is in Column 3 (Index 2) based on CSV inspection
        const deviceId = cols[2].trim();

        return {
          date: cols[0],
          time: cols[1],
          deviceId: deviceId,
          pm25: parseFloat(cols[4]),
          pm10: parseFloat(cols[5]),
          temp: parseFloat(cols[6]),
          humidity: parseFloat(cols[7]),
        };
      });

      setHistoryData(parsedData);

      // Filter Data by Device Name
      // Filter Data by Device Name
      const d1Data = parsedData.filter(d => d.deviceId === 'A_Learning_Building_1' || d.deviceId === 'ESP32_02');
      const d2Data = parsedData.filter(d => d.deviceId === 'B_Library_Building' || d.deviceId === 'ESP32_01');

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

      // --- Process Time Series Data (Merge by Time) ---
      // We need to create a map of time -> { time, pm25_A, pm25_B }
      const timeMap = {};

      // Helper to populate map
      const addToMap = (data, key) => {
        data.forEach(item => {
          // Create a unique key for sorting: "YYYYMMDDHHMM" could work, or just use the time string if dates match.
          // However, to be safe across days, we should use full date time.
          // Format of date: "DD/MM/YYYY", time: "HH:mm:ss"
          // Let's create a sortable timestamp
          const dateParts = item.date.split('/');
          const timeParts = item.time.split(':');
          if (dateParts.length === 3 && timeParts.length >= 2) {
            const d = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${item.time}`);
            const timestamp = d.getTime();
            const timeLabel = `${timeParts[0]}:${timeParts[1]}`; // HH:mm

            if (!timeMap[timestamp]) {
              timeMap[timestamp] = { timestamp, time: timeLabel, fullDate: item.date };
            }
            if (key === 'A') timeMap[timestamp].pm25_A = item.pm25;
            if (key === 'B') timeMap[timestamp].pm25_B = item.pm25;
          }
        });
      };

      addToMap(d1Data, 'A');
      addToMap(d2Data, 'B');

      // Convert to array and sort
      const sortedTimeSeries = Object.values(timeMap)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-50); // Keep last 50 points

      setTimeSeriesData(sortedTimeSeries);

      // Calculate Average PM2.5 for Recommendation
      let sumPM25 = 0;
      let countPM25 = 0;
      if (latestD1) { sumPM25 += latestD1.pm25; countPM25++; }
      if (latestD2) { sumPM25 += latestD2.pm25; countPM25++; }
      setAveragePM25(countPM25 > 0 ? (sumPM25 / countPM25).toFixed(1) : 0);

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
    const interval = setInterval(fetchAirQuality, 60000); // Update every minute
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  // Scroll Handler for Hide/Show Header
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) { // Scroll Down
          setShowHeader(false);
        } else { // Scroll Up
          setShowHeader(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const renderContent = () => {
    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

    switch (currentView) {
      case 'home':
        return <DashboardView mode="home" device1={device1} device2={device2} historyData={historyData} dailyStats={dailyStats} averagePM25={averagePM25} timeSeriesData={timeSeriesData} />;
      case 'dashboard':
        return <DashboardView mode="dashboard" device1={device1} device2={device2} timeSeriesData={timeSeriesData} averagePM25={averagePM25} dailyStats={dailyStats} />;
      case 'table':
        return <TableView data={historyData} />;
      case 'map':
        return <AirMap
          device1={device1}
          device2={device2}
          dailyStats={dailyStats}
        />;
      default:
        return <DashboardView mode="home" device1={device1} device2={device2} historyData={historyData} dailyStats={dailyStats} />;
    }
  };

  const navItems = [
    { label: 'Home', key: 'home', icon: <HomeOutlined /> },
    { label: 'Dashboard', key: 'dashboard', icon: <DashboardOutlined /> },
    { key: 'table', icon: <TableOutlined />, label: 'Table' },
    { key: 'map', icon: <GlobalOutlined />, label: 'Map' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', fontFamily: 'Kanit, sans-serif' }}>
      <Header className="glass-header" style={{
        position: 'fixed',
        zIndex: 10,
        width: '100%',
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        transition: 'transform 0.3s ease-in-out',
        transform: showHeader ? 'translateY(0)' : 'translateY(-100%)'
      }}>
        <div
          className="clickable-brand"
          style={{ display: 'flex', alignItems: 'center' }}
          onClick={() => setCurrentView('home')}
        >
          <div style={{
            width: '40px',
            height: '40px',
            background: 'white',
            marginRight: '12px',
            borderRadius: '5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#f37021',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            SUT
          </div>
          <Title level={4} style={{ color: 'white', margin: 0, marginRight: '20px', whiteSpace: 'nowrap', fontSize: '1.2rem', fontFamily: 'Kanit, sans-serif' }}>
            <span className="desktop-only">SUT Air Pollution</span>
          </Title>
        </div>

        {/* Desktop Menu */}
        <div className="desktop-visible" style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <Menu
            theme="dark"
            mode="horizontal"
            className="transparent-menu"
            selectedKeys={[currentView]}
            items={navItems}
            onSelect={({ key }) => setCurrentView(key)}
            style={{ width: '100%', justifyContent: 'flex-end', borderBottom: 'none', fontFamily: 'Kanit, sans-serif' }}
            disabledOverflow={true}
          />
        </div>

        {/* Mobile Hamburger Button */}
        <div className="mobile-visible">
          <Button
            type="primary"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            style={{ background: 'transparent', border: 'none', fontSize: '18px' }}
          />
        </div>

        <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginLeft: '16px', whiteSpace: 'nowrap', fontFamily: 'Kanit, sans-serif' }}>
          {currentTime.toLocaleTimeString('th-TH')}
        </div>
      </Header>

      {/* Mobile Drawer Navigation */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="vertical"
          selectedKeys={[currentView]}
          items={navItems}
          onSelect={({ key }) => {
            setCurrentView(key);
            setMobileMenuOpen(false);
          }}
          style={{ fontFamily: 'Kanit, sans-serif', borderRight: 'none' }}
        />
      </Drawer>

      <Content className="responsive-padding" style={{ padding: '0 16px', marginTop: 84 }}>

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