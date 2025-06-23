'use strict';

const { Controller } = require('egg');

class TodoController extends Controller {
  // 1. 新增待办接口
  async add() {
    const { ctx } = this;
    const { title, content } = ctx.request.body; // 默认进度0
    const progress = ctx.request.body.progress || 0; // 接收进度参数
    if (!title) ctx.throw(400, '标题不能为空');
    const todoId = await ctx.service.todo.addTodo({ title, content, progress });
    ctx.body = { code: 200, data: { id: todoId, progress }, message: '待办创建成功' }; // 返回进度
  }

  // 2. 更新内容接口（标题和内容）
  async updateContent() {
    const { ctx } = this;
    const { id, title, content, progress } = ctx.request.body; // 接收进度参数
    if (!id || !title) ctx.throw(400, 'ID和标题不能为空');
    const affectedRows = await ctx.service.todo.updateTodoContent({ id, title, content, progress });
    const code = affectedRows > 0? 200 : 404;
    ctx.body = { code: code, message: affectedRows > 0 ? '内容及进度更新成功' : '未找到对应待办' };
  } // 更新提示语包含进度

  // 3. 更新状态接口
  async updateStatus() {
    const { ctx } = this;
    const { id, status } = ctx.request.body;
    if (!id || ![0, 1].includes(status)) ctx.throw(400, 'ID或状态参数错误');
    const affectedRows = await ctx.service.todo.updateTodoStatus({ id, status });
    const code = affectedRows > 0? 200 : 404;
    ctx.body = { code: code, message: affectedRows > 0 ? '状态更新成功' : '未找到对应待办' };
  }

  // 4. 分页查询所有待办接口
  async list() {
    const { ctx } = this;
    const { page = 1, pageSize = 10 } = ctx.query;
    const { list, total } = await ctx.service.todo.listTodos({ page: Number(page), pageSize: Number(pageSize) });
    ctx.body = { code: 200, data: { list, total, page: Number(page), pageSize: Number(pageSize) } };
  }

  // 5. 查询今日待办接口
  async listToday() {
    const { ctx } = this;
    const todayTodos = await ctx.service.todo.listTodayTodos();
    ctx.body = { code: 200, data: todayTodos };
  }

  // 7. 转发到第三方agent接口
  async forwardToAgent() {
    const { ctx } = this;
    const { text } = ctx.request.body;
    if (!text) ctx.throw(400, '输入文本不能为空');

    // 设置流式响应头
    ctx.res.setHeader('Content-Type', 'text/event-stream');
    ctx.res.setHeader('Cache-Control', 'no-cache');
    ctx.res.setHeader('Connection', 'keep-alive');

    // 获取服务层流式数据
    const stream = await ctx.service.todo.forwardTextToAgent(text);
    ctx.status = 200;
    console.log('开始推送数据流');
    for await (const chunk of stream) {
      const sseChunk = `data: ${JSON.stringify(chunk)}\n\n`; // SSE格式
      ctx.res.write(sseChunk);
    }
    console.log('数据流推送完成');
    ctx.res.end()
  }

  // 6. 删除接口
  async delete() {
    const { ctx } = this;
    const { id } = ctx.query;
    if (!id) ctx.throw(400, 'ID不能为空');
    const affectedRows = await ctx.service.todo.deleteTodo(id);
    const code = affectedRows > 0? 200 : 404;
    ctx.body = { code: code, message: affectedRows > 0 ? '待办删除成功' : '未找到对应待办' };
  }
}

module.exports = TodoController;
