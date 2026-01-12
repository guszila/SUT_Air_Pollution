import React from 'react';
import { Table, Card } from 'antd';
import { useLanguage } from '../context/LanguageContext';

const TableView = ({ data }) => {
    const { t } = useLanguage();

    const columns = [
        {
            title: t.date,
            dataIndex: 'date',
            key: 'date',
            sorter: (a, b) => {
                // Parse DD/MM/YYYY
                const [d1, m1, y1] = a.date.split('/').map(Number);
                const [d2, m2, y2] = b.date.split('/').map(Number);
                const dateA = new Date(y1, m1 - 1, d1);
                const dateB = new Date(y2, m2 - 1, d2);
                return dateA - dateB;
            },
            defaultSortOrder: 'descend', // Newest first by default
        },
        {
            title: t.time,
            dataIndex: 'time',
            key: 'time',
            sorter: (a, b) => a.time.localeCompare(b.time),
        },
        {
            title: t.device,
            dataIndex: 'deviceId',
            key: 'deviceId',
            filters: [
                { text: 'อาคารบรรณสาร (Library)', value: 'ESP32_01' },
                { text: 'อาคารเรียนรวม 1 (Learning Bldg 1)', value: 'ESP32_02' },
            ],
            onFilter: (value, record) => record.deviceId === value,
            render: (text) => {
                if (text === 'ESP32_01') return 'อาคารบรรณสาร';
                if (text === 'ESP32_02') return 'อาคารเรียนรวม 1';
                return text;
            }
        },
        {
            title: `${t.pm25Value} (µg/m³)`,
            dataIndex: 'pm25',
            key: 'pm25',
            sorter: (a, b) => a.pm25 - b.pm25,
            render: (text) => <span style={{ fontWeight: 'bold', color: text > 37 ? '#ff4d4f' : '#52c41a' }}>{text}</span>,
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
                    {/* Settings button removed as requested */}
                </div>
            }
            style={{ borderRadius: '15px', marginTop: '10px' }}
            bodyStyle={{ padding: '0' }}
        >
            <Table
                dataSource={data}
                columns={columns}
                rowKey={(record, index) => index}
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
                style={{ fontFamily: 'Kanit, sans-serif' }}
            />
        </Card>
    );
};

export default TableView;
