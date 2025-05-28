const { Controller } = require('egg');

class NewsController extends Controller {
  async list() {
    const { ctx } = this;
    const page = ctx.query.page || 1;
    const newList = await ctx.service.news.list(page);
    await ctx.render('news/list.tpl', { list: newList });
  }
}

module.exports = NewsController;