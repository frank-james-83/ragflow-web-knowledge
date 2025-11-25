// frontend/src/Login.jsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Layout, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './Login.css';

const { Title } = Typography;
const { Content } = Layout;

const Login = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);

    const handleLogin = async (values) => {
        setLoading(true);
        try {
            // 简化登录 - 在实际项目中这里应该调用后端API验证
            if (values.username === 'admin' && values.password === 'admin123') {
                localStorage.setItem('adminToken', 'logged-in');
                localStorage.setItem('adminUser', JSON.stringify({
                    username: 'admin',
                    role: 'admin'
                }));
                message.success('登录成功！');
                onLogin();
            } else {
                message.error('用户名或密码错误');
            }
        } catch (error) {
            message.error('登录失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout className="login-layout">
            <Content className="login-content">
                <Card className="login-card">
                    <div className="login-header">
                        <Title level={2}>🔐 管理员登录</Title>
                        <p>请输入管理员凭据访问管理功能</p>
                    </div>

                    <Form
                        name="login"
                        onFinish={handleLogin}
                        autoComplete="off"
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: '请输入用户名' }]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="用户名"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: '请输入密码' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="密码"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                size="large"
                            >
                                登录
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="login-tip">
                        <p><strong>测试账号:</strong></p>
                        <p>用户名: admin</p>
                        <p>密码: admin123</p>
                    </div>
                </Card>
            </Content>
        </Layout>
    );
};

export default Login;