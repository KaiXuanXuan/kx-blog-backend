'use strict';

const { Controller } = require('egg');

class TodoController extends Controller {
  // 1. 新增待办接口
  async add() {
    const { ctx } = this;
    const { title, content, progress = 0 } = ctx.request.body; // 默认进度0
    if (!title) ctx.throw(400, '标题不能为空');
    const todoId = await ctx.service.todo.addTodo({ title, content });
    ctx.body = { success: true, data: { id: todoId, progress }, message: '待办创建成功' }; // 返回进度
  }

  // 2. 更新内容接口（标题和内容）
  async updateContent() {
    const { ctx } = this;
    const { id, title, content, progress } = ctx.request.body; // 接收进度参数
    if (!id || !title) ctx.throw(400, 'ID和标题不能为空');
    const affectedRows = await ctx.service.todo.updateTodoContent({ id, title, content });
    ctx.body = { success: affectedRows > 0, message: affectedRows > 0 ? '内容及进度更新成功' : '未找到对应待办' };
  } // 更新提示语包含进度

  // 3. 更新状态接口
  async updateStatus() {
    const { ctx } = this;
    const { id, status } = ctx.request.body;
    if (!id || ![0, 1].includes(status)) ctx.throw(400, 'ID或状态参数错误');
    const affectedRows = await ctx.service.todo.updateTodoStatus({ id, status });
    ctx.body = { success: affectedRows > 0, message: affectedRows > 0 ? '状态更新成功' : '未找到对应待办' };
  }

  // 4. 分页查询所有待办接口
  async list() {
    const { ctx } = this;
    const { page = 1, pageSize = 10 } = ctx.query;
    const { list, total } = await ctx.service.todo.listTodos({ page: Number(page), pageSize: Number(pageSize) });
    ctx.body = { success: true, data: { list, total, page: Number(page), pageSize: Number(pageSize) } };
  }

  // 5. 查询今日待办接口
  async listToday() {
    const { ctx } = this;
    const todayTodos = await ctx.service.todo.listTodayTodos();
    ctx.body = { success: true, data: todayTodos };
  }

  // 6. 删除接口
  async delete() {
    const { ctx } = this;
    const { id } = ctx.params;
    if (!id) ctx.throw(400, 'ID不能为空');
    const affectedRows = await ctx.service.todo.deleteTodo(id);
    ctx.body = { success: affectedRows > 0, message: affectedRows > 0 ? '待办删除成功' : '未找到对应待办' };
  }
}

module.exports = TodoController;