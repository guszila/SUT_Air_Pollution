import React from 'react';
import { Card, Typography, Radio, Space } from 'antd';
import { useLanguage } from '../context/LanguageContext';

const { Title, Text } = Typography;

const Settings = () => {
    const { language, setLanguage, t } = useLanguage();

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
            </Card>
        </div>
    );
};

export default Settings;
