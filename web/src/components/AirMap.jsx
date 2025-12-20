import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button, Modal, Descriptions, Tag, Typography, Card } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const AirMap = ({ device1, device2, dailyStats }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);

    // SUT Coordinates
    const mapCenter = [14.88025, 102.01658]; // Approximate center between the two buildings
    const zoomLevel = 16; // Increased zoom for better view

    const devices = [
        {
            id: 'ESP32_01',
            name: 'อาคารเรียนรวม 1 (Learning Bldg 1)',
            position: [14.881556, 102.016861],
            data: device1
        },
        {
            id: 'ESP32_02',
            name: 'อาคารบรรณสาร (Library)',
            position: [14.878944, 102.016306],
            data: device2
        }
    ];

    const getStatusColor = (pm25) => {
        if (pm25 <= 15) return '#52c41a'; // Excellent
        if (pm25 <= 37) return '#faad14'; // Moderate
        if (pm25 <= 75) return '#ff4d4f'; // Unhealthy
        return '#722ed1'; // Hazardous
    };

    const getStatusText = (pm25) => {
        if (pm25 <= 15) return 'ดีมาก (Excellent)';
        if (pm25 <= 37) return 'ปานกลาง (Moderate)';
        if (pm25 <= 75) return 'เริ่มมีผลกระทบ (Unhealthy)';
        return 'อันตราย (Hazardous)';
    };

    const getRecommendation = (pm25) => {
        if (pm25 <= 15) return 'ทำกิจกรรมกลางแจ้งได้ตามปกติ';
        if (pm25 <= 37) return 'ควรลดระยะเวลาการทำกิจกรรมกลางแจ้ง';
        if (pm25 <= 75) return 'ควรสวมหน้ากากอนามัย และหลีกเลี่ยงกิจกรรมกลางแจ้ง';
        return 'ควรงดกิจกรรมกลางแจ้งทุกชนิด และสวมหน้ากาก N95';
    };

    const openDetail = (device) => {
        setSelectedDevice(device);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedDevice(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', fontFamily: 'Kanit, sans-serif' }}>
            {/* Map Container */}
            <div style={{ height: '60vh', minHeight: '400px', width: '100%', borderRadius: '15px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <MapContainer center={mapCenter} zoom={zoomLevel} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {devices.map((device, index) => {
                        const pm25 = device.data ? device.data.pm25 : 0;
                        const color = getStatusColor(pm25);

                        return (
                            <React.Fragment key={index}>
                                <Marker
                                    position={device.position}
                                    eventHandlers={{ click: () => openDetail(device) }}
                                >
                                    <Tooltip
                                        direction="top"
                                        offset={[0, -10]}
                                        opacity={1}
                                        sticky={true}
                                    >
                                        <span style={{ fontFamily: 'Kanit, sans-serif', fontSize: '14px' }}>
                                            {device.name}
                                        </span>
                                    </Tooltip>
                                </Marker>
                                <CircleMarker
                                    center={device.position}
                                    pathOptions={{ color: color, fillColor: color, fillOpacity: 0.7 }}
                                    radius={20}
                                    eventHandlers={{ click: () => openDetail(device) }}
                                />
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Detail Modal */}
            <Modal
                title={
                    <div style={{ fontFamily: 'Kanit, sans-serif' }}>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        {selectedDevice?.name}
                    </div>
                }
                open={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel} style={{ fontFamily: 'Kanit, sans-serif' }}>
                        ปิด (Close)
                    </Button>
                ]}
                centered
                styles={{ content: { borderRadius: '15px', overflow: 'hidden' } }}
            >
                {selectedDevice && selectedDevice.data ? (
                    <div style={{ fontFamily: 'Kanit, sans-serif' }}>

                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <Tag color={getStatusColor(selectedDevice.data.pm25)} style={{ fontSize: '16px', padding: '5px 15px', borderRadius: '20px' }}>
                                {getStatusText(selectedDevice.data.pm25)}
                            </Tag>
                        </div>

                        <Descriptions bordered column={1} size="small" contentStyle={{ fontFamily: 'Kanit, sans-serif' }} labelStyle={{ fontFamily: 'Kanit, sans-serif', fontWeight: 'bold' }}>
                            <Descriptions.Item label="ค่า PM2.5 (µg/m³)">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ flex: 1, marginRight: '10px' }}>
                                        <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(selectedDevice.data.pm25, 100)}%`, height: '100%', background: getStatusColor(selectedDevice.data.pm25) }} />
                                        </div>
                                    </div>
                                    <b>{selectedDevice.data.pm25}</b>
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label="อุณหภูมิ (Temperature)">
                                <b>{selectedDevice.data.temp}</b> °C
                            </Descriptions.Item>
                            <Descriptions.Item label="ความชื้น (Humidity)">
                                <b>{selectedDevice.data.humidity}</b> %
                            </Descriptions.Item>
                            <Descriptions.Item label="ข้อแนะนำ (Recommendation)">
                                <span style={{ color: getStatusColor(selectedDevice.data.pm25) }}>
                                    {getRecommendation(selectedDevice.data.pm25)}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="เวลาอัปเดต">
                                {selectedDevice.data.time}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'Kanit, sans-serif' }}>
                        <p>ไม่พบข้อมูล (No Data)</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AirMap;
