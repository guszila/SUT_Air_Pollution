import React, { useState, useMemo } from 'react';
import { Table, Card, Input, Button, Dropdown, message } from 'antd';
import { DownloadOutlined, DownOutlined } from '@ant-design/icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const TableView = ({ data }) => {
    const { t } = useLanguage();
    const { isDarkMode } = useTheme();
    const [searchText, setSearchText] = useState('');

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

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchText) return data;

        const lowerSearchText = searchText.toLowerCase();
        return data.filter(item => {
            const deviceName = item.deviceId === 'ESP32_01' ? `ESP32_01 (${t.library})` :
                item.deviceId === 'ESP32_02' ? `ESP32_02 (${t.learningBuilding})` :
                    item.deviceId;
            
            const matchDevice = deviceName?.toLowerCase().includes(lowerSearchText);
            const matchDate = item.date?.toLowerCase().includes(lowerSearchText);
            
            return matchDevice || matchDate;
        });
    }, [data, searchText, t]);

    const downloadCSV = (deviceId) => {
        let exportData = filteredData;
        if (deviceId !== 'all') {
             exportData = filteredData.filter(item => item.deviceId === deviceId);
        }

        if (!exportData || exportData.length === 0) {
            message.warning(t.language === 'en' ? 'No data to download' : 'ไม่มีข้อมูลสำหรับดาวน์โหลด');
            return;
        }

        // Header mapping
        const headers = [t.date || "Date", t.time || "Time", t.device || "Device", "PM2.5 (µg/m³)", "PM10 (µg/m³)", `${t.temperature || "Temperature"} (°C)`, `${t.humidity || "Humidity"} (%)`];

        const csvRows = exportData.map(row => {
            const deviceName = row.deviceId === 'ESP32_01' ? `ESP32_01 (${t.library || 'Library'})` :
                row.deviceId === 'ESP32_02' ? `ESP32_02 (${t.learningBuilding || 'Learning Bldg'})` :
                    row.deviceId;
            return [
                row.date,
                row.time,
                deviceName,
                row.pm25,
                row.pm10 || 0,
                row.temp,
                row.humidity
            ].join(',');
        });

        // Add BOM for Excel UTF-8 support
        const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const fileNameSuffix = deviceId === 'all' ? 'all' : deviceId;
        link.setAttribute("download", `air_quality_${fileNameSuffix}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadItems = [
        {
            key: 'all',
            label: t.language === 'en' ? 'All Devices' : 'ทุกอุปกรณ์',
        },
        {
            key: 'ESP32_01',
            label: `ESP32_01 (${t.library || 'Library'})`,
        },
        {
            key: 'ESP32_02',
            label: `ESP32_02 (${t.learningBuilding || 'Learning Bldg'})`,
        },
    ];

    const handleMenuClick = (e) => {
        downloadCSV(e.key);
    };

    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <span>{t.table}</span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Dropdown menu={{ items: downloadItems, onClick: handleMenuClick }} placement="bottomRight">
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                style={{
                                    backgroundColor: isDarkMode ? '#177ddc' : '#f97316',
                                    fontFamily: 'Kanit, sans-serif'
                                }}
                            >
                                {t.language === 'en' ? "Download CSV" : "ดาวน์โหลดข้อมูล (CSV)"} <DownOutlined />
                            </Button>
                        </Dropdown>
                        <Input.Search
                            placeholder={t.language === 'en' ? "Search device name or date..." : "ค้นหาชื่ออุปกรณ์ หรือ วัน/เดือน/ปี..."}
                            allowClear
                            onChange={(e) => setSearchText(e.target.value)}
                            onSearch={(value) => setSearchText(value)}
                            style={{ width: 300 }}
                        />
                    </div>
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
                dataSource={filteredData}
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
