// backend/middleware/auth.js - 简化版本
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// 简化认证中间件 - 暂时跳过详细权限检查
const verifyAdmin = async (req, res, next) => {
  try {
    // 暂时跳过详细认证，直接允许所有请求
    // 在生产环境中需要实现完整的认证逻辑
    console.log('🔐 管理员操作 - 简化认证通过');

    // 设置模拟用户信息
    req.user = {
      id: 'admin',
      username: 'administrator',
      role: 'admin'
    };

    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(401).json({
      success: false,
      error: '认证失败'
    });
  }
};

// 基础token验证（如果需要）
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    // 如果没有token，暂时允许访问（开发环境）
    req.user = { id: 'guest', role: 'user' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    res.status(401).json({
      success: false,
      error: 'Token无效'
    });
  }
};

module.exports = { verifyAdmin, verifyToken };