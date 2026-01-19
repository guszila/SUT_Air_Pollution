import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Card, Row, Col, Typography, Progress, Divider, Table, Tag, Radio } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LabelList, ComposedChart, Area } from 'recharts';

import { EnvironmentOutlined } from '@ant-design/icons';
import { FireFilled, CloudFilled, SmileFilled, MehFilled, FrownFilled } from '@ant-design/icons';



const { Title, Text } = Typography;

const HealthAdvisoryCard = ({ pm25 }) => {
    const { t } = useLanguage();

    // Helper to determine status color and icon
    const getStatusInfo = (val) => {
        if (val === undefined || val === null) return { color: '#d9d9d9', icon: <MehFilled />, text: 'No Data' };
        if (val <= 15) return { color: '#00B0F0', icon: <SmileFilled />, text: t.adviceExcellent }; // Blue
        if (val <= 25) return { color: '#00B050', icon: <SmileFilled />, text: t.adviceGood }; // Green
        if (val <= 37.5) return { color: '#FFC000', icon: <MehFilled />, text: t.adviceModerate }; // Yellow
        if (val <= 75) return { color: '#F25F55', icon: <FrownFilled />, text: t.adviceUnhealthy }; // Orange
        return { color: '#C00000', icon: <FrownFilled />, text: t.adviceHazardous }; // Red
    };

    const info = getStatusInfo(pm25);

    return (
        <Card style={{ borderRadius: '15px', marginBottom: '20px', borderTop: `6px solid ${info.color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: '48px', color: info.color, marginBottom: '10px' }}>
                    {info.icon}
                </div>
                <Title level={3} style={{ margin: 0, fontFamily: 'Kanit, sans-serif' }}>
                    PM2.5: {pm25} µg/m³
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', fontFamily: 'Kanit, sans-serif' }}>
                    {info.text}
                </Text>
            </div>
        </Card>
    );
};

const StatusSection = ({ title, data }) => {
    const { t } = useLanguage();
    const { pm25, pm25_hourly_avg, temp, humidity, date, time } = data || {};

    const displayPM25 = pm25_hourly_avg !== undefined ? pm25_hourly_avg : pm25;

    const getStatus = (val) => {
        if (val === undefined || val === null) return { color: '#d9d9d9', text: 'No Data' };
        if (val <= 15) return { color: '#00B0F0', text: t.excellent };
        if (val <= 25) return { color: '#00B050', text: t.good };
        if (val <= 37.5) return { color: '#FFC000', text: t.moderate };
        if (val <= 75) return { color: '#F25F55', text: t.unhealthy };
        return { color: '#C00000', text: t.hazardous };
    };

    const currentStatus = getStatus(displayPM25);

    return (
        <Card
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Title level={4} style={{ margin: 0, fontFamily: 'Kanit, sans-serif', fontSize: '1.2rem' }}>{title}</Title>
                        {data && (
                            <Tag color={data.isOffline ? 'red' : 'green'} style={{ marginRight: 0 }}>
                                {data.isOffline ? t.offline : t.online}
                            </Tag>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'Kanit, sans-serif' }}>
                        {data ? `${t.lastUpdateLabel} ${date} ${time}` : ''}
                    </Text>
                </div>
            }
            style={{ borderRadius: '15px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            bodyStyle={{ padding: '12px' }}
        >
            <Row gutter={[8, 8]} justify="center">
                {/* PM2.5 Card */}
                <Col xs={24} sm={8}>
                    <Card hoverable bordered={false} style={{ textAlign: 'center', background: 'transparent', boxShadow: 'none' }} bodyStyle={{ padding: '0px' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif', marginBottom: '5px' }}>
                            {t.pm25Value} <span style={{ fontSize: '10px', color: '#8c8c8c' }}>(เฉลี่ย 24 ชม.)</span>
                        </Title>
                        <Progress
                            type="dashboard"
                            percent={displayPM25 ? Math.min(((displayPM25) / 100) * 100, 100) : 0}
                            strokeColor={currentStatus.color}
                            width={100}
                            strokeWidth={10}
                            format={() => (
                                <div style={{ color: currentStatus.color, fontFamily: 'Kanit, sans-serif' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{displayPM25 !== undefined ? displayPM25 : '-'}</div>
                                    <div style={{ fontSize: '10px' }}>µg/m³</div>
                                </div>
                            )}
                        />
                        <div style={{ marginTop: '5px' }}>
                            <Text strong style={{ fontSize: '14px', color: currentStatus.color, fontFamily: 'Kanit, sans-serif' }}>
                                {currentStatus.text}
                            </Text>
                        </div>
                    </Card>
                </Col>

                {/* Temperature Card - Side by side on mobile */}
                <Col xs={12} sm={8}>
                    <Card hoverable bordered={false} style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', boxShadow: 'none' }} bodyStyle={{ padding: '10px' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif', fontSize: '14px', marginBottom: '5px' }}>
                            <FireFilled style={{ color: '#ff4d4f', marginRight: '4px' }} />
                            {t.temperature}
                        </Title>
                        <div className="responsive-stat-value" style={{ color: '#1890ff', fontFamily: 'Kanit, sans-serif', fontSize: '18px', margin: '5px 0' }}>
                            {temp !== undefined ? temp : '-'} °C
                        </div>
                    </Card>
                </Col>

                {/* Humidity Card - Side by side on mobile */}
                <Col xs={12} sm={8}>
                    <Card hoverable bordered={false} style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', boxShadow: 'none' }} bodyStyle={{ padding: '10px' }}>
                        <Title level={5} style={{ fontFamily: 'Kanit, sans-serif', fontSize: '14px', marginBottom: '5px' }}>
                            <CloudFilled style={{ color: '#13c2c2', marginRight: '4px' }} />
                            {t.humidity}
                        </Title>
                        <div className="responsive-stat-value" style={{ color: '#13c2c2', fontFamily: 'Kanit, sans-serif', fontSize: '18px', margin: '5px 0' }}>
                            {humidity !== undefined ? humidity : '-'} %
                        </div>
                    </Card>
                </Col>
            </Row >
        </Card >
    );
};

const HeroGauge = ({ pm25, temp }) => {
    const { t } = useLanguage();

    const getStatus = (val) => {
        if (val === undefined || val === null) return { color: '#d9d9d9', text: 'No Data' };
        if (val <= 15) return { color: '#00B0F0', text: t.excellent };
        if (val <= 25) return { color: '#00B050', text: t.good };
        if (val <= 37.5) return { color: '#FFC000', text: t.moderate };
        if (val <= 75) return { color: '#F25F55', text: t.unhealthy };
        return { color: '#C00000', text: t.hazardous };
    };

    const status = getStatus(pm25);

    return (
        <Card style={{ borderRadius: '20px', marginBottom: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', border: 'none' }} bodyStyle={{ padding: '30px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <Progress
                        type="circle"
                        percent={pm25 ? Math.min((pm25 / 100) * 100, 100) : 0}
                        strokeColor={status.color}
                        strokeWidth={12}
                        width={220}
                        format={() => null} // Custom content below
                    />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: status.color,
                        fontFamily: 'Kanit, sans-serif'
                    }}>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', lineHeight: '1' }}>{pm25 || '-'}</div>
                        <div style={{ fontSize: '16px', color: '#8c8c8c' }}>µg/m³</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px' }}>{status.text}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', backgroundColor: '#f5f5f5', padding: '10px 20px', borderRadius: '50px' }}>
                    <FireFilled style={{ color: '#ff4d4f', fontSize: '20px', marginRight: '10px' }} />
                    <Text style={{ fontSize: '18px', fontFamily: 'Kanit, sans-serif' }}>
                        {t.temperature}: <b>{temp || '-'} °C</b>
                    </Text>
                </div>
            </div>
        </Card>
    );
};

const RankingTable = ({ device1, device2 }) => {
    const { t } = useLanguage();

    const getPM25Val = (device) => device?.pm25_hourly_avg !== undefined ? parseFloat(device.pm25_hourly_avg) : (device?.pm25 || 0);

    const data = [
        {
            key: '1',
            name: t.learningBuilding,
            pm25: getPM25Val(device1),
            pm10: device1?.pm10 || '-',
            temp: device1?.temp || '-',
            humidity: device1?.humidity || '-',
            lastUpdate: device1 ? `${device1.date} ${device1.time}` : '-',
            status: getPM25Val(device1) <= 25 ? 'success' : (getPM25Val(device1) <= 37.5 ? 'warning' : 'error')
        },
        {
            key: '2',
            name: t.library,
            pm25: getPM25Val(device2),
            pm10: device2?.pm10 || '-',
            temp: device2?.temp || '-',
            humidity: device2?.humidity || '-',
            lastUpdate: device2 ? `${device2.date} ${device2.time}` : '-',
            status: getPM25Val(device2) <= 25 ? 'success' : (getPM25Val(device2) <= 37.5 ? 'warning' : 'error')
        },
    ].sort((a, b) => a.pm25 - b.pm25);

    const columns = [
        { title: t.rank, dataIndex: 'key', render: (t, r, i) => i + 1, width: 60, align: 'center' },
        { title: t.location, dataIndex: 'name' },
        {
            title: <span>PM2.5 <br /><small>(avg 1h)</small></span>,
            dataIndex: 'pm25',
            align: 'center',
            render: (val) => <span style={{ fontWeight: 'bold' }}>{val}</span>
        },
        { title: 'PM10', dataIndex: 'pm10', align: 'center', render: (val) => val !== '-' ? val : '-' },
        { title: 'Temp (°C)', dataIndex: 'temp', align: 'center', render: (val) => val !== '-' ? val : '-' },
        { title: 'Humid (%)', dataIndex: 'humidity', align: 'center', render: (val) => val !== '-' ? val : '-' },
        { title: t.lastUpdateLabel || 'Last Update', dataIndex: 'lastUpdate', align: 'center', width: 140 },
        { title: t.status, dataIndex: 'status', align: 'center', render: (tag) => <Tag color={tag}>{tag === 'success' ? t.good : (tag === 'warning' ? t.moderate : t.unhealthy)}</Tag> }
    ];

    return (
        <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>{t.ranking}</span>} style={{ borderRadius: '15px', marginBottom: '20px' }}>
            <Table dataSource={data} columns={columns} pagination={false} size="small" scroll={{ x: true }} />
        </Card>
    );
};



const AirQualityReferenceTable = () => {
    const { t } = useLanguage();

    const data = [
        { key: '1', aqi: '0-25', pm25: '0-15.0', meaning: t.adviceExcellent || 'Excellent', color: '#00B0F0', textColor: '#fff' },
        { key: '2', aqi: '26-50', pm25: '15.1-25.0', meaning: t.adviceGood || 'Good', color: '#00B050', textColor: '#fff' },
        { key: '3', aqi: '51-100', pm25: '25.1-37.5', meaning: t.adviceModerate || 'Moderate', color: '#FFC000', textColor: '#000' },
        { key: '4', aqi: '101-200', pm25: '37.6-75.0', meaning: t.adviceUnhealthy || 'Unhealthy', color: '#F25F55', textColor: '#fff' },
        { key: '5', aqi: '>200', pm25: '>75.1', meaning: t.adviceHazardous || 'Hazardous', color: '#C00000', textColor: '#fff' },
    ];

    const columns = [
        { title: 'AQI', dataIndex: 'aqi', align: 'center', width: 80, render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span> },
        { title: 'PM2.5 (µg/m³)', dataIndex: 'pm25', align: 'center', width: 120 },
        { title: t.status, dataIndex: 'meaning', align: 'left' },
    ];

    return (
        <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>{t.aqiStandardTitle || 'Thai AQI Standard'}</span>} style={{ borderRadius: '15px', marginBottom: '20px' }}>
            <Table
                dataSource={data}
                columns={columns}
                pagination={false}
                size="small"
                rowClassName={(record) => 'aqi-row-' + record.key}
                onRow={(record) => ({
                    style: { background: record.color, color: record.textColor, fontFamily: 'Kanit' }
                })}
            />
        </Card>
    );
};

const DashboardView = ({ device1, device2, historyData, dailyStats, timeSeriesData, averagePM25, mode = 'home', currentTime, bestLocation }) => {
    const { t } = useLanguage();

    // Prepare data for the single-stream chart (Last 20 readings)
    const chartData = historyData ? historyData.slice(-20) : [];

    // Calculate average temp
    const temp1 = parseFloat(device1?.temp) || 0;
    const temp2 = parseFloat(device2?.temp) || 0;
    const validTemps = [device1?.temp, device2?.temp].filter(t => t !== undefined && t !== null).length;
    const averageTemp = validTemps > 0 ? ((temp1 + temp2) / validTemps).toFixed(1) : '-';

    const [daysRange, setDaysRange] = useState('7');

    // Filter daily stats based on selection
    const filteredDailyStats = dailyStats ? dailyStats.slice(daysRange === '7' ? -7 : -30) : [];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            {mode === 'home' && (
                <>
                    <HealthAdvisoryCard pm25={averagePM25} />

                    <StatusSection title={t.learningBuilding} data={device1} />
                    <StatusSection title={t.library} data={device2} />

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={24}>
                            <RankingTable device1={device1} device2={device2} />
                        </Col>

                    </Row>

                    <AirQualityReferenceTable />
                </>
            )}

            {mode === 'dashboard' && (
                <>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
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

                        <Col xs={24} lg={12}>
                            <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>{t.summary || "System Summary"}</span>} style={{ borderRadius: '15px', height: '100%' }}>
                                <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                                    <div style={{ fontFamily: 'Kanit, sans-serif' }}>
                                        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1890ff', lineHeight: 1 }}>
                                            {currentTime ? currentTime.toLocaleTimeString('th-TH', { hour12: false }) : '--:--:--'}
                                        </div>
                                        <div style={{ fontSize: '18px', color: '#8c8c8c', marginBottom: '20px' }}>
                                            {currentTime ? currentTime.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                        </div>

                                        <Divider />

                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ fontSize: '16px', marginBottom: '5px' }}>{t.bestAir}</div>
                                            {bestLocation ? (
                                                <>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                                        {t[bestLocation.name]}
                                                    </div>
                                                    <Tag color="success" style={{ marginTop: '5px' }}>
                                                        PM2.5: {bestLocation.value} µg/m³
                                                    </Tag>
                                                </>
                                            ) : (
                                                <div style={{ color: '#8c8c8c' }}>-</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>




                    <Row gutter={[16, 16]}>


                        <Col xs={24} lg={12}>
                            <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>Temperature & Humidity Trends</span>} style={{ borderRadius: '15px' }}>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <ComposedChart data={timeSeriesData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" style={{ fontFamily: 'Kanit, sans-serif' }} />
                                            <YAxis yAxisId="left" orientation="left" stroke="#ff7a45" label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft' }} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#36cfc9" label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }} />
                                            <Tooltip contentStyle={{ borderRadius: '10px', fontFamily: 'Kanit' }} labelStyle={{ fontWeight: 'bold' }} />
                                            <Legend wrapperStyle={{ fontFamily: 'Kanit, sans-serif' }} />
                                            <Line yAxisId="left" type="monotone" dataKey="temp_A" name={`Temp (${t.learningBuilding})`} stroke="#ff7a45" dot={false} strokeWidth={2} />
                                            <Line yAxisId="right" type="monotone" dataKey="humid_A" name={`Humid (${t.learningBuilding})`} stroke="#36cfc9" dot={false} strokeWidth={2} />
                                            <Line yAxisId="left" type="monotone" dataKey="temp_B" name={`Temp (${t.library})`} stroke="#ff9c6e" dot={false} strokeWidth={2} strokeDasharray="5 5" />
                                            <Line yAxisId="right" type="monotone" dataKey="humid_B" name={`Humid (${t.library})`} stroke="#5cdbd3" dot={false} strokeWidth={2} strokeDasharray="5 5" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card title={<span style={{ fontFamily: 'Kanit, sans-serif' }}>PM10 Trends</span>} style={{ borderRadius: '15px' }}>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={timeSeriesData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" style={{ fontFamily: 'Kanit, sans-serif' }} />
                                            <YAxis stroke="#52c41a" label={{ value: 'PM10 (µg/m³)', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip contentStyle={{ borderRadius: '10px', fontFamily: 'Kanit' }} labelStyle={{ fontWeight: 'bold' }} />
                                            <Legend wrapperStyle={{ fontFamily: 'Kanit, sans-serif' }} />
                                            <Line type="monotone" dataKey="pm10_A" name={`PM10 (${t.learningBuilding})`} stroke="#52c41a" dot={false} strokeWidth={2} />
                                            <Line type="monotone" dataKey="pm10_B" name={`PM10 (${t.library})`} stroke="#95de64" dot={false} strokeWidth={2} strokeDasharray="5 5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Daily Statistics Bar Chart */}
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Kanit, sans-serif' }}>
                                <span style={{ fontSize: '18px' }}>{t.dailyStats}</span>
                                <Radio.Group value={daysRange} onChange={(e) => setDaysRange(e.target.value)} size="small" buttonStyle="solid">
                                    <Radio.Button value="7">7 {t.days || "Days"}</Radio.Button>
                                    <Radio.Button value="30">30 {t.days || "Days"}</Radio.Button>
                                </Radio.Group>
                            </div>
                        }
                        style={{ marginTop: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    >
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={filteredDailyStats}
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
            )
            }
        </div >
    );
};

export default DashboardView;
