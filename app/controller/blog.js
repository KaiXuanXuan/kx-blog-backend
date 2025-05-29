'use strict';

const { Controller } = require('egg');
const path = require('path');

class BlogController extends Controller {
  // 创建博客
  async add() {
    const { ctx, service } = this;
    // 复用中间件解析的用户信息
    const { username } = ctx.state.user;
    if (!username) {
      ctx.status = 401;
      return (ctx.body = { code: 401, message: '无效的用户信息' });
    }
    // 使用egg-multipart插件处理上传文件
    const files = ctx.request.files;
    if (!files || files.length === 0) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '文件上传失败' });
    }
    const file = files[0];
    // 利用插件配置获取上传目录（已通过egg-multipart配置自动创建）
    const uploadDir = this.config.multipart.uploadDir || path.join(this.config.baseDir, 'app/public/images');
    // 生成唯一文件名（时间戳+原文件名）
    const fileName = `blog_${Date.now()}_${path.basename(file.filename)}`;
    const targetPath = path.join(uploadDir, fileName);
    // 使用插件推荐的文件移动方法（兼容不同存储引擎）
    await ctx.helper.moveFile(file.filepath, targetPath);
    // 数据库存储相对路径（public/images/文件名）
    const cover_image = `/images/${fileName}`;
    // 从FormData中获取JSON数据字段
    const dataStr = ctx.request.body.data;
    if (!dataStr) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '缺少data字段' });
    }
    let title, markdown_content, category;
    try {
      const data = JSON.parse(dataStr);
      ({ title, markdown_content, category } = data);
      // 参数校验
      if (!title || !markdown_content || !category) {
        ctx.status = 400;
        return (ctx.body = { code: 400, message: '标题、内容、分类为必填参数' });
      }
    } catch (err) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: 'data字段格式错误' });
    }
    // 调用服务层创建    
    const result = await service.blog.add({
      title,
      markdown_content,
      category,
      author: username,
      cover_image,
    });
    ctx.body = { code: 200, message: '博客发布成功', data: { blogId: result } };
    console.log(ctx.body);
  }
  // 获取博客概要列表
  async list() {
    const { ctx, service } = this;
    const blogList = await service.blog.list();
    console.log(blogList);
    ctx.body = { code: 200, data: blogList };
  }

  // 更新博客
  async update() {
    const { ctx, service } = this;
    // 获取前端参数（id和更新内容）
    const cover_image = ctx.request.files[0];
    const data = JSON.parse(ctx.request.body.data);
    const { id, title, markdown_content, category } = data;
    // 参数校验
    if (!id || !title || !markdown_content || !category) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: 'id、标题、内容、分类为必填参数' });
    }
    // 获取当前用户username（来自JWT解析结果）
    const { username } = ctx.state.user;
    if (!username) {
      ctx.status = 401;
      return (ctx.body = { code: 401, message: '无效的用户信息' });
    }
    // 获取博客详情以验证作者
    const blog = await service.blog.detail(id);
    if (!blog) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '博客不存在' });
    }
    // 验证是否为作者
    if (blog.author !== username) {
      ctx.status = 403;
      return (ctx.body = { code: 403, message: '无权限修改，仅作者可操作' });
    }
    // 调用服务层更新
    const result = await service.blog.update({ id, title, markdown_content, category, cover_image });
    if (!result) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '博客不存在' });
    }
    ctx.body = { code: 200, message: '文章更新成功' };
  }

  // 删除博客
  async delete() {
    const { ctx, service } = this;
    // 从数据库查询用户最新权限
    const { id: userId } = ctx.state.user;
    if (!userId) {
      ctx.status = 401;
      return (ctx.body = { code: 401, message: '无效的用户信息' });
    }
    const user = await service.user.getUserById(userId);
    if (!user || !user.is_admin) {
      ctx.status = 403;
      return (ctx.body = { code: 403, message: '无权限，仅管理员可删除' });
    }
    // 获取博客id参数
    const { id } = ctx.request.body;
    if (!id) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '缺少博客id参数' });
    }
    // 调用服务层删除
    const result = await service.blog.delete(id);
    if (!result) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '博客不存在' });
    }
    ctx.body = { code: 200, message: '博客删除成功' };
  }

  // 获取博客详情
  async detail() {
    const { ctx, service } = this;
    const { id } = ctx.query;
    if (!id) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '缺少id参数' });
    }
    const blog = await service.blog.detail(id);
    if (!blog) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '博客不存在' });
    }
    ctx.body = { code: 200, data: blog };
  }
}

module.exports = BlogController;
