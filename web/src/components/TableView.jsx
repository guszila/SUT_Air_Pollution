import React from 'react';
import { Table } from 'antd';

const TableView = ({ data }) => {
    const columns = [
        {
            title: 'วันที่',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'เวลา',
            dataIndex: 'time',
            key: 'time',
        },
        {
            title: 'อุปกรณ์ (Device)',
            dataIndex: 'deviceId',
            key: 'deviceId',
            render: (text) => {
                if (text === 'ESP32_01') return 'อาคารบรรณสาร';
                if (text === 'ESP32_02') return 'อาคารเรียนรวม 1';
                return text;
            }
        },
        {
            title: 'ค่า PM2.5 (µg/m³)',
            dataIndex: 'pm25',
            key: 'pm25',
            render: (text) => <span style={{ fontWeight: 'bold', color: text > 37 ? '#ff4d4f' : '#52c41a' }}>{text}</span>,
        },
        {
            title: 'ค่า PM10 (µg/m³)',
            dataIndex: 'pm10',
            key: 'pm10',
        },
        {
            title: 'อุณหภูมิ (°C)',
            dataIndex: 'temp',
            key: 'temp',
        },
        {
            title: 'ความชื้น (%)',
            dataIndex: 'humidity',
            key: 'humidity',
        },
    ];

    return (
        <Table
            dataSource={data}
            columns={columns}
            rowKey={(record, index) => index}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            style={{ fontFamily: 'Kanit, sans-serif' }}
        />
    );
};

export default TableView;
