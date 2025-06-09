class VtbController extends require('egg').Controller {
  async info() {
    const { ctx, service } = this;
    try {
      const data = await service.vtb.info();
      ctx.body = { code: 0, data };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { code: 1, msg: '获取数据失败', error: err.message };
    }
  }
}

module.exports = VtbController; 