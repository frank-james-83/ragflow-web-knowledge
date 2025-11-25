const jwt = require('jsonwebtoken');

// 验证管理员权限
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: '访问被拒绝' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查用户是否在RAGFlow用户表中且具有管理员权限
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: '令牌无效' });
  }
};

module.exports = { verifyAdmin };