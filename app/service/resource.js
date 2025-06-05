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
    const { app, ctx } = this;
    return await app.mysql.select('resource_item', { where: { category_id } });
  }

  // 模糊搜索（返回分类包含条目的树形结构）
  async search(keyword) {
    const { app } = this;

    // 1. 获取所有需要返回的分类ID（分类标题匹配 或 其下任意条目标题/描述匹配）
    const categoryIdsResult = await app.mysql.query(
      `
      SELECT DISTINCT c.id 
      FROM resource_category c
      LEFT JOIN resource_item i ON c.id = i.category_id
      WHERE c.title LIKE ? OR i.title LIKE ? OR i.item_desc LIKE ?
    `,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );

    if (categoryIdsResult.length === 0) return [];

    const categoryIds = categoryIdsResult.map((row) => row.id);

    // 2. 一次性查询所有匹配分类及其完整条目（避免N+1查询）
    const categoriesWithItems = await app.mysql.query(
      `
      SELECT c.id AS category_id, c.title AS category_title, 
             i.id AS item_id, i.title AS item_title, i.item_desc, i.icon, i.item_url
      FROM resource_category c
      LEFT JOIN resource_item i ON c.id = i.category_id
      WHERE c.id IN (?)
    `,
      [categoryIds]
    );

    // 3. 构建树形结构（分类 -> 条目数组）
    const treeMap = new Map();
    categoriesWithItems.forEach((row) => {
      // 初始化分类对象（仅首次出现时）
      if (!treeMap.has(row.category_id)) {
        treeMap.set(row.category_id, {
          id: row.category_id,
          title: row.category_title,
          items: [],
        });
      }

      // 添加条目（排除无条目的情况）
      if (row.item_id) {
        treeMap.get(row.category_id).items.push({
          id: row.item_id,
          title: row.item_title,
          item_desc: row.item_desc,
          item_url: row.item_url,
          icon: `${this.ctx.origin}${row.icon}`,
        });
      }
    });

    // 转换Map为数组返回
    return Array.from(treeMap.values());
  }

  async getItemById(id) {
    const { app } = this;
    return await app.mysql.get('resource_item', { id });
  }
}

module.exports = ResourceService;
