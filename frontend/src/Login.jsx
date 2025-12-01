// frontend/src/Login.jsx (或类似的登录组件)
import React, { useState } from 'react';
import { Form, Input, Button, message, Modal } from 'antd';
import axios from 'axios';

// const API_BASE = 'http://localhost:3001/api';
const API_BASE = '/sidel/api';

const Login = ({ onLogin, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 调用真实的登录接口
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username: values.username,
        password: values.password
      });

      if (response.data.success) {
        // 保存 token 和用户信息
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        message.success('登录成功');
        onLogin();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.error('用户名或密码错误');
      } else {
        message.error('登录失败: ' + (error.response?.data?.message || '服务器错误'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="管理员登录"
      open={true}
      footer={null}
      onCancel={onCancel}
    >
      <Form onFinish={handleSubmit}>
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="用户名或邮箱" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password placeholder="密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Login;