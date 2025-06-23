'use strict';

const { Controller } = require('egg');
const path = require('path');
const fs = require('fs');

class BlogController extends Controller {
  // 私有方法：解析图片文件为cover_image路径
  async _parseCoverImage(file) {
    const { ctx } = this;
    if (!file) return null;
    const base64String = await fs.promises.readFile(file.filepath, 'utf8');
    const matches = base64String.match(/^data:image\/(\w+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '无效的图片格式' };
      return null;
    }
    const fileType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const uploadDir = this.config.multipart.uploadDir || path.join(this.config.baseDir, 'app/public/images');
    const fileName = `blog_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileType}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    return `/images/${fileName}`;
  }

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

    // 解析base64编码的图片
    let cover_image = '';

    cover_image = await this._parseCoverImage(file);

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

    ctx.status = 200;
    ctx.body = { code: 200, message: '博客发布成功', data: { blogId: result } };
    console.log(ctx.body, ctx.status);
  }
  // 获取博客概要列表
  async list() {
    const { ctx, service } = this;
    const blogList = await service.blog.list();
    // 为封面图片添加完整后端地址
    const formattedBlogList = blogList.map((blog) => ({
      ...blog,
      cover_image: `${ctx.origin}${blog.cover_image}`,
    }));
    ctx.body = { code: 200, message:'获取列表成功' ,data: formattedBlogList };
  }

  // 分页获取博客列表
  async page() {
    const { ctx, service } = this;
    
    // 获取分页参数
    const { page = 1, pageSize = 10 } = ctx.query;
    
    // 参数验证
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    
    if (isNaN(pageNum) || pageNum < 1) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '页码参数无效' });
    }
    
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '每页数量参数无效（范围1-100）' });
    }
    
    try {
      const result = await service.blog.page({ page: pageNum, pageSize: pageSizeNum });
      
      // 为封面图片添加完整后端地址
      const formattedList = result.list.map((blog) => ({
        ...blog,
        cover_image: `${ctx.origin}${blog.cover_image}`,
      }));
      
      ctx.body = {
        code: 200,
        message: '获取分页数据成功',
        data: {
          list: formattedList,
          current: result.pagination.current,
          pages: result.pagination.pages,
          total: result.pagination.total,
          pageSize: result.pagination.pageSize
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { code: 500, message: '获取分页数据失败' };
    }
  }

  // 更新博客
  async update() {
    const { ctx, service } = this;
    // 获取前端参数（id和更新内容）
    const files = ctx.request.files;
    const file = files && files.length > 0 ? files[0] : null;
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
    // 解析图片（如有）
    let cover_image = null;
    if (file) {
      cover_image = await this._parseCoverImage(file);
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
    // 为封面图片添加完整后端地址
    blog.cover_image = `${ctx.origin}${blog.cover_image}`;
    ctx.body = { code: 200, data: blog };
  }
}

module.exports = BlogController;
