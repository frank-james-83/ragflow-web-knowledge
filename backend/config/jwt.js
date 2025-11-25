// backend/config/jwt.js
module.exports = {
    secret: process.env.JWT_SECRET || 'ragflow-portal-secret-key-2024-change-in-production',
    expiresIn: '24h', // token有效期
    algorithm: 'HS256'
};