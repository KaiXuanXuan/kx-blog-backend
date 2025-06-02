'use strict';

const Subscription = require('egg').Subscription;
const dayjs = require('dayjs');

class HotSearchSchedule extends Subscription {
  static get schedule() {
    return {
      interval: '30m', // 每30分钟执行
      type: 'worker', // 仅一个worker执行
      immediate: true, // 启动时立即执行
    };
  }

  async subscribe() {
    const { ctx, service } = this;
    // 计算上个整点时间（如当前10:25，上个整点是10:00；当前10:40，上个整点是10:00）
    // 修改后（年月日时格式）
    const lastHour = dayjs().format('YYYY-MM-DD HH'); // 输出如 '2024-05-20 10'
    // 查询是否已有该时间点数据
    const exists = await service.hotSearch.count(lastHour);
    if (!exists) {
      ctx.logger.info(`检测到${lastHour}热搜数据缺失，开始爬取...`);
      // 调用爬虫服务
      const weiboData = await service.hotSearch.fetchWeiboHot();
      console.log('weiboData',weiboData);

      const juejinData = await service.hotSearch.fetchJuejinHot();
      console.log('juejinData',juejinData);
      
      // 合并数据并插入数据库
      const allData = [...weiboData, ...juejinData].map((item) => ({
        ...item,
        update_time: lastHour,
      }));
      for (const data of allData) {
        await service.hotSearch.insert(data);
      }
      ctx.logger.info(`成功插入${allData.length}条热搜数据`);
    }
  }
}

module.exports = HotSearchSchedule;
