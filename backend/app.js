// backend/app.js - 修正版本
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// 加载环境变量（必须在使用环境变量之前）
dotenv.config();

const app = express();

// 中间件
app.use(helmet());
app.use(cors({
    origin: true, // 允许所有来源，生产环境应该指定具体域名
    credentials: true // 如果需要发送cookies
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查路由
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'RAGFlow Portal API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// 认证路由
const authRoutes = require('./routes/auth');
const { verify } = require('jsonwebtoken');
const { verifyToken } = require('./middleware/auth');
app.use('/api/auth', authRoutes);

// 基础知识库路由
app.use('/api/knowledge-bases', verifyToken, require('./routes/knowledgeBases'));

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '路由未找到'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        error: '内部服务器错误'
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📊 环境: ${process.env.NODE_ENV}`);
    console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;