'use strict';

const Controller = require('egg').Controller;
const dayjs = require('dayjs');

class HotSearchController extends Controller {
  async latest() {
    const { ctx, service } = this;
    // 获取当前整点时间
    let lastHour = dayjs().format('YYYY-MM-DD HH:00:00');
    let data = await service.hotSearch.getByUpdateTime(lastHour);
    let tryCount = 0;
    // 如果没有数据，往前推1小时，最多查24小时
    while ((!data || data.length === 0) && tryCount < 24) {
      lastHour = dayjs(lastHour).subtract(1, 'hour').format('YYYY-MM-DD HH:00:00');
      data = await service.hotSearch.getByUpdateTime(lastHour);
      tryCount++;
    }
    ctx.body = {
      code: 200,
      msg: 'success',
      data,
      time: lastHour,
    };
  }
}

module.exports = HotSearchController; 