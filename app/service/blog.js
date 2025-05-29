'use strict';

const { Service } = require('egg');

class BlogService extends Service {
  // 创建博客（含事务处理）
  async add({ title, markdown_content, category, author, cover_image }) {
    const { app } = this;
    const blogResult = await app.mysql.insert('blog', {
      title,
      markdown_content,
      category,
      author,
      cover_image, // 新增封面路径字段
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

  // 更新博客（含更新时间）
  async update({ id, title, markdown_content, category, cover_image }) {
    const { app } = this;
    // 获取当前时间戳
    const update_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    // 开启事务（如需更新关联的封面图）
    const conn = await app.mysql.beginTransactionScope(async (conn) => {
      // 更新博客主表
      await conn.update(
        'blog',
        {
          title,
          markdown_content,
          category,
          update_time,
          cover_image,
        },
        { where: { id } }
      );
      return id;
    }, this.ctx);
    return conn;
  }

  // 删除博客（含事务处理）
  async delete(id) {
    const { app } = this;
    const user = await service.user.getUserById(id);
    if (!user || !user.is_admin) {
      ctx.status = 403;
      return (ctx.body = { code: 403, message: '无权限操作' });
    }
    const blgSql = 'SELECT * FROM blog WHERE id =?';
    const [blog] = await app.mysql.query(blgSql, [id]);
    if (!blog) return null;
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
