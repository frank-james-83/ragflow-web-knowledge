// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// 管理员权限验证
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '需要管理员权限'
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // 检查是否为超级用户
    if (!decoded.isSuperuser) {
      return res.status(403).json({
        success: false,
        error: '权限不足，需要管理员权限'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token无效'
      });
    }
    
    console.error('管理员认证错误:', error);
    res.status(500).json({
      success: false,
      error: '认证服务错误'
    });
  }
};

// 基础token验证
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    // 对于公开接口，可以继续但标记为访客
    req.user = { id: 'guest', role: 'guest' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token无效'
      });
    }
    
    console.error('Token验证失败:', error);
    res.status(500).json({
      success: false,
      error: '认证服务错误'
    });
  }
};

module.exports = { verifyAdmin, verifyToken };