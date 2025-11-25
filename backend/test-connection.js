// backend/test-db-connection.js
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 测试数据库连接...');

        // 测试连接
        await prisma.$connect();
        console.log('✅ Prisma连接成功!');

        // 测试查询
        const count = await prisma.knowledgeBasePublish.count();
        console.log(`📊 数据库中现有 ${count} 条知识库记录`);

        // 如果有数据，显示前几条
        if (count > 0) {
            const items = await prisma.knowledgeBasePublish.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' }
            });
            console.log('📋 最新记录:', items.map(item => ({
                id: item.id,
                title: item.title,
                createdAt: item.createdAt
            })));
        } else {
            console.log('💡 数据库中没有记录，可以添加测试数据');
        }

        await prisma.$disconnect();
        console.log('🎉 数据库测试完成!');

    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
    }
}

testConnection();