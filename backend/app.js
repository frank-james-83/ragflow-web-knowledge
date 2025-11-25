// backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查路由
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'RAGFlow Portal API is running',
        timestamp: new Date().toISOString()
    });
});

// 添加知识库路由（带错误处理）
try {
    const knowledgeBasesRouter = require('./routes/knowledgeBases');
    app.use('/api/knowledge-bases', knowledgeBasesRouter);
    console.log('✅ 知识库路由加载成功');
} catch (error) {
    console.error('❌ 加载知识库路由失败:', error.message);
    // 提供降级路由
    app.use('/api/knowledge-bases', (req, res) => {
        res.json({
            success: true,
            message: '知识库功能正在初始化...',
            data: []
        });
    });
}

// 测试路由
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '测试路由正常工作',
        data: { test: 'ok' }
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '路由未找到'
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📊 环境: ${process.env.NODE_ENV}`);
    console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
    console.log(`🔗 测试路由: http://localhost:${PORT}/api/test`);
    console.log(`🔗 知识库API: http://localhost:${PORT}/api/knowledge-bases`);
});

module.exports = app;