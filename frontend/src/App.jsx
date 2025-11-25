// frontend/src/App.jsx - 添加权限控制
import React, { useState, useEffect } from 'react';
import { Input, Card, Row, Col, Spin, message, Layout, Typography, Button, Dropdown, Space } from 'antd';
import { SearchOutlined, BookOutlined, PlusOutlined, UserOutlined, LogoutOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import AdminPanel from './AdminPanel';
import Login from './Login';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Search } = Input;
const { Meta } = Card;

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [adminVisible, setAdminVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
    }
    fetchKnowledgeBases();
  }, []);

  // 获取知识库列表
  const fetchKnowledgeBases = async (search = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/knowledge-bases`, {
        params: { search }
      });

      if (response.data.success) {
        setKnowledgeBases(response.data.data);
      }
    } catch (error) {
      console.error('加载知识库错误:', error);
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除知识库
  const handleDelete = async (id, title) => {
    try {
      await axios.delete(`${API_BASE}/knowledge-bases/${id}`);
      message.success(`已删除: ${title}`);
      fetchKnowledgeBases();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 切换知识库状态
  const handleToggleStatus = async (id, title, currentStatus) => {
    try {
      await axios.patch(`${API_BASE}/knowledge-bases/${id}`, {
        isActive: !currentStatus
      });
      message.success(`${currentStatus ? '已禁用' : '已启用'}: ${title}`);
      fetchKnowledgeBases();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchKnowledgeBases(value);
  };

  const handleCardClick = (kb) => {
    if (kb.embedCode) {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${kb.title} - 智能助手</title>
            <style>
              body { margin: 0; padding: 0; font-family: sans-serif; }
              .header { padding: 16px; background: #f5f5f5; border-bottom: 1px solid #e8e8e8; }
              .container { width: 100vw; height: calc(100vh - 60px); }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin: 0;">${kb.title}</h2>
              <p style="margin: 4px 0 0 0; color: #666;">${kb.description || ''}</p>
            </div>
            <div class="container">
              ${kb.embedCode}
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsLoggedIn(false);
    message.success('已退出登录');
  };

  // 如果没有登录，显示登录页面
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <>
      <Layout className="app-layout">
        <Header className="app-header">
          <div className="header-content">
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              📚 知识库中心
            </Title>

            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null);
                  setAdminVisible(true);
                }}
              >
                发布知识库
              </Button>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button type="text" icon={<UserOutlined />} style={{ color: 'white' }}>
                  管理员
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Header>

        <Content className="app-content">
          <div className="search-section">
            <Search
              placeholder="搜索知识库..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ maxWidth: 500, marginBottom: 32 }}
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
          </div>

          <div className="knowledge-list">
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>加载知识库中...</p>
              </div>
            ) : (
              <Row gutter={[24, 24]}>
                {knowledgeBases.map((kb) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={kb.id}>
                    <Card
                      hoverable
                      className="knowledge-card"
                      cover={
                        kb.iconUrl ? (
                          <img alt={kb.title} src={kb.iconUrl} style={{ height: 160, objectFit: 'cover' }} />
                        ) : (
                          <div className="default-icon">
                            <BookOutlined style={{ fontSize: 64, color: '#1890ff' }} />
                          </div>
                        )
                      }
                      actions={isLoggedIn ? [
                        <EditOutlined
                          key="edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(kb);
                            setAdminVisible(true);
                          }}
                        />,
                        <DeleteOutlined
                          key="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`确定要删除"${kb.title}"吗？`)) {
                              handleDelete(kb.id, kb.title);
                            }
                          }}
                        />
                      ] : []}
                    >
                      <Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{kb.title}</span>
                            {!kb.isActive && (
                              <span style={{
                                fontSize: '12px',
                                color: '#ff4d4f',
                                background: '#fff2f0',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                已禁用
                              </span>
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <p className="kb-description">{kb.description || '暂无描述'}</p>
                            <div className="kb-meta">
                              <span>浏览: {kb.viewCount || 0}</span>
                              <span>{new Date(kb.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {!loading && knowledgeBases.length === 0 && (
              <div className="empty-state">
                <BookOutlined style={{ fontSize: 64, color: '#ccc', marginBottom: 16 }} />
                <p style={{ color: '#999', fontSize: 16 }}>暂无知识库</p>
                <p style={{ color: '#666', fontSize: 14 }}>点击上方按钮发布知识库</p>
              </div>
            )}
          </div>
        </Content>
      </Layout>

      <AdminPanel
        visible={adminVisible}
        onClose={() => {
          setAdminVisible(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setAdminVisible(false);
          setEditingItem(null);
          fetchKnowledgeBases();
        }}
        editingItem={editingItem}
      />
    </>
  );
}

export default App;