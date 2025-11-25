// backend/app.js - 简化版本
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

// 基础知识库路由
app.use('/api/knowledge-bases', require('./routes/knowledgeBases'));

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