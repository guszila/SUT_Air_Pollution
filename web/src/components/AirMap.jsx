import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
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
    const { t } = useLanguage();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);

    // SUT Coordinates
    const mapCenter = [14.88025, 102.01658]; // Approximate center between the two buildings
    const zoomLevel = 16; // Increased zoom for better view

    const devices = [
        {
            id: 'A_Learning_Building_1',
            name: 'อาคารเรียนรวม 1 (Learning Bldg 1)',
            thaiName: 'อาคารเรียนรวม 1',
            position: [14.881556, 102.016861],
            data: device1
        },
        {
            id: 'B_Library_Building',
            name: 'อาคารบรรณสาร (Library)',
            thaiName: 'อาคารบรรณสาร',
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
        if (pm25 <= 15) return `${t.excellent}`;
        if (pm25 <= 37) return `${t.moderate}`;
        if (pm25 <= 75) return `${t.unhealthy}`;
        return `${t.hazardous}`;
    };

    const getRecommendation = (pm25) => {
        if (pm25 <= 15) return t.adviceExcellent;
        if (pm25 <= 37) return t.adviceModerate;
        if (pm25 <= 75) return t.adviceUnhealthy;
        return t.adviceHazardous;
    };

    const openDetail = (device) => {
        if (device.data) {
            setSelectedDevice(device);
            setIsModalVisible(true);
        }
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

                        const customIcon = L.divIcon({
                            className: 'custom-marker',
                            html: `
                                <div style="
                                    background-color: ${color};
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    color: white;
                                    font-weight: bold;
                                    font-family: 'Kanit', sans-serif;
                                    font-size: 14px;
                                    box-shadow: 0 0 10px rgba(0,0,0,0.3);
                                    border: 2px solid white;
                                ">
                                    ${pm25}
                                </div>
                            `,
                            iconSize: [40, 40],
                            iconAnchor: [20, 20],
                            popupAnchor: [0, -20]
                        });

                        return (
                            <Marker
                                key={index}
                                position={device.position}
                                icon={customIcon}
                                eventHandlers={{ click: () => openDetail(device) }}
                            >
                                <Tooltip
                                    direction="top"
                                    offset={[0, -20]}
                                    opacity={1}
                                    sticky={true}
                                >
                                    <span style={{ fontFamily: 'Kanit, sans-serif', fontSize: '14px' }}>
                                        {device.thaiName}
                                    </span>
                                </Tooltip>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Detail Modal */}
            <Modal
                title={
                    <div style={{ fontFamily: 'Kanit, sans-serif', display: 'flex', alignItems: 'center' }}>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        <span style={{ fontSize: '18px' }}>{selectedDevice?.thaiName}</span>
                        {selectedDevice && (
                            <Tag color="success" style={{ marginLeft: '10px' }}>{t.deviceStatus}: {t.online}</Tag>
                        )}
                    </div>
                }
                open={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel} style={{ fontFamily: 'Kanit, sans-serif' }}>
                        {t.close}
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
                            <Descriptions.Item label={`${t.pm25Value} (µg/m³)`}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ flex: 1, marginRight: '10px' }}>
                                        <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(selectedDevice.data.pm25, 100)}%`, height: '100%', background: getStatusColor(selectedDevice.data.pm25) }} />
                                        </div>
                                    </div>
                                    <b>{selectedDevice.data.pm25}</b>
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label={t.temperature}>
                                <b>{selectedDevice.data.temp}</b> °C
                            </Descriptions.Item>
                            <Descriptions.Item label={t.humidity}>
                                <b>{selectedDevice.data.humidity}</b> %
                            </Descriptions.Item>
                            <Descriptions.Item label={t.recommendation}>
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
                        <p>{t.loading}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AirMap;
