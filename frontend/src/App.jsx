// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Input, Card, Row, Col, Spin, message, Layout, Typography } from 'antd';
import { SearchOutlined, BookOutlined } from '@ant-design/icons';
import axios from 'axios';
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

  // 获取知识库列表
  const fetchKnowledgeBases = async (search = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/knowledge-bases`, {
        params: { search }
      });
      
      if (response.data.success) {
        setKnowledgeBases(response.data.data);
      } else {
        message.error('加载知识库失败');
      }
    } catch (error) {
      console.error('加载知识库错误:', error);
      // 如果后端不可用，使用模拟数据
      const mockData = [
        {
          id: '1',
          title: '产品使用手册',
          description: '包含产品的详细使用说明和常见问题解答',
          iconUrl: null,
          viewCount: 156,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: '技术文档库', 
          description: '技术架构、API文档和开发指南',
          iconUrl: null,
          viewCount: 89,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          title: '客户服务知识库',
          description: '客户常见问题和解决方案',
          iconUrl: null,
          viewCount: 203,
          createdAt: new Date().toISOString()
        }
      ];
      setKnowledgeBases(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchKnowledgeBases(value);
  };

  const handleCardClick = (kb) => {
    message.info(`点击了: ${kb.title}`);
    // 后续这里会打开嵌入的聊天页面
    console.log('知识库信息:', kb);
  };

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-content">
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            📚 知识库中心
          </Title>
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
                        <img 
                          alt={kb.title} 
                          src={kb.iconUrl} 
                          style={{ height: 160, objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="default-icon">
                          <BookOutlined style={{ fontSize: 64, color: '#1890ff' }} />
                        </div>
                      )
                    }
                    onClick={() => handleCardClick(kb)}
                  >
                    <Meta
                      title={kb.title}
                      description={
                        <div>
                          <p className="kb-description">
                            {kb.description || '暂无描述'}
                          </p>
                          <div className="kb-meta">
                            <span>浏览: {kb.viewCount || 0}</span>
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
              <p style={{ color: '#666', fontSize: 14 }}>请稍后查看或联系管理员添加</p>
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default App;