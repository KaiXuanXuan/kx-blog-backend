'use strict';

const { Service } = require('egg');
const { CozeAPI, COZE_CN_BASE_URL } = require('@coze/api');

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
    const [todos, total] = await Promise.all([app.mysql.select('todo', { order: [['create_time', 'DESC']], limit: pageSize, offset }), app.mysql.count('todo')]);
    return { list: todos, total };
  }

  // 查询今日待办（今天创建或未完成的历史待办）
  async listTodayTodos() {
    const { app } = this;
    const today = new Date().toISOString().split('T')[0];
    return await app.mysql.query('SELECT * FROM todo WHERE DATE(create_time) = ? OR (status = 0 AND DATE(create_time) < ?)', [today, today]);
  }

  // 转发文本到第三方agent
  async forwardTextToAgent(text) {
    const { app, ctx } = this;
    const userId = ctx.state.user.id;

    // 1. 调用第一个接口获取SQL查询语句
    const client = new CozeAPI({
      token: 'pat_gnvmwd14tgvHRwlSg688b9W6esrkQP3CfeANCD3Hjm1QVOAc5egMZU0go3dujqJi',
      baseURL: COZE_CN_BASE_URL,
    });

    const sqlAgentId = '7510471460104699942';
    const reportAgentId = '7510470052987732005';

    const sqlResponse = await client.chat.createAndPoll({
      bot_id: sqlAgentId,
      // user_id:'1',
      additional_messages: [
        {
          role: 'user',
          content: text,
          content_type: 'text',
          type: 'question',
        },
      ],
    });
    let sql = sqlResponse.messages[0].content;
    // 清理Markdown代码块标记
    sql = sql.replace(/^```sql\n/, '').replace(/\n```$/, '');
    console.log('清理后SQL:', sql);

    // 2. 执行SQL查询数据库
    const queryResult = await app.mysql.query(sql);
    // console.log('queryResult', queryResult);

    // 3. 调用第二个接口发送查询结果
    const stream = await client.chat.stream({
      bot_id: reportAgentId,
      // user_id: userId,
      additional_messages: [
        {
          role: 'user',
          content: `以下是查询结果：${JSON.stringify(queryResult)}`,
          content_type: 'text',
          type: 'question',
        },
      ],
    });

    return stream;
  }

  // 删除待办
  async deleteTodo(id) {
    const { app } = this;
    const result = await app.mysql.delete('todo', { id });
    return result.affectedRows;
  }
}

module.exports = TodoService;
