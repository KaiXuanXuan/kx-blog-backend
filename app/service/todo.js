'use strict';

const { Service } = require('egg');

class TodoService extends Service {
  // 新增待办
  async addTodo({ title, content, progress }) {
    const { app } = this;
    const result = await app.mysql.insert('todo', { title, content, progress });
    return result.insertId;
  }

  // 更新内容（标题和内容）
  async updateTodoContent({ id, title, content, progress }) {
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
      app.mysql.select('todo', { order: [[ 'create_time', 'DESC' ]], limit: pageSize, offset }),
      app.mysql.count('todo')
    ]);
    return { list: todos, total };
  }

  // 查询今日待办（今天创建或未完成的历史待办）
  async listTodayTodos() {
    const { app } = this;
    const today = new Date().toISOString().split('T')[0];
    return await app.mysql.query(
      'SELECT * FROM todo WHERE DATE(create_time) = ? OR (status = 0 AND DATE(create_time) < ?)',
      [today, today]
    );
  }

  // 转发文本到第三方agent
  async forwardTextToAgent(text) {
    const { app } = this;
    // 1. 调用第一个接口获取SQL查询语句
    const firstAgentUrl = app.config.thirdPartyAgentUrl;
    const sqlResponse = await app.curl(firstAgentUrl, {
      method: 'POST',
      data: { text },
      dataType: 'json',
      contentType: 'json'
    });
    if (sqlResponse.status !== 200) throw new Error('第一次第三方agent请求失败');
    const sql = sqlResponse.data.sql;

    // 2. 执行SQL查询数据库
    const queryResult = await app.mysql.query(sql);

    // 3. 调用第二个接口发送查询结果
    const secondAgentUrl = app.config.thirdPartyAgentResultUrl;
    const resultResponse = await app.curl(secondAgentUrl, {
      method: 'POST',
      data: { result: queryResult },
      dataType: 'json',
      contentType: 'json'
    });
    if (resultResponse.status !== 200) throw new Error('第二次第三方agent请求失败');

    return resultResponse.data;
  }

  // 删除待办
  async deleteTodo(id) {
    const { app } = this;
    const result = await app.mysql.delete('todo', { id });
    return result.affectedRows;
  }
}

module.exports = TodoService;