'use strict';

const { Service } = require('egg');

class TodoService extends Service {
  // 新增待办
  async addTodo({ title, content }) {
    const { app } = this;
    const result = await app.mysql.insert('todo', { title, content, progress: progress || 0 });
    return result.insertId;
  }

  // 更新内容（标题和内容）
  async updateTodoContent({ id, title, content }) {
    const { app } = this;
    const result = await app.mysql.update('todo', { title, content, progress }, { where: { id } });
    return result.affectedRows;
  }

  // 更新状态
  async updateTodoStatus({ id, status }) {
    const { app } = this;
    // 状态为1（已完成）时自动设置进度为100
    const updateData = { status };
    if (status === 1) {
      updateData.progress = 100;
    } else {
      updateData.progress = 0;
    }
    const result = await app.mysql.update('todo', updateData, { where: { id } });
    return result.affectedRows;
  }

  // 分页查询所有待办（倒序）
  async listTodos({ page, pageSize }) {
    const { app } = this;
    const offset = (page - 1) * pageSize;
    const [todos, total] = await Promise.all([
      app.mysql.select('todo', { order: [[ 'created_at', 'DESC' ]], limit: pageSize, offset }),
      app.mysql.count('todo')
    ]);
    return { list: todos, total };
  }

  // 查询今日待办（今天创建或未完成的历史待办）
  async listTodayTodos() {
    const { app } = this;
    const today = new Date().toISOString().split('T')[0];
    return await app.mysql.query(
      'SELECT * FROM todo WHERE DATE(created_at) = ? OR (status = 0 AND DATE(created_at) < ?)',
      [today, today]
    );
  }

  // 删除待办
  async deleteTodo(id) {
    const { app } = this;
    const result = await app.mysql.delete('todo', { id });
    return result.affectedRows;
  }
}

module.exports = TodoService;