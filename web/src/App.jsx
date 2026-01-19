// Build update: 22/12/2025
import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Menu, Spin, Space, notification, Card, Row, Col, Badge, Drawer, Button, ConfigProvider, theme, Avatar, Dropdown, Modal } from 'antd';
import { DashboardOutlined, TableOutlined, GlobalOutlined, MenuOutlined, EnvironmentOutlined, CheckCircleOutlined, HomeOutlined, SettingOutlined, UserOutlined, LogoutOutlined, IdcardOutlined, BarChartOutlined } from '@ant-design/icons';
import axios from 'axios';
import DashboardView from './components/DashboardView';
import TableView from './components/TableView';
import AirMap from './components/AirMap';
import Settings from './components/Settings';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';
import { useSettings } from './context/SettingsContext';
import ProfileView from './components/ProfileView';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const AirDashboard = () => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { alertThreshold, refreshInterval } = useSettings();

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
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Alert Cooldown Ref
  const lastAlertTime = useRef(0);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  // Initialize LIFF
  useEffect(() => {
    const initLiff = async () => {
      try {
        if (window.liff) {
          await window.liff.init({ liffId: "2008874361-7p7NpOmA" });

          // Auto Login if in LINE Client
          if (window.liff.isInClient() && !window.liff.isLoggedIn()) {
            window.liff.login();
            return; // Stop execution to wait for login redirect
          }

          if (window.liff.isLoggedIn()) {
            const profile = await window.liff.getProfile();
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error("LIFF Initialization failed:", error);
      }
    };
    initLiff();
  }, []);

  // Check for Alerts
  useEffect(() => {
    const checkAlert = (pm25, deviceName) => {
      // Use user-defined threshold (default 75)
      if (pm25 > alertThreshold) {
        const now = Date.now();
        // 10 minutes cooldown (600,000 ms)
        if (now - lastAlertTime.current > 600000) {
          if ('Notification' in window && Notification.permission === 'granted') {
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

  }, [device1, device2, alertThreshold]);

  // Data Fetching
  const fetchAirQuality = async () => {
    // URL 1: ESP32_02 (Learning Bldg 1) - gid=1804783139
    const urlDevice1 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5C1Xn7PWmRy_um7zBoQsvC2KRaVbvY4f7xjqWVOw7qVX-J6sCYIg0SJkeb237Yb8R7jo_86c_l9B1/pub?gid=1804783139&single=true&output=csv";
    // URL 2: ESP32_01 (Library) - gid=1098888062
    const urlDevice2 = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5C1Xn7PWmRy_um7zBoQsvC2KRaVbvY4f7xjqWVOw7qVX-J6sCYIg0SJkeb237Yb8R7jo_86c_l9B1/pub?gid=1098888062&single=true&output=csv";

    try {
      const [response1, response2] = await Promise.all([
        axios.get(urlDevice1),
        axios.get(urlDevice2)
      ]);

      const parseCSV = (csvData) => {
        const rows = csvData.split('\n').filter(row => row.trim() !== "");
        // Remove header
        const dataRows = rows.slice(1);
        return dataRows.map(row => {
          const cols = row.split(',');
          // Device ID is in Column 3 (Index 2)
          return {
            date: cols[0],
            time: cols[1],
            deviceId: cols[2].trim(),
            pm25: parseFloat(cols[4]),
            pm10: parseFloat(cols[5]),
            temp: parseFloat(cols[6]),
            humidity: parseFloat(cols[7]),
          };
        });
      };

      const data1 = parseCSV(response1.data);
      const data2 = parseCSV(response2.data);
      const allData = [...data1, ...data2];

      setHistoryData(allData);

      // Filter Data by Device Name (using the new GID-based data, checking deviceId matches)
      const d1Data = data1; // Since URL1 is ESP32_02 (Learning)
      const d2Data = data2; // Since URL2 is ESP32_01 (Library)

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

      const dailyStatsArray = Object.keys(dailyMap).sort().slice(-30).map(key => {
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

      // --- Helper to calculate Hourly Average ---
      const calculateHourlyAvg = (data) => {
        if (!data || data.length === 0) return 0;

        const latestInfo = data[data.length - 1];
        if (!latestInfo) return 0;

        // Parse Latest Timestamp
        const [day, month, year] = latestInfo.date.split('/');
        const [hour, minute, second] = latestInfo.time.split(':');
        // Note: Months - 1 for Date object
        const latestTime = new Date(year, month - 1, day, hour, minute, second || 0).getTime();

        const oneHourAgo = latestTime - (60 * 60 * 1000);

        let sum = 0;
        let count = 0;

        for (let i = data.length - 1; i >= 0; i--) {
          const item = data[i];
          const [dDay, dMonth, dYear] = item.date.split('/');
          const [dHour, dMinute, dSecond] = item.time.split(':');
          const itemTime = new Date(dYear, dMonth - 1, dDay, dHour, dMinute, dSecond || 0).getTime();

          if (itemTime >= oneHourAgo) {
            sum += item.pm25;
            count++;
          } else {
            // Data is sorted by time, so we can break early if we go past 1 hour ago
            // However, ensuring we don't break consecutively if order is weird, but typically it's chronological. 
            // Given file append nature, safe to assume roughly sorted. 
            // To be safe against minor unordered rows, we could just iterate a bit more or verify sorting, 
            // but normally appended data is sorted.
            if (latestTime - itemTime > 2 * 60 * 60 * 1000) break; // Break if > 2 hours gap
          }
        }

        return count > 0 ? (sum / count).toFixed(0) : latestInfo.pm25;
      };

      const latestD1 = d1Data.length > 0 ? d1Data[d1Data.length - 1] : null;
      const latestD2 = d2Data.length > 0 ? d2Data[d2Data.length - 1] : null;

      // Helper to check if device is offline (older than 20 mins)
      const isDeviceOffline = (device) => {
        if (!device) return true;
        try {
          const [d, m, y] = device.date.split('/');
          const [h, min, s] = device.time.split(':');
          const deviceDate = new Date(y, m - 1, d, h, min, s);
          const now = new Date();
          const diff = now - deviceDate;
          return diff > 20 * 60 * 1000; // 20 minutes
        } catch (e) {
          return true;
        }
      };

      // Attach Hourly Average to Device State
      if (latestD1) {
        latestD1.pm25_hourly_avg = calculateHourlyAvg(d1Data);
        latestD1.isOffline = isDeviceOffline(latestD1);
      }
      if (latestD2) {
        latestD2.pm25_hourly_avg = calculateHourlyAvg(d2Data);
        latestD2.isOffline = isDeviceOffline(latestD2);
      }

      setDevice1(latestD1);
      setDevice2(latestD2);

      // --- Process Time Series Data (Merge by Time) ---
      const timeMap = {};

      const addToMap = (data, key) => {
        data.forEach(item => {
          const dateParts = item.date.split('/');
          const timeParts = item.time.split(':');
          if (dateParts.length === 3 && timeParts.length >= 2) {
            const d = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${item.time}`);
            const timestamp = d.getTime();
            const timeLabel = `${timeParts[0]}:${timeParts[1]}`; // HH:mm

            if (!timeMap[timestamp]) {
              timeMap[timestamp] = { timestamp, time: timeLabel, fullDate: item.date };
            }
            if (key === 'A') {
              timeMap[timestamp].pm25_A = item.pm25;
              timeMap[timestamp].pm10_A = item.pm10;
              timeMap[timestamp].temp_A = item.temp;
              timeMap[timestamp].humid_A = item.humidity;
            }
            if (key === 'B') {
              timeMap[timestamp].pm25_B = item.pm25;
              timeMap[timestamp].pm10_B = item.pm10;
              timeMap[timestamp].temp_B = item.temp;
              timeMap[timestamp].humid_B = item.humidity;
            }
          }
        });
      };

      addToMap(d1Data, 'A');
      addToMap(d2Data, 'B');

      const sortedTimeSeries = Object.values(timeMap)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-50); // Keep last 50 points

      setTimeSeriesData(sortedTimeSeries);

      let sumPM25 = 0;
      let countPM25 = 0;
      // For average PM2.5 at top, we can use the hourly average or instant. 
      // User asked for "Card display average 1 hour", implying the device cards. 
      // Using instant or avg for the main summary? Let's use avg if available.
      if (latestD1) { sumPM25 += parseFloat(latestD1.pm25_hourly_avg || latestD1.pm25); countPM25++; }
      if (latestD2) { sumPM25 += parseFloat(latestD2.pm25_hourly_avg || latestD2.pm25); countPM25++; }
      setAveragePM25(countPM25 > 0 ? (sumPM25 / countPM25).toFixed(1) : 0);

      // Determine Best Air Quality
      if (latestD1 && latestD2) {
        if (parseFloat(latestD1.pm25) < parseFloat(latestD2.pm25)) { // Compare instant for best location? or avg? Using instant seems more "now"
          setBestLocation({ name: 'learningBuilding', value: latestD1.pm25 });
        } else {
          setBestLocation({ name: 'library', value: latestD2.pm25 });
        }
      } else if (latestD1) {
        setBestLocation({ name: 'learningBuilding', value: latestD1.pm25 });
      } else if (latestD2) {
        setBestLocation({ name: 'library', value: latestD2.pm25 });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirQuality();

    let interval;
    if (refreshInterval > 0) {
      interval = setInterval(fetchAirQuality, refreshInterval);
    }

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [refreshInterval]);

  // Scroll Handler
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

  const handleLogin = () => {
    if (window.liff) {
      window.liff.login();
    }
  };

  const handleLogout = () => {
    if (window.liff && window.liff.isLoggedIn()) {
      window.liff.logout();
      window.location.reload();
    }
  };

  const handleUpdateProfile = (newProfile) => {
    setUserProfile(newProfile);
    // In a real app, you would also probably save this to a database here
  };

  const profileMenuItems = userProfile ? [
    {
      key: 'user-header',
      label: (
        <div style={{ padding: '4px' }}>
          <Text strong>{userProfile?.displayName || "User"}</Text>
        </div>
      ),
      disabled: true,
      style: { cursor: 'default', color: isDarkMode ? 'white' : 'black' }
    },
    {
      type: 'divider',
    },
    {
      key: 'view-profile',
      icon: <UserOutlined />,
      label: 'View Profile',
      onClick: () => setIsProfileModalOpen(true),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t.settings || 'Settings',
      onClick: () => setCurrentView('settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ] : [
    {
      key: 'login-trigger',
      label: (
        <div onClick={(e) => { e.preventDefault(); handleLogin(); }}>
          Log in with LINE
        </div>
      ),
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE" style={{ width: '20px', height: '20px' }} />,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t.settings || 'Settings',
      onClick: () => setCurrentView('settings'),
    }
  ];

  const renderContent = () => {
    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

    switch (currentView) {
      case 'home':
        return <DashboardView mode="home" device1={device1} device2={device2} historyData={historyData} dailyStats={dailyStats} averagePM25={averagePM25} timeSeriesData={timeSeriesData} />;
      case 'map':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ height: '60vh', width: '100%', minHeight: '400px' }}>
              <AirMap device1={device1} device2={device2} dailyStats={dailyStats} />
            </div>
            <div id="data-table-section">
              <Text strong style={{ fontSize: '20px', fontFamily: 'Kanit, sans-serif' }}>
                {t.table || "Data Table"}
              </Text>
              <TableView data={historyData} />
            </div>
          </div>
        );
      case 'profile':
        return (
          <ProfileView
            userProfile={userProfile}
            onLogout={handleLogout}
            onSettingsClick={() => setCurrentView('settings')}
            onTableClick={() => setCurrentView('table')}
            onUpdateProfile={handleUpdateProfile}
            onLogin={handleLogin}
          />
        );
      case 'dashboard':
        return <DashboardView mode="dashboard" device1={device1} device2={device2} timeSeriesData={timeSeriesData} averagePM25={averagePM25} dailyStats={dailyStats} currentTime={currentTime} bestLocation={bestLocation} />;
      case 'table':
        return <TableView data={historyData} onSettingsClick={() => setCurrentView('settings')} />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardView mode="home" device1={device1} device2={device2} historyData={historyData} dailyStats={dailyStats} />;
    }
  };

  const navItems = [
    { label: t.home, key: 'home', icon: <HomeOutlined /> },
    { key: 'dashboard', icon: <BarChartOutlined />, label: t.dashboard },
    { key: 'map', icon: <EnvironmentOutlined />, label: t.map },
  ];

  return (
    <ConfigProvider theme={{
      algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        fontFamily: 'Anakotmai, sans-serif'
      }
    }}>
      <Layout style={{ minHeight: '100vh', fontFamily: 'Anakotmai, sans-serif' }}>
        <Header className="glass-header" style={{
          position: 'fixed',
          zIndex: 2000,
          width: '100%',
          height: '64px',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          backgroundColor: '#f97316', // Orange Theme
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'transform 0.3s ease-in-out',
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)'
        }}>
          <div
            className="clickable-brand"
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setCurrentView('home')}
          >
            <img
              src="/sut_logo.png"
              alt="SUT Air Pollution Logo"
              style={{
                height: '50px',
                marginRight: '12px',
                objectFit: 'contain',
                // filter: 'brightness(0) invert(1)' // Removed to show original logo colors
              }}
            />
            <Title level={4} style={{ color: 'white', margin: 0, marginRight: '20px', whiteSpace: 'nowrap', fontSize: '1.2rem', fontFamily: 'Anakotmai, sans-serif' }}>
              SUT Air Pollution
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
              style={{ width: '100%', justifyContent: 'flex-end', borderBottom: 'none', fontFamily: 'Anakotmai, sans-serif' }}
              disabledOverflow={true}
            />
          </div>

          {/* Hamburger Menu Removed */}

          {/* Time Removed as requested */}

          <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" arrow trigger={['click']}>
            <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {userProfile ? (
                <>
                  <Avatar src={userProfile.pictureUrl} icon={<UserOutlined />} size="large" style={{ border: '2px solid rgba(255,255,255,0.8)' }} />
                  <Text className="desktop-visible" style={{ color: 'white', marginLeft: '8px', fontFamily: 'Kanit, sans-serif' }}>
                    {userProfile.displayName}
                  </Text>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar icon={<UserOutlined />} size="large" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  <Text className="mobile-only" style={{ color: 'white', marginLeft: '6px', fontSize: '12px', fontFamily: 'Kanit, sans-serif' }}>เข้าสู่ระบบ</Text>
                </div>
              )}
            </div>
          </Dropdown>

          <Modal
            open={isProfileModalOpen}
            onCancel={() => setIsProfileModalOpen(false)}
            footer={null}
            centered
            bodyStyle={{ textAlign: 'center', padding: '40px 20px' }}
          >
            {userProfile && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar src={userProfile.pictureUrl} size={100} icon={<UserOutlined />} style={{ marginBottom: '16px', border: '4px solid #f0f0f0' }} />
                <Title level={3} style={{ margin: 0 }}>{userProfile.displayName}</Title>
                <Text type="secondary">LINE User</Text>
                <Text type="secondary" style={{ marginTop: '8px', fontSize: '12px' }}>ID: {userProfile.userId}</Text>
              </div>
            )}
          </Modal>
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

        <Content className="responsive-padding" style={{ padding: '0 16px', marginTop: 100 }}>

          {/* Summary Card */}
          {bestLocation && currentView !== 'settings' && (
            <Card style={{ marginBottom: '16px', borderRadius: '10px', background: isDarkMode ? '#1f1f1f' : '#f6ffed', borderColor: isDarkMode ? '#303030' : '#b7eb8f' }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space>
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div>
                      <Text strong style={{ fontSize: '16px', fontFamily: 'Kanit, sans-serif' }}>{t.summary}</Text>
                      <div style={{ fontFamily: 'Kanit, sans-serif', color: '#52c41a' }}>
                        {t.bestAir}: <b>{t[bestLocation.name]}</b> (PM2.5: {bestLocation.value})
                      </div>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Badge status="processing" text={<span style={{ fontFamily: 'Kanit, sans-serif', color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : undefined }}>{t.updateRecent}</span>} />
                </Col>
              </Row>
            </Card>
          )}

          <div style={{ background: isDarkMode ? '#141414' : '#fff', padding: 16, minHeight: 450, borderRadius: '10px' }}>
            {renderContent()}
          </div>
        </Content>

        {/* Bottom Navigation for Mobile */
          /* Table Item Removed manually from here as well since it was hardcoded or we just check navItems logic if it was dynamic, but effectively we want 4 args in bottom nav: Home, Dashboard, Map, Profile. */
        }
        <div className="mobile-bottom-nav" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          // Safe area padding for iPhone
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(60px + env(safe-area-inset-bottom))',
          backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
          justifyContent: 'space-around',
          alignItems: 'center', // Align items vertically
          borderTop: `1px solid ${isDarkMode ? '#303030' : '#e8e8e8'}`,
          zIndex: 1000,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
          display: window.innerWidth <= 768 ? 'flex' : 'none'
        }}>
          <style>{`
             @media (min-width: 769px) { .mobile-bottom-nav { display: none !important; } }
             @media (max-width: 768px) { 
                .desktop-visible { display: none !important; } 
                .mobile-visible { display: block !important; } 
                .mobile-bottom-nav { display: flex !important; } 
             }
             /* Adjust active state style */
             .nav-item-active { color: #f97316 !important; }
             .nav-item { color: #8c8c8c; }
           `}</style>

          <div onClick={() => setCurrentView('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', height: '100%', justifyContent: 'center' }} className={currentView === 'home' ? 'nav-item-active' : 'nav-item'}>
            <HomeOutlined style={{ fontSize: '24px' }} />
            <span style={{ fontSize: '10px', marginTop: '2px', fontFamily: 'Kanit' }}>{t.home || 'Home'}</span>
          </div>

          <div onClick={() => setCurrentView('dashboard')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', height: '100%', justifyContent: 'center' }} className={currentView === 'dashboard' ? 'nav-item-active' : 'nav-item'}>
            <BarChartOutlined style={{ fontSize: '24px' }} />
            <span style={{ fontSize: '10px', marginTop: '2px', fontFamily: 'Kanit' }}>{t.dashboard || 'Dashboard'}</span>
          </div>

          <div onClick={() => setCurrentView('map')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', height: '100%', justifyContent: 'center' }} className={currentView === 'map' ? 'nav-item-active' : 'nav-item'}>
            <EnvironmentOutlined style={{ fontSize: '24px' }} />
            <span style={{ fontSize: '10px', marginTop: '2px', fontFamily: 'Kanit' }}>{t.map || 'Map'}</span>
          </div>

          <div onClick={() => setCurrentView('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', height: '100%', justifyContent: 'center' }} className={currentView === 'profile' ? 'nav-item-active' : 'nav-item'}>
            <UserOutlined style={{ fontSize: '24px' }} />
            <span style={{ fontSize: '10px', marginTop: '2px', fontFamily: 'Kanit' }}>{t.profile || 'Profile'}</span>
          </div>
        </div>

        <Footer style={{ textAlign: 'center', padding: '20px 10px', fontFamily: 'Kanit, sans-serif', paddingBottom: '80px' }}>
          © 2025 SUT Air Pollution
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default AirDashboard;