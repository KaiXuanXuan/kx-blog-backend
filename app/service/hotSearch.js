'use strict';

const { Service } = require('egg');
const axios = require('axios');
const cheerio = require('cheerio');

class HotSearchService extends Service {
  // 插入热搜数据
  async insert(data) {
    const { mysql } = this.ctx.app;
    const result = await mysql.query('INSERT INTO hot_search (site, title, url, rank, heat, update_time) VALUES (?, ?, ?, ?, ?, ?)', [
      data.site,
      data.title,
      data.url,
      data.rank,
      data.heat,
      data.update_time,
    ]);
    return result;
  }
  // 根据更新时间查询数据
  async getByUpdateTime(updateTime) {
    const { mysql } = this.ctx.app;
    const [rows] = await mysql.query('SELECT * FROM hot_search WHERE update_time = ?', [updateTime]);
    return rows;
  }
  // 统计符合条件的数据数量
  async count(updateTime) {
    const { mysql } = this.ctx.app;
    const [result] = await mysql.query('SELECT COUNT(*) AS count FROM hot_search WHERE DATE_FORMAT(update_time, "%Y-%m-%d %H") = ?', [updateTime]);
    return result.length > 0 ? result[0].count : 0;
  }
  async fetchWeiboHot() {
    const { config } = this;
    const res = await axios.get('https://s.weibo.com/top/summary', {
      headers: { 'User-Agent': config.userAgent },
    });
    const $ = cheerio.load(res.data);
    const hotList = [];
    const weiboURL = 'https://s.weibo.com';
    $('#pl_top_realtimehot table tbody tr').each(function (rank) {
      if (rank !== 0) {
        const $td = $(this).children().eq(1);
        const url = weiboURL + $td.find('a').attr('href');
        const title = $td.find('a').text();
        const heat = $td.find('span').text();
        hotList.push({
          rank,
          url,
          title,
          heat,
        });
      }
    });
    return hotList.slice(0, 20);
  }

  async fetchJuejinHot() {
    const res = await axios.get('https://juejin.cn/hot', {
      headers: { 'User-Agent': this.config.userAgent },
    });
    const $ = cheerio.load(res.data);

    const hotList = [];
    const juejinURL = 'https://juejin.cn';

    $('main .hot-list-body .hot-list-wrap .host-list a').each(function (rank) {
      const url = juejinURL + $(this).attr('href');
      const title = $(this).find('.article-item-wrap .article-item-left .article-detail article-title').text().trim();
      const heat = $(this).find('.article-right .article-hot .hot-number').text().trim();
      hotList.push({
        rank,
        url,
        title,
        heat,
      });
    });
    return hotList.slice(0, 20);
  }

}

module.exports = HotSearchService;
