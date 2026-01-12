import React from 'react';
import { Card, Typography, Radio, Space, Switch, Row, Col, Slider, InputNumber, Select, Divider } from 'antd';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

const { Title, Text } = Typography;

const Settings = () => {
    const { language, setLanguage, t } = useLanguage();
    const { isDarkMode, setIsDarkMode } = useTheme();
    const { alertThreshold, setAlertThreshold, refreshInterval, setRefreshInterval } = useSettings();

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
            <Card
                title={<Title level={4} style={{ margin: 0, fontFamily: 'Kanit, sans-serif' }}>{t.settings}</Title>}
                style={{ borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
                <div style={{ marginBottom: '20px' }}>
                    <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>{language === 'th' ? 'ภาษา (Language)' : 'Language'}</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '10px', fontFamily: 'Kanit, sans-serif' }}>
                        {language === 'th' ? 'เลือกภาษาที่ต้องการแสดงผล' : 'Select your preferred language'}
                    </Text>

                    <Radio.Group onChange={handleLanguageChange} value={language}>
                        <Space direction="vertical">
                            <Radio value="th" style={{ fontFamily: 'Kanit, sans-serif' }}>ไทย (Thai)</Radio>
                            <Radio value="en" style={{ fontFamily: 'Kanit, sans-serif' }}>อังกฤษ (English)</Radio>
                        </Space>
                    </Radio.Group>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Title level={5} style={{ fontFamily: 'Kanit, sans-serif', margin: 0 }}>
                                {language === 'th' ? 'โหมดสี (Theme)' : 'Display Theme'}
                            </Title>
                            <Text type="secondary" style={{ fontFamily: 'Kanit, sans-serif' }}>
                                {language === 'th' ? 'สลับโหมดมืด/สว่าง' : 'Toggle Dark/Light mode'}
                            </Text>
                        </Col>
                        <Col>
                            <Switch
                                checked={isDarkMode}
                                onChange={setIsDarkMode}
                                checkedChildren="Dark"
                                unCheckedChildren="Light"
                            />
                        </Col>
                    </Row>
                </div>

                <Divider />

                {/* Notification Settings */}
                <div style={{ marginBottom: '20px' }}>
                    <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>{t.notification}</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '10px', fontFamily: 'Kanit, sans-serif' }}>
                        {t.alertThreshold}
                    </Text>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Slider
                                min={0}
                                max={500}
                                value={alertThreshold}
                                onChange={setAlertThreshold}
                                marks={{
                                    0: '0',
                                    100: '100',
                                    250: '250',
                                    500: '500'
                                }}
                            />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                min={0}
                                max={500}
                                style={{ margin: '0 16px', fontFamily: 'Kanit, sans-serif' }}
                                value={alertThreshold}
                                onChange={setAlertThreshold}
                            />
                        </Col>
                        <Col span={8}>
                            <Text>µg/m³</Text>
                        </Col>
                    </Row>
                </div>

                <Divider />

                {/* Auto Refresh Settings */}
                <div style={{ marginBottom: '20px' }}>
                    <Title level={5} style={{ fontFamily: 'Kanit, sans-serif' }}>{t.autoRefresh}</Title>
                    <Select
                        defaultValue={60000}
                        style={{ width: 200, fontFamily: 'Kanit, sans-serif' }}
                        onChange={setRefreshInterval}
                        value={refreshInterval}
                        options={[
                            { value: 60000, label: t.every1min },
                            { value: 300000, label: t.every5min },
                            { value: 0, label: t.turnOff },
                        ]}
                    />
                </div>

            </Card >
        </div >
    );
};

export default Settings;
