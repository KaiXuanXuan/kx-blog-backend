'use strict';

const { Controller } = require('egg');
const bcrypt = require('bcryptjs');

class UserController extends Controller {
  // 注册接口
  async register() {
    const { ctx, service, app } = this;
    const { username, password } = ctx.request.body;
    // 参数校验
    if (!username || !password) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '用户名和密码必填' });
    }
    // 检查用户是否已存在
    const existingUser = await service.user.findUserByUsername(username);
    if (existingUser) {
      ctx.status = 409;
      return (ctx.body = { code: 409, message: '用户已存在' });
    }
    // 密码哈希
    const hashedPassword = await bcrypt.hash(password, 10);
    // 创建用户
    const newUser = await service.user.createUser({ username, password: hashedPassword });
    // 查询新用户完整信息（确保获取到ID）
    const user = await service.user.findUserByUsername(username);
    // 生成Token
    const token = app.jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      app.config.jwt.secret,
      { expiresIn: app.config.jwt.expiresIn }
    );
    ctx.body = {
      code: 200,
      message: '注册成功，已自动登录',
      data: {
        id: user.id,
        username: user.username,
        token, // 返回Token供前端自动登录
      },
    };
  }

  // 登录接口
  async login() {
    const { ctx, service, app } = this;
    const { username, password } = ctx.request.body;
    // 参数校验
    if (!username || !password) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '用户名和密码必填' });
    }
    // 查询用户
    const user = await service.user.findUserByUsername(username);
    if (!user) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '用户不存在' });
    }
    // 校验密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      ctx.status = 401;
      return (ctx.body = { code: 401, message: '密码错误' });
    }
    // 校验密码成功后生成 Token
    const token = app.jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      app.config.jwt.secret,
      { expiresIn: app.config.jwt.expiresIn }
    );
    ctx.body = {
      code: 200,
      message: '登录成功',
      data: {
        id: user.id,
        username: user.username,
        token, // 返回 Token
      },
    };
  }

  // 修改密码接口
  async updatePassword() {
    const { ctx, service } = this;
    const { username, oldPassword, newPassword } = ctx.request.body;
    // 参数校验
    if (!username || !oldPassword || !newPassword) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '用户名、旧密码和新密码必填' });
    }
    // 检查新旧密码是否相同
    if (oldPassword === newPassword) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '新密码不能与旧密码相同' });
    }
    // 查询用户
    const user = await service.user.findUserByUsername(username);
    if (!user) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '用户不存在' });
    }
    // 校验旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      ctx.status = 401;
      return (ctx.body = { code: 401, message: '旧密码错误' });
    }
    // 哈希新密码并更新
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await service.user.updateUserPassword(user.id, hashedNewPassword);
    ctx.body = { code: 200, message: '密码修改成功' };
  }
}

module.exports = UserController;
