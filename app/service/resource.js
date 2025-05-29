'use strict';

const { Service } = require('egg');

class ResourceService extends Service {
  // 添加资源分类
  async addCategory({ title }) {
    const { app } = this;
    const result = await app.mysql.insert('resource_category', { title });
    return result.insertId;
  }

  // 获取资源分类列表
  async listCategories() {
    const { app } = this;
    return await app.mysql.select('resource_category');
  }

  // 添加资源条目
  async addItem({ category_id, title, icon, item_desc, item_url }) {
    const { app } = this;
    const result = await app.mysql.insert('resource_item', { category_id, title, icon, item_desc, item_url });
    return result.insertId;
  }

  // 更新资源分类
  async updateCategory({ id, title }) {
    const { app } = this;
    const result = await app.mysql.update('resource_category', { title }, { where: { id } });
    return result.affectedRows;
  }

  // 删除资源分类（级联删除条目）
  async deleteCategory(id) {
    const { app } = this;
    const conn = await app.mysql.beginTransactionScope(async (conn) => {
      await conn.delete('resource_item', { category_id: id });
      await conn.delete('resource_category', { id });
      return true;
    }, this.ctx);
    return conn;
  }

  // 更新资源条目
  async updateItem({ id, title, icon, item_desc, item_url }) {
    const { app } = this;
    const result = await app.mysql.update('resource_item', { title, icon, item_desc, item_url }, { where: { id } });
    return result.affectedRows;
  }

  // 删除资源条目
  async deleteItem(id) {
    const { app } = this;
    const result = await app.mysql.delete('resource_item', { id });
    return result.affectedRows;
  }

  // 按分类获取资源条目
  async listItemsByCategory(category_id) {
    const { app } = this;
    return await app.mysql.select('resource_item', { where: { category_id } });
  }

  // 模糊搜索（分类标题/条目标题/条目描述）
  async search(keyword) {
    const { app } = this;
    const [categories, items] = await Promise.all([
      // 搜索分类标题含有关键词的记录
      app.mysql.query(
        'SELECT id, title FROM resource_category WHERE title LIKE ?',
        [`%${keyword}%`]
      ),
      // 搜索条目标题或描述含有关键词的记录
      app.mysql.query(
        `SELECT i.id, i.title, i.item_desc, i.category_id, c.title AS category_title 
         FROM resource_item i
         LEFT JOIN resource_category c ON i.category_id = c.id
         WHERE i.title LIKE ? OR i.item_desc LIKE ?`,
        [`%${keyword}%`, `%${keyword}%`]
      )
    ]);

    // 处理分类匹配结果（补充关联条目）
    const categoryResults = await Promise.all(
      categories.map(async category => {
        const items = await app.mysql.select('resource_item', { where: { category_id: category.id } });
        return { ...category, type: 'category', items };
      })
    );

    // 处理条目匹配结果（标记类型）
    const itemResults = items.map(item => ({ ...item, type: 'item' }));

    // 合并并返回结果
    return [...categoryResults, ...itemResults];
  }
}

module.exports = ResourceService;