const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = {
      code: 200,
      message: '欢迎回来~',
      csrfToken: ctx.csrf,
    };
  }
}

module.exports = HomeController;
