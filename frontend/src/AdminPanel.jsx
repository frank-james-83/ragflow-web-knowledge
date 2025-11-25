// frontend/src/AdminPanel.jsx - 支持编辑功能
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Switch, Space, Divider } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const AdminPanel = ({ visible, onClose, onSuccess, editingItem }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // 当编辑项变化或模态框显示时重置表单
    useEffect(() => {
        if (visible) {
            if (editingItem) {
                // 编辑模式：填充现有数据
                form.setFieldsValue({
                    title: editingItem.title,
                    description: editingItem.description,
                    iconUrl: editingItem.iconUrl,
                    embedCode: editingItem.embedCode,
                    isActive: editingItem.isActive !== false // 默认为true
                });
            } else {
                // 新建模式：清空表单
                form.resetFields();
                form.setFieldsValue({
                    isActive: true
                });
            }
        }
    }, [visible, editingItem, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (editingItem) {
                // 编辑现有知识库
                const response = await axios.put(`${API_BASE}/knowledge-bases/${editingItem.id}`, values);
                if (response.data.success) {
                    message.success('知识库更新成功！');
                    form.resetFields();
                    onSuccess();
                }
            } else {
                // 创建新知识库
                const response = await axios.post(`${API_BASE}/knowledge-bases/create`, values);
                if (response.data.success) {
                    message.success('知识库发布成功！');
                    form.resetFields();
                    onSuccess();
                }
            }
        } catch (error) {
            message.error(editingItem ? '更新失败' : '发布失败: ' + error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickActions = async (action) => {
        if (!editingItem) return;

        try {
            switch (action) {
                case 'toggleStatus':
                    await axios.patch(`${API_BASE}/knowledge-bases/${editingItem.id}`, {
                        isActive: !editingItem.isActive
                    });
                    message.success(`${editingItem.isActive ? '已禁用' : '已启用'}: ${editingItem.title}`);
                    break;

                case 'incrementViews':
                    await axios.patch(`${API_BASE}/knowledge-bases/${editingItem.id}`, {
                        viewCount: (editingItem.viewCount || 0) + 1
                    });
                    message.success('浏览数已增加');
                    break;

                case 'resetViews':
                    await axios.patch(`${API_BASE}/knowledge-bases/${editingItem.id}`, {
                        viewCount: 0
                    });
                    message.success('浏览数已重置');
                    break;
            }
            onSuccess();
        } catch (error) {
            message.error('操作失败');
        }
    };

    return (
        <Modal
            title={
                <div>
                    {editingItem ? (
                        <Space>
                            <EditOutlined />
                            <span>编辑知识库</span>
                            <span style={{ color: '#666', fontSize: '14px' }}>{editingItem.title}</span>
                        </Space>
                    ) : (
                        <Space>
                            <PlusOutlined />
                            <span>发布新知识库</span>
                        </Space>
                    )}
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            destroyOnClose
        >
            {editingItem && (
                <>
                    <div style={{
                        background: '#f5f5f5',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        marginBottom: '16px'
                    }}>
                        <Space size="middle">
                            <span><strong>ID:</strong> {editingItem.id}</span>
                            <span><strong>创建时间:</strong> {new Date(editingItem.createdAt).toLocaleString()}</span>
                            <span><strong>浏览数:</strong> {editingItem.viewCount || 0}</span>
                        </Space>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <Space>
                            <Button
                                size="small"
                                onClick={() => handleQuickActions('toggleStatus')}
                                type={editingItem.isActive === false ? 'primary' : 'default'}
                            >
                                {editingItem.isActive === false ? '启用' : '禁用'}
                            </Button>
                            <Button
                                size="small"
                                onClick={() => handleQuickActions('incrementViews')}
                            >
                                增加浏览数
                            </Button>
                            <Button
                                size="small"
                                onClick={() => handleQuickActions('resetViews')}
                            >
                                重置浏览数
                            </Button>
                        </Space>
                    </div>
                    <Divider />
                </>
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    isActive: true
                }}
            >
                <Form.Item
                    name="title"
                    label="知识库标题"
                    rules={[
                        { required: true, message: '请输入标题' },
                        { min: 2, message: '标题至少2个字符' },
                        { max: 100, message: '标题不能超过100个字符' }
                    ]}
                >
                    <Input
                        placeholder="例如：产品使用手册"
                        showCount
                        maxLength={100}
                    />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="描述"
                    rules={[
                        { max: 500, message: '描述不能超过500个字符' }
                    ]}
                >
                    <Input.TextArea
                        placeholder="描述这个知识库的内容和用途..."
                        rows={3}
                        showCount
                        maxLength={500}
                    />
                </Form.Item>

                <Form.Item
                    name="embedCode"
                    label="嵌入代码"
                    rules={[
                        { required: true, message: '请粘贴RAGFlow提供的嵌入代码' },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                if (!value.includes('<iframe') || !value.includes('src=')) {
                                    return Promise.reject(new Error('请粘贴有效的iframe嵌入代码'));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input.TextArea
                        placeholder='粘贴完整的iframe代码，例如：&lt;iframe src="http://localhost/next-chats/share?shared_id=..." style="width:100%;height:600px" frameborder="0"&gt;&lt;/iframe&gt;'
                        rows={6}
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                    />
                </Form.Item>

                <Form.Item
                    name="iconUrl"
                    label="图标URL（可选）"
                    rules={[
                        {
                            type: 'url',
                            message: '请输入有效的URL地址'
                        }
                    ]}
                >
                    <Input placeholder="https://example.com/icon.png" />
                </Form.Item>

                <Form.Item
                    name="isActive"
                    label="状态"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
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
                        {editingItem ? '更新知识库' : '发布知识库'}
                    </Button>
                </Form.Item>
            </Form>

            {!editingItem && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#f0f7ff',
                    border: '1px solid #91d5ff',
                    borderRadius: '6px'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>💡 使用说明</h4>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#666' }}>
                        <li>在RAGFlow中创建聊天助手并获取嵌入代码</li>
                        <li>复制完整的iframe代码粘贴到"嵌入代码"字段</li>
                        <li>填写标题和描述，方便用户识别</li>
                        <li>可选择添加图标URL美化显示</li>
                        <li>发布后用户即可在知识库中心访问</li>
                    </ol>
                </div>
            )}
        </Modal>
    );
};

export default AdminPanel;