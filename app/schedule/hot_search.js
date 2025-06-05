'use strict';

const Subscription = require('egg').Subscription;
const dayjs = require('dayjs');
const axios = require('axios');

class HotSearchSchedule extends Subscription {
  static get schedule() {
    return {
      interval: '20m', // 每20分钟执行一次查询
      type: 'worker', // 仅一个worker执行
      immediate: true, // 启动时立即执行
    };
  }

  async subscribe() {
    const { ctx, service } = this;
    // 计算上个整点时间（如当前10:25，上个整点是10:00；当前10:40，上个整点是10:00）
    // 修改后（年月日时格式）
    const lastHour = dayjs().format('YYYY-MM-DD HH:00:00'); // 输出如 '2024-05-20 10'

    const siteMap = {
      '微博': 'fetchWeiboHot',
      '百度': 'fetchBaiduHot',
      'B站': 'fetchBilibiliHot',
    };

    for (const site of Object.keys(siteMap)) {
      const count = await service.hotSearch.countBySite(lastHour, site);
      if (count === 0) {
        console.log(`检测到${lastHour}点${site}热搜数据缺失，开始爬取...`);
        // 用映射表找到对应的方法名
        const methodName = siteMap[site];
        if (typeof service.hotSearch[methodName] === 'function') {
          const data = await service.hotSearch[methodName]();
          for (const item of data) {
            await service.hotSearch.insert({
              ...item,
              update_time: lastHour, // lastHour 是你定时任务计算出来的时间
            });
          }
        }
      }
    }
  }
}

module.exports = HotSearchSchedule;
