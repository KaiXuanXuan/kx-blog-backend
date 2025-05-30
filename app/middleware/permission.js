// 权限校验中间件
module.exports = (options, app) => {
  return async (ctx, next) => {
    console.log('进来了');

    // 从请求中获取用户ID（假设通过JWT存储在 ctx.state.user）
    const userId = ctx.state.user?.id;
    if (!userId) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '未登录' };
      return;
    }
    // 调用 Service 校验是否为管理员（复用之前的逻辑）
    const hasAdminPermission = await ctx.service.user.hasAdminPermission();
    if (!hasAdminPermission) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '无权限操作' };
      return;
    }
    // 权限通过，继续执行后续逻辑
    await next();
  };
};
