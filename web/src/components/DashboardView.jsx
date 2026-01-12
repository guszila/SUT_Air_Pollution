import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Card, Row, Col, Typography, Progress, Divider, Table, Tag } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LabelList } from 'recharts';

import { EnvironmentOutlined } from '@ant-design/icons';
import { FireFilled, CloudFilled, SmileFilled, MehFilled, FrownFilled } from '@ant-design/icons';



const { Title, Text } = Typography;

const StatusSection = ({ title, data }) => {
    const { t } = useLanguage();
    const { pm25, temp, humidity } = data || {};

    const getStatus = (val) => {
        if (val === undefined || val === null) return { color: '#d9d9d9', text: 'No Data' };
        if (val <= 15) return { color: '#52c41a', text: t.excellent };
        if (val <= 37) return { color: '#faad14', text: t.moderate };
        if (val <= 75) return { color: '#ff4d4f', text: t.unhealthy };
        return { color: '#722ed1', text: t.hazardous };
    };

    const currentStatus = getStatus(pm25);

    return (
        <Card title={<Title level={4} style={{ margin: 0, fontFamily: 'Kanit, sans-serif' }}>{title}</Title>} style={{ borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Row gutter={[16, 16]} justify="center">
                {/* PM2.5 Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable bordered={false} style={{ textAlign: 'center', background: 'transparent', boxShadow: 'none' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>{t.pm25Value}</Title>
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
                            {pm25 <= 25 && <SmileFilled style={{ fontSize: '24px', color: '#52c41a', marginRight: '8px' }} />}
                            {pm25 > 25 && pm25 <= 50 && <MehFilled style={{ fontSize: '24px', color: '#faad14', marginRight: '8px' }} />}
                            {pm25 > 50 && <FrownFilled style={{ fontSize: '24px', color: '#ff4d4f', marginRight: '8px' }} />}
                            <Text strong style={{ fontSize: '16px', color: currentStatus.color, fontFamily: 'Kanit, sans-serif' }}>
                                {currentStatus.text}
                            </Text>
                        </div>
                    </Card>
                </Col>

                {/* Temperature Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable bordered={false} style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', boxShadow: 'none' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>
                            <FireFilled style={{ color: '#ff4d4f', marginRight: '8px' }} />
                            {t.temperature}
                        </Title>
                        <div className="responsive-stat-value" style={{ color: '#1890ff', fontFamily: 'Kanit, sans-serif' }}>
                            {temp !== undefined ? temp : '-'} °C
                        </div>
                        <Text type="secondary" style={{ fontFamily: 'Kanit, sans-serif' }}>{t.realtime}</Text>
                    </Card>
                </Col>

                {/* Humidity Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable bordered={false} style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', boxShadow: 'none' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>
                            <CloudFilled style={{ color: '#13c2c2', marginRight: '8px' }} />
                            {t.humidity}
                        </Title>
                        <div className="responsive-stat-value" style={{ color: '#13c2c2' }}>
                            {humidity !== undefined ? humidity : '-'} %
                        </div>
                        <Text type="secondary">{t.realtime}</Text>
                    </Card>
                </Col>
            </Row >
        </Card >
    );
};

const HealthAdvisoryCard = ({ pm25 }) => {
    const { t } = useLanguage();
    let bg = '#52c41a';
    let text = t.excellent;
    let advice = t.adviceExcellent;
    let icon = <SmileFilled style={{ fontSize: '48px', color: 'white' }} />;

    if (pm25 > 15 && pm25 <= 25) {
        bg = '#faad14';
        text = t.good;
        advice = t.adviceGood;
        icon = <MehFilled style={{ fontSize: '48px', color: 'white' }} />;
    } else if (pm25 > 25 && pm25 <= 37.5) {
        bg = '#fa8c16';
        text = t.moderate;
        advice = t.adviceModerate;
        icon = <MehFilled style={{ fontSize: '48px', color: 'white' }} />;
    } else if (pm25 > 37.5) {
        bg = '#ff4d4f';
        text = t.unhealthy;
        advice = t.adviceUnhealthy;
        icon = <FrownFilled style={{ fontSize: '48px', color: 'white' }} />;
    }

    return (
        <Card style={{ backgroundColor: bg, borderRadius: '15px', marginBottom: '20px', border: 'none' }} bodyStyle={{ padding: '24px' }}>
            <Row align="middle" gutter={16}>
                <Col flex="60px">
                    {icon}
                </Col>
                <Col flex="auto">
                    <Title level={3} style={{ color: 'white', margin: 0, fontFamily: 'Kanit, sans-serif' }}>
                        คุณภาพอากาศโดยรวม: {text}
                    </Title>
                    <Text style={{ color: 'white', fontSize: '18px', fontFamily: 'Kanit, sans-serif' }}>
                        {advice} (PM2.5: {pm25})
                    </Text>
                </Col>
            </Row>
        </Card>
    );
};

const RankingTable = ({ device1, device2 }) => {
    const { t } = useLanguage();
    const data = [
        { key: '1', name: t.learningBuilding, pm25: device1?.pm25 || 0, status: device1?.pm25 <= 25 ? 'success' : (device1?.pm25 <= 37.5 ? 'warning' : 'error') },
        { key: '2', name: t.library, pm25: device2?.pm25 || 0, status: device2?.pm25 <= 25 ? 'success' : (device2?.pm25 <= 37.5 ? 'warning' : 'error') },
    ].sort((a, b) => a.pm25 - b.pm25);

    const columns = [
        { title: t.rank, dataIndex: 'key', render: (t, r, i) => i + 1, width: 80 },
        { title: t.location, dataIndex: 'name' },
        { title: 'PM2.5', dataIndex: 'pm25', render: (val) => `${val} µg/m³` },
        { title: t.status, dataIndex: 'status', render: (tag) => <Tag color={tag}>{tag === 'success' ? t.good : (tag === 'warning' ? t.moderate : t.unhealthy)}</Tag> }
    ];

    return (
        <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>{t.ranking}</span>} style={{ borderRadius: '15px', marginBottom: '20px' }}>
            <Table dataSource={data} columns={columns} pagination={false} size="small" />
        </Card>
    );
};

const DashboardView = ({ device1, device2, historyData, dailyStats, timeSeriesData, averagePM25, mode = 'home' }) => {
    const { t } = useLanguage();

    // Prepare data for the single-stream chart (Last 20 readings)
    const chartData = historyData ? historyData.slice(-20) : [];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            {mode === 'home' && (
                <>
                    <HealthAdvisoryCard pm25={averagePM25} />

                    <StatusSection title={t.learningBuilding} data={device1} />
                    <StatusSection title={t.library} data={device2} />

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <RankingTable device1={device1} device2={device2} />
                        </Col>
                        <Col xs={24} lg={12}>
                            {/* Ranking Table Side - can put chart here or full width below */}
                            <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>{t.pm25Trend}</span>} style={{ borderRadius: '15px', marginBottom: '20px' }}>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" style={{ fontFamily: 'Kanit, sans-serif' }} />
                                            <YAxis label={{ value: 'µg/m³', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontFamily: 'Kanit' }}>
                                                            <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                                                            <p style={{ margin: 0, color: (data.deviceId === 'A_Learning_Building_1' || data.deviceId === 'ESP32_02') ? '#1890ff' : '#52c41a' }}>
                                                                {(data.deviceId === 'A_Learning_Building_1' || data.deviceId === 'ESP32_02') ? t.learningBuilding : t.library}: {data.pm25} µg/m³
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                            <Legend wrapperStyle={{ fontFamily: 'Kanit, sans-serif' }} />
                                            <Line type="monotone" dataKey="pm25" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}

            {mode === 'dashboard' && (
                <>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>{t.trend}</span>} style={{ borderRadius: '15px' }}>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={timeSeriesData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" style={{ fontFamily: 'Kanit, sans-serif' }} />
                                            <YAxis label={{ value: 'µg/m³', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '10px', fontFamily: 'Kanit' }}
                                                labelStyle={{ fontWeight: 'bold' }}
                                            />
                                            <Legend wrapperStyle={{ fontFamily: 'Kanit, sans-serif' }} />
                                            <Line type="monotone" dataKey="pm25_A" name={t.learningBuilding} stroke="#1890ff" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="pm25_B" name={t.library} stroke="#ff4d4f" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>{t.healthAdvice}</span>} style={{ borderRadius: '15px', height: '100%' }}>
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    {averagePM25 <= 25 && <SmileFilled style={{ fontSize: '64px', color: '#52c41a' }} />}
                                    {averagePM25 > 25 && averagePM25 <= 50 && <MehFilled style={{ fontSize: '64px', color: '#faad14' }} />}
                                    {averagePM25 > 50 && <FrownFilled style={{ fontSize: '64px', color: '#ff4d4f' }} />}

                                    <div style={{ marginTop: '20px', fontFamily: 'Kanit, sans-serif' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                                            PM2.5 เฉลี่ย: {averagePM25} µg/m³
                                        </div>
                                        <div style={{ fontSize: '16px' }}>
                                            {averagePM25 <= 25 && t.adviceExcellent}
                                            {averagePM25 > 25 && averagePM25 <= 37 && t.adviceGood}
                                            {averagePM25 > 37 && averagePM25 <= 50 && t.adviceModerate}
                                            {averagePM25 > 50 && t.adviceHazardous}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Daily Statistics Bar Chart */}
                    <Card
                        title={<span style={{ fontFamily: 'Kanit, sans-serif', fontSize: '18px' }}>{t.dailyStats}</span>}
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
                                    <Bar dataKey="pm25_A" name={t.learningBuilding} fill="#1890ff" radius={[5, 5, 0, 0]}>
                                        <LabelList dataKey="pm25_A" position="top" style={{ fontFamily: 'Kanit, sans-serif' }} />
                                    </Bar>
                                    <Bar dataKey="pm25_B" name={t.library} fill="#52c41a" radius={[5, 5, 0, 0]}>
                                        <LabelList dataKey="pm25_B" position="top" style={{ fontFamily: 'Kanit, sans-serif' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

export default DashboardView;
