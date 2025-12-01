// frontend/src/App.jsx
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

// const API_BASE = 'http://localhost:3001/api';
const API_BASE = '/sidel/api';

function App() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [adminVisible, setAdminVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 检查登录状态 - 只在组件挂载时执行一次
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          // 验证 token 是否有效
          await axios.get(`${API_BASE}/auth/verify-token`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setIsLoggedIn(true);
        } catch (error) {
          // Token 无效，清除本地存储
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      }
      fetchKnowledgeBases();
    };

    checkAuthStatus();
  }, []); // 添加空依赖数组，确保只执行一次

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
    console.log('=== 点击知识库调试信息 ===');
    console.log('知识库对象:', kb);
    console.log('嵌入代码:', kb.embedCode);

    // 增加浏览计数
    const updateViewCount = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.patch(`${API_BASE}/knowledge-bases/${kb.id}`, {
          viewCount: (kb.viewCount || 0) + 1
        }, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined
          }
        });

        // 更新本地状态以反映新的浏览计数
        setKnowledgeBases(prev => prev.map(item =>
          item.id === kb.id
            ? { ...item, viewCount: (item.viewCount || 0) + 1 }
            : item
        ));
      } catch (error) {
        console.error('更新浏览计数失败:', error);
      }
    };

    // 执行更新浏览计数
    updateViewCount();

    if (kb.embedCode) {
      // 尝试多种方式打开
      const embedCode = kb.embedCode.trim();

      // 方法1: 直接提取URL
      const urlMatch = embedCode.match(/src="([^"]*)"/);
      if (urlMatch && urlMatch[1]) {
        const chatUrl = urlMatch[1];
        console.log('✅ 成功提取URL:', chatUrl);

        // 直接打开URL
        window.open(chatUrl, '_blank');
        return;
      }

      // 方法2: 创建完整页面
      console.log('🔄 使用创建页面方式');
      const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
      if (newWindow) {
        newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${kb.title}</title>
            <meta charset="utf-8">
            <style>
              body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
              .container { width: 100vw; height: 100vh; }
            </style>
          </head>
          <body>
            <div class="container">
              ${embedCode}
            </div>
          </body>
        </html>
      `);
        newWindow.document.close();
      } else {
        console.error('❌ 无法打开新窗口');
        message.error('无法打开聊天界面，请检查浏览器弹窗设置');
      }
    } else {
      message.warning(`知识库 "${kb.title}" 没有配置聊天界面`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsLoggedIn(false);
    message.success('已退出登录');
  };

  // 定义用户菜单项（移到使用之前）
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const handleAdminMenuClick = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    console.log('登录成功');
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleAdminAccess = () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      setEditingItem(null);
      setAdminVisible(true);
      // 确保登录模态框关闭
      setShowLoginModal(false);
    } else {
      setShowLoginModal(true);
    }
  };

  // 显示登录模态框
  if (showLoginModal) {
    return (
      <Login
        onLogin={handleLoginSuccess}
        onCancel={() => setShowLoginModal(false)}
      />
    );
  }

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
                onClick={handleAdminAccess}
              >
                发布知识库
              </Button>

              <Dropdown
                menu={{ items: isLoggedIn ? userMenuItems : [] }}
                placement="bottomRight"
                trigger={['click']}
                onOpenChange={(open) => {
                  if (open && !isLoggedIn) {
                    handleAdminMenuClick();
                  }
                }}
              >
                <Button
                  type="text"
                  icon={<UserOutlined />}
                  style={{ color: 'white' }}
                  onClick={!isLoggedIn ? handleAdminMenuClick : undefined}
                >
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
                      onClick={() => handleCardClick(kb)}
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