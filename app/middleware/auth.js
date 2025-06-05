'use strict';
module.exports = (options, app) => {
  return async (ctx, next) => {
    const authHeader = ctx.get('Authorization'); // 获取完整 Authorization 头
    if (!authHeader) {
      ctx.status = 401;
      return (ctx.body = { code: 401, message: '请先登录', csrfToken: ctx.csrf, });
    }

    // 分割 Bearer 和 Token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      ctx.status = 401;
      return (ctx.body = { code: 401, message: 'Token 格式错误，应为 Bearer token' });
    }

    const token = parts[1]; // 提取真正的 Token

    try {
      // 验证 Token 有效性
      const decoded = app.jwt.verify(token, app.config.jwt.secret);
      ctx.state.user = decoded; // 将用户信息挂载到 ctx.state
    } catch (err) {
      ctx.status = 401;
      return ctx.body = { code: 401, message: '无效的 Token 或已过期 ' + err };
    }
    await next();
  };
};
