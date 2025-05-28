'use strict';

const { Service } = require('egg');

class BlogService extends Service {
  // 创建博客（含事务处理）
  async add({ title, markdown_content, category, author, cover_image }) {
    const { app } = this;
    // 开启数据库事务
    const conn = await app.mysql.beginTransactionScope(async (conn) => {
      // 插入博客主表（create_time/update_time使用数据库默认值）
      const blogResult = await conn.insert('blog', {
        title,
        markdown_content,
        category,
        author
      });
      const blogId = blogResult.insertId;
      // 插入封面图到blog_image表
      await conn.insert('blog_image', {
        blog_id: blogId,
        image_path: cover_image,
        is_cover: 1
      });
      return blogId;
    }, this.ctx); // 自动提交或回滚
    return conn;
  }
  // 获取博客概要列表
  async list() {
    const { app } = this;
    // 查询博客列表并关联封面图
    const sql = `
      SELECT b.id, b.title, b.author, b.category, b.create_time, b.update_time, bi.image_data 
      FROM blog b
      LEFT JOIN blog_image bi ON b.id = bi.blog_id AND bi.is_cover = 1
      ORDER BY b.create_time DESC
    `;
    const result = await app.mysql.query(sql);
    return result;
  }

  // 更新博客（含更新时间）
  async update({ id, title, markdown_content, category, cover_image }) {
    const { app } = this;
    // 获取当前时间戳
    const update_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    // 开启事务（如需更新关联的封面图）
    const conn = await app.mysql.beginTransactionScope(async (conn) => {
      // 更新博客主表
      await conn.update('blog', {
        title,
        markdown_content,
        category,
        update_time
      }, { where: { id } });
      // 可选：更新封面图（如果前端传回新的cover_image）
      if (cover_image) {
        await conn.update('blog_image', {
          image_data: cover_image
        }, { where: { blog_id: id, is_cover: 1 } });
      }
      return id;
    }, this.ctx);
    return conn;
  }

  // 删除博客（含事务处理）
  async delete(blogId) {
    const { app } = this;
    // 开启数据库事务
    const conn = await app.mysql.beginTransactionScope(async (conn) => {
      // 删除博客主表
      await conn.delete('blog', { id: blogId });
      // 删除关联的图片
      await conn.delete('blog_image', { blog_id: blogId });
      return true;
    }, this.ctx);
    return conn;
  }

  // 获取博客详情
  async detail(id) {
    const { app } = this;
    // 查询博客详情并关联封面图
    const blogSql = 'SELECT * FROM blog WHERE id = ?';
    const [blog] = await app.mysql.query(blogSql, [id]);
    if (!blog) return null;
    // 查询封面图
    const imageSql = 'SELECT image_data FROM blog_image WHERE blog_id = ? AND is_cover = 1';
    const [coverImage] = await app.mysql.query(imageSql, [id]);
    return { ...blog, cover_image: coverImage?.image_data || null };
  }
}

module.exports = BlogService;