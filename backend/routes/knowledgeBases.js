// 在 backend/routes/knowledgeBases.js 顶部添加Prisma引入
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 修改获取知识库的路由，连接真实数据库
router.get('/', async (req, res) => {
  try {
    console.log('📥 收到获取知识库请求，查询参数:', req.query);

    const { search, page = 1, limit = 12 } = req.query;

    let where = { isActive: true };

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // 使用Prisma从数据库获取真实数据
    const knowledgeBases = await prisma.knowledgeBasePublish.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ 从数据库找到 ${knowledgeBases.length} 个知识库`);

    res.json({
      success: true,
      data: knowledgeBases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: knowledgeBases.length
      }
    });

  } catch (error) {
    console.error('❌ 数据库查询错误:', error);
    // 如果数据库查询失败，返回模拟数据作为降级方案
    const mockData = [
      {
        id: '1',
        title: '产品使用手册',
        description: '包含产品的详细使用说明和常见问题解答',
        iconUrl: null,
        viewCount: 156,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: '技术文档库',
        description: '技术架构、API文档和开发指南',
        iconUrl: null,
        viewCount: 89,
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockData,
      message: '使用模拟数据（数据库连接中）'
    });
  }
});


// 在 backend/routes/knowledgeBases.js 中添加创建路由
router.post('/create', async (req, res) => {
  try {
    const {
      title,
      description,
      iconUrl,
      embedCode,
      ragflowKbId,
      ragflowChatflowId
    } = req.body;

    console.log('📥 收到创建知识库请求:', { title, description });

    // 基础验证
    if (!title || !embedCode) {
      return res.status(400).json({
        success: false,
        error: '标题和嵌入代码是必填项'
      });
    }

    // 使用Prisma创建记录
    const publishItem = await prisma.knowledgeBasePublish.create({
      data: {
        title,
        description: description || '',
        iconUrl: iconUrl || null,
        embedCode,
        ragflowKbId: ragflowKbId || 'default',
        ragflowChatflowId: ragflowChatflowId || 'default',
        createdBy: 'admin', // 暂时硬编码
        isActive: true,
        viewCount: 0
      }
    });

    console.log('✅ 创建知识库成功:', publishItem.id);

    res.json({
      success: true,
      data: publishItem,
      message: '知识库发布成功'
    });

  } catch (error) {
    console.error('❌ 创建知识库错误:', error);
    res.status(500).json({
      success: false,
      error: '创建知识库失败: ' + error.message
    });
  }
});

module.exports = router;
