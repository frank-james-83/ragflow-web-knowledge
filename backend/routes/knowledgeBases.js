// backend/routes/knowledgeBases.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// 获取所有知识库（支持搜索和分页）
router.get('/', async (req, res) => {
  try {
    console.log('📥 收到获取知识库请求');

    const { search, page = 1, limit = 12, includeInactive = false } = req.query;

    let where = {};

    // 如果不包含禁用项，只查询活跃的
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // 获取总数用于分页
    const total = await prisma.knowledgeBasePublish.count({ where });

    // 获取数据
    const knowledgeBases = await prisma.knowledgeBasePublish.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        iconUrl: true,
        embedCode: true,
        ragflowKbId: true,
        ragflowChatflowId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        viewCount: true
      }
    });

    console.log(`✅ 从数据库找到 ${knowledgeBases.length} 个知识库`);

    res.json({
      success: true,
      data: knowledgeBases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ 数据库查询错误:', error);
    res.status(500).json({
      success: false,
      error: '获取知识库失败: ' + error.message
    });
  }
});

// 根据ID获取单个知识库
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📥 获取单个知识库: ${id}`);

    const knowledgeBase = await prisma.knowledgeBasePublish.findUnique({
      where: { id }
    });

    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        error: '知识库不存在'
      });
    }

    res.json({
      success: true,
      data: knowledgeBase
    });

  } catch (error) {
    console.error('❌ 获取知识库错误:', error);
    res.status(500).json({
      success: false,
      error: '获取知识库失败: ' + error.message
    });
  }
});

// 创建知识库
router.post('/create', async (req, res) => {
  console.log('🔍 开始处理创建请求...');
  console.log('🔐 req.user 内容:', JSON.stringify(req.user, null, 2));
  try {
    const {
      title,
      description,
      iconUrl,
      embedCode,
      isActive = true
    } = req.body;

    console.log('📥 收到请求数据:', JSON.stringify(req.body, null, 2));

    // 基础验证
    if (!title || !embedCode) {
      console.log('❌ 验证失败: 标题或嵌入代码为空');
      return res.status(400).json({
        success: false,
        error: '标题和嵌入代码是必填项'
      });
    }

    // 从请求中获取用户信息（假设通过认证中间件添加到req.user）
    let userId = null;
    
    // 如果使用 JWT token 认证，用户信息通常在 req.user 中
    if (req.user && req.user.id) {
      userId = req.user.id;
    } 
    // 或者如果用户信息在 req.auth 中
    else if (req.auth && req.auth.userId) {
      userId = req.auth.userId;
    }
    // 或者从 headers 中获取（如果前端发送了用户ID）
    else if (req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    }

    // 如果仍然没有用户ID，则使用默认值（仅用于开发环境）
    if (!userId) {
      console.warn('⚠️ 未找到用户ID，使用默认值');
      userId = '39f3883ec4e611f096e996fe0646053a'; // 仅用于开发环境
    }

    console.log('👤 使用用户ID:', userId);

    // 检查标题是否已存在
    const existing = await prisma.knowledgeBasePublish.findFirst({
      where: { title: title.trim() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: '标题已存在，请使用不同的标题'
      });
    }

    // 创建记录
    const publishItem = await prisma.knowledgeBasePublish.create({
      data: {
        title: title.trim(),
        description: (description || '').trim(),
        iconUrl: iconUrl || null,
        embedCode: embedCode.trim(),
        ragflowKbId: 'default-kb-id',
        ragflowChatflowId: 'default-chat-id',
        createdBy: userId, // 使用从请求中获取的用户ID
        isActive: isActive !== false,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ 数据库创建成功，ID:', publishItem.id);

    res.json({
      success: true,
      data: publishItem,
      message: '知识库发布成功'
    });

  } catch (error) {
    console.error('❌ 创建过程中发生错误:');
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code);

    let errorMessage = '创建知识库失败';

    if (error.code === 'P2002') {
      errorMessage = '数据冲突，请检查输入内容';
    } else if (error.code === 'P2003') {
      errorMessage = '外键约束违反，用户不存在';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 更新知识库
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      iconUrl,
      embedCode,
      isActive,
      viewCount
    } = req.body;

    console.log(`📥 更新知识库: ${id}`, req.body);

    // 检查知识库是否存在
    const existing = await prisma.knowledgeBasePublish.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '知识库不存在'
      });
    }

    // 如果更新标题，检查是否与其他记录冲突
    if (title && title !== existing.title) {
      const titleExists = await prisma.knowledgeBasePublish.findFirst({
        where: {
          title: title.trim(),
          NOT: { id }
        }
      });

      if (titleExists) {
        return res.status(400).json({
          success: false,
          error: '标题已存在，请使用不同的标题'
        });
      }
    }

    // 构建更新数据
    const updateData = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    if (embedCode !== undefined) updateData.embedCode = embedCode.trim();
    if (isActive !== undefined) updateData.isActive = isActive;
    if (viewCount !== undefined) updateData.viewCount = parseInt(viewCount);

    // 执行更新
    const updatedItem = await prisma.knowledgeBasePublish.update({
      where: { id },
      data: updateData
    });

    console.log('✅ 知识库更新成功:', id);

    res.json({
      success: true,
      data: updatedItem,
      message: '知识库更新成功'
    });

  } catch (error) {
    console.error('❌ 更新知识库错误:', error);

    let errorMessage = '更新知识库失败';

    if (error.code === 'P2025') {
      errorMessage = '知识库不存在';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 部分更新知识库（用于状态切换等）
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`📥 部分更新知识库: ${id}`, updateData);

    // 检查知识库是否存在
    const existing = await prisma.knowledgeBasePublish.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '知识库不存在'
      });
    }

    // 添加更新时间
    updateData.updatedAt = new Date();

    // 执行更新
    const updatedItem = await prisma.knowledgeBasePublish.update({
      where: { id },
      data: updateData
    });

    console.log('✅ 知识库部分更新成功:', id);

    res.json({
      success: true,
      data: updatedItem,
      message: '更新成功'
    });

  } catch (error) {
    console.error('❌ 部分更新知识库错误:', error);
    res.status(500).json({
      success: false,
      error: '更新失败: ' + error.message
    });
  }
});

// 删除知识库
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ 删除知识库: ${id}`);

    // 检查知识库是否存在
    const existing = await prisma.knowledgeBasePublish.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '知识库不存在'
      });
    }

    // 执行删除
    await prisma.knowledgeBasePublish.delete({
      where: { id }
    });

    console.log('✅ 知识库删除成功:', id);

    res.json({
      success: true,
      message: '知识库删除成功'
    });

  } catch (error) {
    console.error('❌ 删除知识库错误:', error);

    let errorMessage = '删除知识库失败';

    if (error.code === 'P2025') {
      errorMessage = '知识库不存在';
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// 批量操作
router.post('/batch', async (req, res) => {
  try {
    const { action, ids } = req.body;

    console.log(`🔄 批量操作: ${action}`, ids);

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的ID列表'
      });
    }

    let result;
    let message = '';

    switch (action) {
      case 'activate':
        result = await prisma.knowledgeBasePublish.updateMany({
          where: { id: { in: ids } },
          data: { isActive: true, updatedAt: new Date() }
        });
        message = `已启用 ${result.count} 个知识库`;
        break;

      case 'deactivate':
        result = await prisma.knowledgeBasePublish.updateMany({
          where: { id: { in: ids } },
          data: { isActive: false, updatedAt: new Date() }
        });
        message = `已禁用 ${result.count} 个知识库`;
        break;

      case 'delete':
        result = await prisma.knowledgeBasePublish.deleteMany({
          where: { id: { in: ids } }
        });
        message = `已删除 ${result.count} 个知识库`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: '不支持的操作类型'
        });
    }

    console.log(`✅ 批量操作成功: ${message}`);

    res.json({
      success: true,
      data: result,
      message
    });

  } catch (error) {
    console.error('❌ 批量操作错误:', error);
    res.status(500).json({
      success: false,
      error: '批量操作失败: ' + error.message
    });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  console.error('路由错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

module.exports = router;