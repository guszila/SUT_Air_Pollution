import React from 'react';
import { Card, Row, Col, Typography, Progress, Divider } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LabelList } from 'recharts';

const { Title, Text } = Typography;

const StatusSection = ({ title, data }) => {
    const { pm25, temp, humidity } = data || {};

    const getStatus = (val) => {
        if (val === undefined || val === null) return { color: '#d9d9d9', text: 'No Data' };
        if (val <= 15) return { color: '#52c41a', text: 'Excellent' };
        if (val <= 37) return { color: '#faad14', text: 'Moderate' };
        if (val <= 75) return { color: '#ff4d4f', text: 'Unhealthy' };
        return { color: '#722ed1', text: 'Hazardous' };
    };

    const currentStatus = getStatus(pm25);

    return (
        <Card title={<Title level={4} style={{ margin: 0, fontFamily: 'Kanit, sans-serif' }}>{title}</Title>} style={{ borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Row gutter={[16, 16]} justify="center">
                {/* PM2.5 Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable bordered={false} style={{ textAlign: 'center', background: 'transparent', boxShadow: 'none' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>ค่า PM2.5</Title>
                        <Progress
                            type="dashboard"
                            percent={pm25 ? Math.min(((pm25) / 100) * 100, 100) : 0}
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
                    <Card hoverable bordered={false} style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', boxShadow: 'none' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>อุณหภูมิ (Temp)</Title>
                        <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#1890ff', margin: '20px 0', fontFamily: 'Kanit, sans-serif' }}>
                            {temp !== undefined ? temp : '-'} °C
                        </div>
                        <Text type="secondary" style={{ fontFamily: 'Kanit, sans-serif' }}>เรียลไทม์</Text>
                    </Card>
                </Col>

                {/* Humidity Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable bordered={false} style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', boxShadow: 'none' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>ความชื้น (Humidity)</Title>
                        <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#13c2c2', margin: '20px 0' }}>
                            {humidity !== undefined ? humidity : '-'} %
                        </div>
                        <Text type="secondary">Real-time</Text>
                    </Card>
                </Col>
            </Row>
        </Card>
    );
};

const DashboardView = ({ device1, device2, historyData, dailyStats }) => {

    // Prepare data for chart (take last 20 entries to show some trend for both if possible)
    // The historyData is mixed. We need to process it to line up timestamps for a multi-line chart if we want them on the same axis.
    // However, simplest way for "Trend" is to just list the historyData as is, but maybe filter by device?
    // Let's create a combined chart data structure if the times align, or just plot them sequence-wise.
    // Given the data format, let's try to just separate them and map to a compatible structure.
    // Actually, `historyData` contains `deviceId`. We can just use `recharts` to plot lines for each deviceId, but the X-axis needs to be unique 'time'.
    // If times are not perfectly aligned, it might look messy.
    // Let's try to just show the last 10 readings regardless of device for now, but maybe color by device?
    // Or better, let's filter for each device and merge by time.

    // Let's rely on the incoming `historyData` which is already parsed.
    // We'll filter the last 20 points for the chart.
    const chartData = historyData ? historyData.slice(-20) : [];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            <StatusSection title="อาคารเรียนรวม 1 (Learning Building 1)" data={device1} />

            <StatusSection title="อาคารบรรณสาร (Library)" data={device2} />

            {/* PM2.5 Trend Graph */}
            <Card title="PM2.5 Trend (Last 20 Readings)" style={{ marginTop: '20px', borderRadius: '15px' }}>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                                            <p style={{ margin: 0, color: data.deviceId === 'A_Learning_Building_1' ? '#1890ff' : '#52c41a' }}>
                                                {data.deviceId === 'A_Learning_Building_1' ? 'อาคารเรียนรวม 1' : 'อาคารบรรณสาร'}: {data.pm25} µg/m³
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <Legend />
                            <Line type="monotone" dataKey="pm25" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Daily Statistics Bar Chart */}
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
                            <Tooltip
                                contentStyle={{ borderRadius: '10px', fontFamily: 'Kanit' }}
                                formatter={(value, name) => [value, name]}
                                labelStyle={{ fontWeight: 'bold' }}
                            />
                            <Legend wrapperStyle={{ fontFamily: 'Kanit, sans-serif' }} />
                            <Bar dataKey="pm25_A" name="อาคารเรียนรวม 1" fill="#1890ff" radius={[5, 5, 0, 0]}>
                                <LabelList dataKey="pm25_A" position="top" style={{ fontFamily: 'Kanit, sans-serif' }} />
                            </Bar>
                            <Bar dataKey="pm25_B" name="อาคารบรรณสาร" fill="#52c41a" radius={[5, 5, 0, 0]}>
                                <LabelList dataKey="pm25_B" position="top" style={{ fontFamily: 'Kanit, sans-serif' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default DashboardView;
