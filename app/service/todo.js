'use strict';

const { Service } = require('egg');
const { CozeAPI, COZE_CN_BASE_URL } = require('@coze/api');

class TodoService extends Service {
  // 新增待办
  async addTodo({ title, content, progress }) {
    const { app, ctx } = this;
    const user_id = ctx.state.user.id;
    let status = 0;
    if ( progress == 100 ) status = 1;
    const result = await app.mysql.insert('todo', { title, content, progress, user_id, status });
    return result.insertId;
  }

  // 更新内容（标题和内容）
  async updateTodoContent({ id, title, content, progress }) {
    const { app, ctx } = this;
    const user_id = ctx.state.user.id;
    const result = await app.mysql.update('todo', { title, content, progress }, { where: { id, user_id } });
    return result.affectedRows;
  }

  // 更新状态
  async updateTodoStatus({ id, status }) {
    const { app, ctx } = this;
    const user_id = ctx.state.user.id;
    const updateData = { status };
    updateData.progress = status === 1 ? 100 : 0;
    const result = await app.mysql.update('todo', updateData, { where: { id, user_id } });
    return result.affectedRows;
  }

  // 分页查询所有待办（倒序）
  async listTodos({ page, pageSize }) {
    const { app, ctx } = this;
    const user_id = ctx.state.user.id;
    const offset = (page - 1) * pageSize;
    const [todos, total] = await Promise.all([
      app.mysql.select('todo', { where: { user_id }, order: [['create_time', 'DESC']], limit: pageSize, offset }),
      app.mysql.count('todo', { user_id }),
    ]);
    return { list: todos, total };
  }

  // 查询今日待办（今天更新或未完成的历史待办）
  async listTodayTodos() {
    const { app, ctx } = this;
    const user_id = ctx.state.user.id;
    const today = new Date().toISOString().split('T')[0];
    return await app.mysql.query(
      'SELECT * FROM todo WHERE user_id = ? AND (DATE(update_time) = ? OR (status = 0 AND DATE(create_time) < ?))',
      [user_id, today, today]
    );
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
    // 在sql中增加user_id
    

    // 2. 获取当前用户id
    const user_id = ctx.state.user.id;

    // 3. 检查SQL是否有WHERE
    if (/where/i.test(sql)) {
      // 在第一个WHERE后加 AND user_id = ?
      sql = sql.replace(/where/i, match => `${match} user_id = ? AND (`);
      // 末尾多了一个 (，需要在最后一个 ) 前加一个 )
      const lastParen = sql.lastIndexOf(')');
      if (lastParen !== -1) {
        sql = sql.slice(0, lastParen + 1) + ')' + sql.slice(lastParen + 1);
      }
    } else {
      // 没有WHERE，直接加
      sql += ' WHERE user_id = ?';
    }

    // 4. 执行SQL时传入user_id参数
    const queryResult = await app.mysql.query(sql, [user_id]);
    // console.log('queryResult', queryResult);

    // 5. 调用第二个接口发送查询结果
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
    const { app, ctx } = this;
    const user_id = ctx.state.user.id;
    const result = await app.mysql.delete('todo', { id, user_id });
    return result.affectedRows;
  }
}

module.exports = TodoService;
