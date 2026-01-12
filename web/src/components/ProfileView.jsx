import React, { useState } from 'react';
import { Card, Avatar, Typography, Button, Divider, Input, Form, message, Tag, Row, Col, InputNumber } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, EditOutlined, SaveOutlined, CloseOutlined, TableOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useLanguage } from '../context/LanguageContext';

const { Title, Text } = Typography;

const ProfileView = ({ userProfile, onLogout, onSettingsClick, onTableClick, onUpdateProfile, onLogin }) => {
    // 1. Safeguard Context
    const languageContext = useLanguage();
    const t = languageContext?.t || {};

    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();

    const handleEdit = () => {
        if (!userProfile) return;
        form.setFieldsValue({
            displayName: userProfile?.displayName,
            status: userProfile?.status || "Student",
            age: userProfile?.age || "", // Add Age field
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        form.resetFields();
    };

    const handleSave = () => {
        if (!userProfile) return;
        form.validateFields().then(values => {
            if (onUpdateProfile) {
                onUpdateProfile({
                    ...userProfile,
                    displayName: values.displayName,
                    status: values.status,
                    age: values.age
                });
                message.success(t.profileUpdated || "Profile updated successfully");
            }
            setIsEditing(false);
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    // Helper for safe string access
    const safeString = (str) => String(str || "");
    const safeUserId = (id) => {
        const s = safeString(id);
        return s.length > 8 ? s.substring(0, 8) + '...' : s || "Unknown";
    };

    // 2. Strict Boolean Check for Login Status
    const hasProfile = userProfile && typeof userProfile === 'object';
    const hasUserId = hasProfile && userProfile.userId;
    const isLoggedIn = !!(hasProfile && hasUserId);

    // --- LOGGED OUT STATE ---
    if (!isLoggedIn) {
        return (
            <div style={{ padding: '20px', fontFamily: 'Kanit, sans-serif', maxWidth: 800, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <UserOutlined style={{ fontSize: '32px', color: '#f97316', marginRight: '10px' }} />
                    <Title level={2} style={{ margin: 0, color: '#f97316', fontFamily: 'Kanit, sans-serif' }}>
                        โปรไฟล์
                    </Title>
                </div>
                <Text style={{ fontSize: '18px', color: '#666', display: 'block', marginBottom: '20px' }}>
                    ข้อมูลส่วนตัว
                </Text>

                <Card
                    bordered={false}
                    style={{
                        width: '100%',
                        borderRadius: '20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ padding: '40px 20px' }}>
                        <img src="/sut_logo.png" alt="SUT" style={{ height: '80px', objectFit: 'contain', marginBottom: '20px' }} />
                        <Title level={4} style={{ marginBottom: '8px' }}>Welcome to SUT Air</Title>
                        <Text type="secondary">กรุณาเข้าสู่ระบบเพื่อใช้งาน / Please log in</Text>
                        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                            <Button
                                type="primary"
                                size="large"
                                style={{ backgroundColor: '#00B900', borderColor: '#00B900', height: '50px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', minWidth: '200px' }}
                                onClick={onLogin}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE" style={{ width: '24px', height: '24px', marginRight: '10px' }} />
                                    Log in with LINE
                                </div>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // --- LOGGED IN STATE ---
    return (
        <div style={{ padding: '20px', fontFamily: 'Kanit, sans-serif', maxWidth: 800, margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <UserOutlined style={{ fontSize: '30px', color: '#f97316', marginRight: '10px' }} />
                <Title level={2} style={{ margin: 0, color: '#f97316', fontFamily: 'Kanit, sans-serif', fontWeight: 'bold' }}>
                    โปรไฟล์
                </Title>
            </div>
            <Text style={{ fontSize: '16px', color: '#333', display: 'block', marginBottom: '20px', marginLeft: '40px' }}>
                ข้อมูลส่วนตัว
            </Text>

            <Card
                bordered={false}
                style={{
                    width: '100%',
                    borderRadius: '20px',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
                    background: '#fff',
                    overflow: 'hidden'
                }}
                bodyStyle={{ padding: '24px' }}
            >
                {isEditing ? (
                    <Form form={form} layout="vertical" style={{ textAlign: 'left' }}>
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="displayName"
                                    label="ชื่อ (Name)"
                                    rules={[{ required: true, message: 'Please input your name!' }]}
                                >
                                    <Input size="large" prefix={<UserOutlined />} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="age"
                                    label="อายุ (Age)"
                                >
                                    <InputNumber size="large" style={{ width: '100%' }} min={1} max={120} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            name="status"
                            label="สถานะ (Status/Role)"
                        >
                            <Input size="large" placeholder="Student, Staff, etc." />
                        </Form.Item>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                            <Button size="large" icon={<CloseOutlined />} onClick={handleCancel} style={{ borderRadius: '10px', padding: '0 30px' }}>
                                ยกเลิก
                            </Button>
                            <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSave} style={{ borderRadius: '10px', backgroundColor: '#f97316', borderColor: '#f97316', padding: '0 30px' }}>
                                บันทึก
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                        {/* Profile Info Left Side */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '250px' }}>
                            <Avatar
                                size={100}
                                src={userProfile?.pictureUrl}
                                icon={<UserOutlined />}
                                shape="square"
                                style={{
                                    borderRadius: '20px',
                                    border: '1px solid #eee',
                                }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Title level={3} style={{ margin: 0, fontFamily: 'Kanit, sans-serif', fontWeight: 'bold' }}>
                                    {safeString(userProfile?.displayName || "User")}
                                </Title>

                                {userProfile?.age && (
                                    <Text style={{ fontSize: '16px', color: '#666', fontFamily: 'Kanit, sans-serif' }}>
                                        อายุ: {userProfile.age} ปี
                                    </Text>
                                )}

                                <Tag
                                    icon={<CheckCircleFilled />}
                                    color="#00B900"
                                    style={{
                                        marginTop: '8px',
                                        borderRadius: '20px',
                                        padding: '4px 12px',
                                        fontSize: '14px',
                                        border: 'none',
                                        fontFamily: 'Kanit, sans-serif'
                                    }}
                                >
                                    เชื่อมต่อแล้ว (LINE)
                                </Tag>
                            </div>
                        </div>

                        {/* Edit Button Right Side */}
                        <div>
                            <Button
                                size="large"
                                icon={<EditOutlined style={{ color: '#f97316' }} />}
                                onClick={handleEdit}
                                style={{
                                    height: '50px',
                                    borderRadius: '15px',
                                    borderColor: '#f97316',
                                    color: '#f97316',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    padding: '0 24px',
                                    borderWidth: '2px'
                                }}
                            >
                                แก้ไขข้อมูล
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Logout Section Below */}
            <div style={{ marginTop: '30px' }}>
                <Button
                    type="text"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={onLogout}
                    style={{ fontSize: '16px' }}
                >
                    {t.logout || "Logout"}
                </Button>
            </div>
        </div>
    );
};

export default ProfileView;
