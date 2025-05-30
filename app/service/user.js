'use strict';

const Service = require('egg').Service;

class UserService extends Service {
  // 根据用户ID查询用户信息
  async getUserById(userId) {
    const { app } = this;
    const [user] = await app.mysql.query('SELECT * FROM users WHERE id = ?', [userId]);
    return user;
  }
  // 根据用户名查询用户
  async findUserByUsername(username) {
    const { app } = this;
    return await app.mysql.get('users', { username });
  }

  // 创建新用户
  async createUser(userInfo) {
    const { app, ctx } = this;
    // 补充创建时间和更新时间
    const currentTime = ctx.helper.formatTime(new Date());
    const newUserInfo = {
      ...userInfo,
      create_time: currentTime,
      update_time: currentTime
    };
    const result = await app.mysql.insert('users', newUserInfo);
    return result;
  }

  // 更新用户密码
  async updateUserPassword(userId, newPassword) {
    const { app, ctx } = this;
    // 更新时设置最新更新时间
    const currentTime = ctx.helper.formatTime(new Date());
    const result = await app.mysql.update('users', {
      id: userId,
      password: newPassword,
      update_time: currentTime
    });
    return result;
  }

    // 判断是否有管理员权限
    async hasAdminPermission() {
      const userId = this.ctx.state.user.id;
      const user = await this.getUserById(userId);
      return user?.is_admin || false;
    }
}

module.exports = UserService;