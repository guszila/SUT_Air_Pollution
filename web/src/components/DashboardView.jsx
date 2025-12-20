import React from 'react';
import { Card, Row, Col, Typography, Progress } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, LabelList } from 'recharts';

const { Title, Text } = Typography;

const DashboardView = ({ latestData, historyData, dailyStats }) => {
    const { pm25, temp, humidity } = latestData || {};

    const getStatus = (val) => {
        if (val <= 15) return { color: '#52c41a', text: 'Excellent' };
        if (val <= 37) return { color: '#faad14', text: 'Moderate' };
        if (val <= 75) return { color: '#ff4d4f', text: 'Unhealthy' };
        return { color: '#722ed1', text: 'Hazardous' };
    };

    const currentStatus = getStatus(pm25 || 0);

    // Prepare data for chart (take last 10 entries)
    const chartData = historyData ? historyData.slice(-10) : [];

    // Custom Tooltip for Bar Chart
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                    <p style={{ margin: 0, color: '#8884d8' }}>PM2.5: {payload[0].value} µg/m³</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <Row gutter={[16, 16]} justify="center">
                {/* PM2.5 Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable style={{ textAlign: 'center', borderRadius: '15px' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>ค่า PM2.5</Title>
                        <Progress
                            type="dashboard"
                            percent={Math.min(((pm25 || 0) / 100) * 100, 100)}
                            strokeColor={currentStatus.color}
                            width={120}
                            strokeWidth={10}
                            format={() => (
                                <div style={{ color: currentStatus.color, fontFamily: 'Kanit, sans-serif' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{pm25 !== undefined ? pm25 : '-'}</div>
                                    <div style={{ fontSize: '12px' }}>µg/m³</div>
                                </div>
                            )}
                        />
                        <div style={{ marginTop: '10px' }}>
                            <Text strong style={{ fontSize: '16px', color: currentStatus.color, fontFamily: 'Kanit, sans-serif' }}>
                                {currentStatus.text}
                            </Text>
                        </div>
                    </Card>
                </Col>

                {/* Temperature Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable style={{ textAlign: 'center', borderRadius: '15px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>อุณหภูมิ (Temp)</Title>
                        <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#1890ff', margin: '20px 0', fontFamily: 'Kanit, sans-serif' }}>
                            {temp !== undefined ? temp : '-'} °C
                        </div>
                        <Text type="secondary" style={{ fontFamily: 'Kanit, sans-serif' }}>เรียลไทม์</Text>
                    </Card>
                </Col>

                {/* Humidity Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable style={{ textAlign: 'center', borderRadius: '15px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>ความชื้น (Humidity)</Title>
                        <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#13c2c2', margin: '20px 0' }}>
                            {humidity !== undefined ? humidity : '-'} %
                        </div>
                        <Text type="secondary">Real-time</Text>
                    </Card>
                </Col>
            </Row>

            {/* Existing Trend Graph */}
            <Card title="PM2.5 Trend (Last 10 Readings)" style={{ marginTop: '20px', borderRadius: '15px' }}>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="pm25" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* New Daily Statistics Bar Chart */}
            <Card
                title={<span style={{ fontFamily: 'Kanit, sans-serif', fontSize: '18px' }}>สถิติค่าฝุ่น PM2.5 รายวัน (7 วันล่าสุด)</span>}
                style={{ marginTop: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={dailyStats}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" style={{ fontFamily: 'Kanit, sans-serif' }} />
                            <YAxis label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', style: { fontFamily: 'Kanit' } }} />
                            <Tooltip content={<CustomBarTooltip />} />
                            <Legend wrapperStyle={{ fontFamily: 'Kanit, sans-serif' }} />
                            <Bar dataKey="pm25" name="ค่าเฉลี่ย PM2.5" radius={[5, 5, 0, 0]}>
                                {dailyStats && dailyStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getStatus(entry.pm25).color} />
                                ))}
                                <LabelList dataKey="pm25" position="top" style={{ fontFamily: 'Kanit, sans-serif' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default DashboardView;
