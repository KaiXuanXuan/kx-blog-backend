'use strict';

const { Service } = require('egg');
const path = require('path');
const fs = require('fs');

class BlogService extends Service {
  // 创建博客（含事务处理）
  async add({ title, markdown_content, category, author, cover_image }) {
    const { app } = this;
    const blogResult = await app.mysql.insert('blog', {
      title,
      markdown_content,
      category,
      author,
      cover_image,
    });
    return blogResult.insertId;
  }
  // 获取博客概要列表
  async list() {
    const { app } = this;
    // 查询博客列表
    const sql = `
    SELECT id, title, author, category, create_time, update_time, cover_image
    FROM blog
    ORDER BY create_time DESC
  `;
    const result = await app.mysql.query(sql);
    return result;
  }

  // 分页获取博客列表
  async page({ page = 1, pageSize = 10 } = {}) {
    const { app } = this;
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 查询总数量
    const countSql = 'SELECT COUNT(*) as total FROM blog';
    const [{ total }] = await app.mysql.query(countSql);
    
    // 查询当前页数据
    const dataSql = `
      SELECT id, title, author, category, create_time, update_time, cover_image
      FROM blog
      ORDER BY create_time DESC
      LIMIT ? OFFSET ?
    `;
    const result = await app.mysql.query(dataSql, [pageSize, offset]);
    
    // 计算总页数
    const pages = Math.ceil(total / pageSize);
    
    return {
      list: result,
      pagination: {
        current: page,
        pages,
        total,
        pageSize
      }
    };
  }

  // 更新博客（含更新时间）
  async update({ id, title, markdown_content, category, cover_image }) {
    const { app } = this;
    // 获取当前时间戳
    const update_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    // 构建更新字段
    const updateFields = {
      title,
      markdown_content,
      category,
      update_time,
    };
    if (cover_image) {
      updateFields.cover_image = cover_image;
    }
    // 开启事务（如需更新关联的封面图）
    const conn = await app.mysql.beginTransactionScope(async (conn) => {
      // 更新博客主表
      await conn.update(
        'blog',
        updateFields,
        { where: { id } }
      );
      return id;
    }, this.ctx);
    return conn;
  }

  // 删除博客（含事务处理）
  async delete(id) {
    const { app } = this;
    // 查询博客详情，获取cover_image
    const blgSql = 'SELECT * FROM blog WHERE id =?';
    const [blog] = await app.mysql.query(blgSql, [id]);
    if (!blog) return null;
    // 删除封面图片文件（如有）
    if (blog.cover_image && blog.cover_image.startsWith('/images/')) {
      const uploadDir = app.config.multipart.uploadDir || path.join(app.baseDir, 'app/public/images');
      const filePath = path.join(uploadDir, path.basename(blog.cover_image));
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
        } catch (e) {
          // 可以选择记录日志，但不影响主流程
          app.logger.warn('删除博客封面图片失败:', e);
        }
      }
    }
    // 执行删除操作
    const result = await app.mysql.delete('blog', { id });
    return result;
  }

  // 获取博客详情
  async detail(id) {
    const { app } = this;
    // 查询博客详情并关联封面图
    const blogSql = 'SELECT * FROM blog WHERE id = ?';
    const [blog] = await app.mysql.query(blogSql, [id]);
    if (!blog) return null;
    return blog;
  }
}

module.exports = BlogService;
