// test-db-connection.js
const dotenv = require('dotenv');
dotenv.config();

const { testConnection, pool } = require('./backend/config/database');

async function test() {
  console.log('测试数据库连接...');
  
  // 测试连接
  const connected = await testConnection();
  
  if (connected) {
    try {
      // 测试查询
      const [rows] = await pool.query('SELECT COUNT(*) as count FROM user');
      console.log('✅ 用户表记录数:', rows[0].count);
      
      // 查询一个用户示例
      const [users] = await pool.query('SELECT id, nickname, email FROM user LIMIT 1');
      if (users.length > 0) {
        console.log('✅ 示例用户:', users[0]);
      }
    } catch (error) {
      console.error('❌ 查询测试失败:', error.message);
    }
  }
  
  process.exit(0);
}

test();