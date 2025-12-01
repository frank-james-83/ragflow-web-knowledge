import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, List } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

// const API_BASE = 'http://localhost:3001/api';
const API_BASE = '/sidel/api';

const AdminPanel = ({ visible, onClose, onSuccess, editingItem }) => {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 获取知识库列表
  const fetchKnowledgeBases = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE}/knowledge-bases`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      });
      if (response.data.success) {
        setKnowledgeBases(response.data.data);
      }
    } catch (error) {
      console.error('获取知识库失败:', error);
    }
  };

  // 当面板打开时获取数据
  useEffect(() => {
    if (visible) {
      fetchKnowledgeBases();
      // 如果是编辑模式，填充表单
      if (editingItem) {
        form.setFieldsValue(editingItem);
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingItem, form]);

  // 发布/更新知识库
  const handlePublish = async (values) => {
    setLoading(true);
    try {
      // 获取认证token
      const token = localStorage.getItem('adminToken');
      
      // 检查是否有token
      if (!token) {
        message.error('请先登录');
        setLoading(false);
        return;
      }
      
      let response;
      if (editingItem) {
        // 更新知识库 - 使用 put 方法
        response = await axios.put(`${API_BASE}/knowledge-bases/${editingItem.id}`, values, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // 创建知识库 - 使用 /create 路由
        response = await axios.post(`${API_BASE}/knowledge-bases/create`, values, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      if (response.data.success) {
        message.success(editingItem ? '知识库更新成功！' : '知识库发布成功！');
        form.resetFields();
        onSuccess && onSuccess();
      }
    } catch (error) {
      message.error((editingItem ? '更新' : '发布') + '失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 删除知识库
  const handleDelete = async (id, title) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        message.error('请先登录');
        return;
      }
      
      await axios.delete(`${API_BASE}/knowledge-bases/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success(`已删除知识库: ${title}`);
      fetchKnowledgeBases();
      onSuccess && onSuccess();
    } catch (error) {
      message.error('删除失败: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Modal
      title={editingItem ? "编辑知识库" : "发布新知识库"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      afterOpenChange={(open) => {
        if (!open) {
          form.resetFields();
        }
      }}
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handlePublish}
        initialValues={{
          title: '',
          description: '',
          embedCode: ''
        }}
      >
        <Form.Item
          name="title"
          label="知识库标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="例如：产品使用手册" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea 
            placeholder="描述这个知识库的内容和用途"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="embedCode"
          label="嵌入代码"
          rules={[{ required: true, message: '请粘贴RAGFlow提供的嵌入代码' }]}
        >
          <Input.TextArea 
            placeholder='粘贴 <iframe src="http://localhost/next-chats/share?shared_id=..." ...></iframe>'
            rows={6}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {editingItem ? "更新知识库" : "发布知识库"}
          </Button>
        </Form.Item>
      </Form>

      {knowledgeBases.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>已有知识库</h3>
          <List
            dataSource={knowledgeBases}
            renderItem={(kb) => (
              <List.Item
                actions={[
                  <EditOutlined 
                    key="edit" 
                    onClick={() => {
                      form.setFieldsValue(kb);
                    }} 
                  />,
                  <DeleteOutlined 
                    key="delete" 
                    onClick={() => {
                      if (window.confirm(`确定要删除"${kb.title}"吗？`)) {
                        handleDelete(kb.id, kb.title);
                      }
                    }} 
                  />
                ]}
              >
                <List.Item.Meta
                  title={kb.title}
                  description={kb.description}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </Modal>
  );
};

export default AdminPanel;