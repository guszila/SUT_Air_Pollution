import React from 'react';
import { Table, Card } from 'antd';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const TableView = ({ data }) => {
    const { t } = useLanguage();
    const { isDarkMode } = useTheme();

    // Identify latest data for each device to highlight
    const latestTimestamps = {};
    if (data) {
        data.forEach(item => {
            const [d, m, y] = item.date.split('/').map(Number);
            const [h, min, s] = item.time.split(':').map(Number);
            const timestamp = new Date(y, m - 1, d, h, min, s).getTime();

            if (!latestTimestamps[item.deviceId] || timestamp > latestTimestamps[item.deviceId]) {
                latestTimestamps[item.deviceId] = timestamp;
            }
        });
    }

    const columns = [
        {
            title: t.date,
            dataIndex: 'date',
            key: 'date',
            sorter: (a, b) => {
                // Parse DD/MM/YYYY HH:mm:ss for accurate sorting
                const [d1, m1, y1] = a.date.split('/').map(Number);
                const [h1, min1, s1] = a.time.split(':').map(Number);
                const dateA = new Date(y1, m1 - 1, d1, h1, min1, s1 || 0);

                const [d2, m2, y2] = b.date.split('/').map(Number);
                const [h2, min2, s2] = b.time.split(':').map(Number);
                const dateB = new Date(y2, m2 - 1, d2, h2, min2, s2 || 0);

                return dateA - dateB;
            },
            defaultSortOrder: 'descend', // Newest first by default
            width: 120,
        },
        {
            title: t.time,
            dataIndex: 'time',
            key: 'time',
            width: 100,
        },
        {
            title: t.device,
            dataIndex: 'deviceId',
            key: 'deviceId',
            filters: [
                { text: 'อาคารเรียนรวม 1 (Learning Bldg 1)', value: 'ESP32_01' },
                { text: 'อาคารบรรณสาร (Library)', value: 'ESP32_02' },
            ],
            onFilter: (value, record) => record.deviceId === value,
            render: (text) => {
                if (text === 'ESP32_01') return `ESP32_01 (${t.library})`;
                if (text === 'ESP32_02') return `ESP32_02 (${t.learningBuilding})`;
                return text;
            }
        },
        {
            title: `${t.pm25Value} (µg/m³)`,
            dataIndex: 'pm25',
            key: 'pm25',
            sorter: (a, b) => a.pm25 - b.pm25,
            render: (text) => {
                let color;
                if (text <= 15) color = '#00B0F0';
                else if (text <= 25) color = '#00B050';
                else if (text <= 37.5) color = '#FFC000';
                else if (text <= 75) color = '#F25F55';
                else color = '#C00000';

                return <span style={{ fontWeight: 'bold', color: color }}>{text}</span>;
            },
        },
        {
            title: 'ค่า PM10 (µg/m³)',
            dataIndex: 'pm10',
            key: 'pm10',
            sorter: (a, b) => (a.pm10 || 0) - (b.pm10 || 0),
        },
        {
            title: `${t.temperature} (°C)`,
            dataIndex: 'temp',
            key: 'temp',
            sorter: (a, b) => a.temp - b.temp,
        },
        {
            title: `${t.humidity} (%)`,
            dataIndex: 'humidity',
            key: 'humidity',
            sorter: (a, b) => a.humidity - b.humidity,
        },
    ];

    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t.table}</span>
                </div>
            }
            style={{ borderRadius: '15px', marginTop: '10px' }}
            bodyStyle={{ padding: '0' }}
        >
            <style>{`
                .latest-row {
                    background-color: ${isDarkMode ? '#2d4d18' : '#f6ffed'};
                }
                .latest-row:hover > td {
                    background-color: ${isDarkMode ? '#38601d !important' : '#d9f7be !important'};
                }
            `}</style>
            <Table
                dataSource={data}
                columns={columns}
                rowKey={(record, index) => index}
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
                style={{ fontFamily: 'Kanit, sans-serif' }}
                rowClassName={(record) => {
                    const [d, m, y] = record.date.split('/').map(Number);
                    const [h, min, s] = record.time.split(':').map(Number);
                    const timestamp = new Date(y, m - 1, d, h, min, s).getTime();

                    return timestamp === latestTimestamps[record.deviceId] ? 'latest-row' : '';
                }}
            />
        </Card>
    );
};

export default TableView;
