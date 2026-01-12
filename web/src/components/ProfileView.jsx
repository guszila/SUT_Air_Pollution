import React, { useState } from 'react';
import { Card, Avatar, Typography, Button, Divider, Input, Form, message } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, EditOutlined, SaveOutlined, CloseOutlined, TableOutlined } from '@ant-design/icons';
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
                    status: values.status
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'Kanit, sans-serif' }}>
                <Card
                    bordered={false}
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: '20px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        textAlign: 'center',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                    bodyStyle={{ padding: 0 }}
                >
                    {/* Removed Settings Button here as requested */}

                    <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <img src="/sut_logo.png" alt="SUT" style={{ height: '80px', objectFit: 'contain' }} />
                        </div>
                        <Title level={4} style={{ marginBottom: '8px' }}>Welcome to SUT Air</Title>
                        <Text type="secondary">Please log in to access full features</Text>
                        <div style={{ marginTop: '30px' }}>
                            <Button
                                type="primary"
                                block
                                size="large"
                                style={{ backgroundColor: '#00B900', borderColor: '#00B900', height: '50px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'Kanit, sans-serif' }}>
            <Card
                bordered={false}
                style={{
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                }}
                bodyStyle={{ padding: 0 }}
            >
                {/* Removed Settings Button here as requested */}

                <div style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ff8c00 100%)',
                    padding: '40px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative'
                }}>
                    <Avatar
                        size={100}
                        src={userProfile?.pictureUrl}
                        icon={<UserOutlined />}
                        style={{
                            backgroundColor: '#fff',
                            color: '#f97316',
                            border: '4px solid #fff',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}
                    />
                </div>

                <div style={{ padding: '20px' }}>
                    {isEditing ? (
                        <Form form={form} layout="vertical" style={{ textAlign: 'left' }}>
                            <Form.Item
                                name="displayName"
                                label={t.name || "Name"}
                                rules={[{ required: true, message: 'Please input your name!' }]}
                            >
                                <Input size="large" prefix={<UserOutlined />} />
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label={t.status || "Status/Role"}
                            >
                                <Input size="large" placeholder="Student, Staff, etc." />
                            </Form.Item>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Button type="default" block icon={<CloseOutlined />} onClick={handleCancel}>
                                    {t.cancel || "Cancel"}
                                </Button>
                                <Button type="primary" block icon={<SaveOutlined />} onClick={handleSave}>
                                    {t.save || "Save"}
                                </Button>
                            </div>
                        </Form>
                    ) : (
                        <>
                            <div style={{ position: 'relative' }}>
                                <Title level={3} style={{ margin: 0, color: '#333', fontFamily: 'Kanit, sans-serif' }}>
                                    {safeString(userProfile?.displayName || "User")}
                                </Title>
                                <Button
                                    type="text"
                                    icon={<EditOutlined style={{ color: '#f97316' }} />}
                                    onClick={handleEdit}
                                    style={{ position: 'absolute', right: -30, top: 0 }}
                                />
                            </div>

                            <Text type="secondary" style={{ fontFamily: 'Kanit, sans-serif', display: 'block' }}>
                                {safeString(userProfile?.status) || ("Student ID: " + safeUserId(userProfile?.userId))}
                            </Text>

                            <Divider />

                            <div style={{ paddingBottom: '10px' }}>
                                <Button type="primary" danger icon={<LogoutOutlined />} block size="large" onClick={onLogout} style={{ borderRadius: '10px', marginBottom: '15px' }}>
                                    {t.logout || "Logout"}
                                </Button>

                                <Button
                                    icon={<TableOutlined />}
                                    block
                                    size="large"
                                    onClick={onTableClick}
                                    style={{ borderRadius: '10px' }}
                                >
                                    {t.table || "Data Table"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ProfileView;
