// test-jwt.js
const jwt = require('jsonwebtoken');

// 检查 jwtConfig 内容
const jwtConfig = {
  secret: 'ragflow-portal-secret-key-2024', // 替换为实际的密钥
  expiresIn: '24h'
};

// 测试 token 生成和验证
const testPayload = {
  id: '39f3883ec4e611f096e996fe0646053a',
  username: 'james',
  email: 'james.zhang@sidel.com',
  isSuperuser: 0
};

try {
  // 生成 token
  const token = jwt.sign(testPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
  console.log('✅ Token generated successfully:');
  console.log(token);
  
  // 验证 token
  const decoded = jwt.verify(token, jwtConfig.secret);
  console.log('\n✅ Token verified successfully:');
  console.log(decoded);
  
} catch (error) {
  console.error('❌ JWT Error:', error.message);
}