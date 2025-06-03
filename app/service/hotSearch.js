'use strict';

const { Service } = require('egg');
const axios = require('axios');
const cheerio = require('cheerio');
const { config } = require('process');

class HotSearchService extends Service {
  // 插入热搜数据，避免唯一索引冲突
  async insert(data) {
    const { mysql } = this.ctx.app;
    // 先查是否已存在
    const exists = await mysql.get('hot_search', {
      site: data.site,
      rank: data.rank,
      update_time: data.update_time,
    });
    if (!exists) {
      const result = await mysql.query('INSERT INTO hot_search (site, title, url, `rank`, heat, update_time) VALUES (?, ?, ?, ?, ?, ?)', [
        data.site,
        data.title,
        data.url,
        data.rank,
        data.heat,
        data.update_time,
      ]);
      console.log(`成功插入数据: ${data.site} 第${data.rank}名 "${data.title}"`);
      return result;
    } else {
      console.log(`数据已存在，跳过: ${data.site} 第${data.rank}名 "${data.title}"`);
      return null;
    }
  }
  // 根据更新时间查询数据
  async getByUpdateTime(updateTime) {
    const { mysql } = this.ctx.app;
    const rows = await mysql.query('SELECT * FROM hot_search WHERE update_time = ?', [updateTime]);
    return rows;
  }
  // 检查某个 site 在指定时间点是否有数据
  async countBySite(updateTime, site) {
    const { mysql } = this.ctx.app;
    const result = await mysql.query('SELECT COUNT(*) AS count FROM hot_search WHERE site = ? AND update_time = ?', [site, updateTime]);
    console.log(site, '更新时间:', updateTime, '数据数量:', result[0]?.count || 0);
    return result[0]?.count || 0;
  }
  async fetchWeiboHot() {
    const { config } = this;
    // 请求微博热搜页面
    const res = await axios.get('https://s.weibo.com/top/summary', {
      headers: {
        'User-Agent': config.userAgent,
        Referer: 'https://s.weibo.com/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8',
        cookie:
          'SUBP=0033WrSXqPxfM72wWs9jqgMF55529P9D9WFOYPd2-nw5G8bIQYe.dM5r5JpX5KMhUgL.FoMN1KB41KeEShq2dJLoIp7LxKML1KBLBKnLxKqL1hnLBoMNS0.X1K.0eoBc; _s_tentry=passport.weibo.com; Apache=4538976279973.021.1748913923372; SINAGLOBAL=4538976279973.021.1748913923372; ULV=1748913923375:1:1:1:4538976279973.021.1748913923372:; WBPSESS=Dt2hbAUaXfkVprjyrAZT_Ko7AjWlldRtRlOFN2B0d3HfUXasa3-yz9VJfMHGHs9il8qwlDt7XEkVj6ybb2kdVgzlIFjIsxXk3jC-299J8vPMiOKQkH5twWDBPHVVTdJI7IBq4-4-9xGINtONDherNg==; SUB=_2AkMfYsB-dcPxrARWkfwcxWjgaItH-jyst6mIAn7uJhMyOhh87kZVqSdutBF-XKTm5gi2GE8jbgw7DNrwbHQ64jim',
      },
    });

    const $ = cheerio.load(res.data);
    const hotList = [];
    const weiboURL = 'https://s.weibo.com';

    // 选择热搜表格的每一行
    $('#pl_top_realtimehot table tbody tr').each(function (index) {
      // 跳过表头
      if (index === 0) return;
      const $tds = $(this).find('td');
      const rank = index;
      const $a = $tds.eq(1).find('a');
      const url = weiboURL + $a.attr('href');
      const title = $a.text().trim();
      const heat = $tds.eq(1).find('span').text().trim() || '';
      hotList.push({
        rank,
        url,
        title,
        heat,
        site: '微博',
      });
    });

    console.log(`微博热搜爬取到 ${hotList.length} 条数据`);
    return hotList.slice(0, 20);
  }

  async fetchBaiduHot() {
    const res = await axios.get('https://top.baidu.com/board?tab=realtime', {
      headers: {
        'User-Agent': config.userAgent,
        Referer: 'https://top.baidu.com/',
      },
    });
    const $ = cheerio.load(res.data);

    const hotList = [];
    $('.row-start-center.zkwvwdF0VfxBzs7BSEZ1A').each(function (idx) {
      const rank = idx + 1;
      const title = $(this).find('._38vEKmzrdqNxu0Z5xPExcg').text().trim();
      // 热度
      const heat = $(this).find('._2h7pZ6t1gkQpM5pU5Y1jUO').text().trim() || '';
      // 拼接百度搜索链接
      const url = `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`;
      hotList.push({
        rank: rank || idx + 1,
        url,
        title,
        heat,
        site: '百度',
      });
    });

    console.log(`百度热搜爬取到 ${hotList.length} 条数据`);
    return hotList.slice(0, 20);
  }

  async fetchBilibiliHot() {
    const res = await axios.get('https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all', {
      headers: {
        'User-Agent': config.userAgent,
        Referer: 'https://www.bilibili.com/',
        cookie: `buvid_fp_plain=undefined; enable_web_push=DISABLE; header_theme_version=CLOSE; LIVE_BUVID=AUTO5717144765794005; CURRENT_BLACKGAP=0; DedeUserID=14892463; DedeUserID__ckMd5=4ef6b10704636f02; is-2022-channel=1; go-back-dyn=0; enable_feed_channel=ENABLE; CURRENT_QUALITY=80; _uuid=FAD37665-797C-4963-7627-D4E62DBCECED34313infoc; hit-dyn-v2=1; fingerprint=db65f859279a16bd22c93d4c47f364a6; buvid_fp=db65f859279a16bd22c93d4c47f364a6; buvid3=33A3AD19-EE99-58D5-D139-33937905368D35906infoc; b_nut=1748407235; rpdid=|(J|)l)R~RJJ0J'u~R)R|~)Ju; home_feed_column=5; buvid4=5F4B13D2-95A6-43E4-9055-56145A04793F99654-023111113-RoU6Io6eaXN5hT%2FTDpMpDoTfonI0NN3tUH7bIN8d7%2BueGTqEm%2B0AtQ%3D%3D; PVID=1; browser_resolution=1707-898; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDkwNTAyNTEsImlhdCI6MTc0ODc5MDk5MSwicGx0IjotMX0.EaaKA2Ui-XndR1KtcbrnOMP3LKeS6Z7U1RKHa72u9y8; bili_ticket_expires=1749050191; SESSDATA=ccb98271%2C1764343055%2Cd38c5%2A62CjADhFEzDzCiMpnU2v9pg2yivQThejYsbk3XxoDnxQSFLHJVtvHYO0ZAmH8oH8aUC8ISVk12Rm5OWmZROVlybExWTlhHc0RydDkzLUYzZjh1OGFsVEtaeXVjczgwSnR4Rk5WbEZuVllWN1h3QXBXYUhIb0o0SV93T2tVQUNuT2dIazVyWTZ2WnB3IIEC; bili_jct=8ea1891c764e60a75599e0f6d8bb1776; sid=4mklhih0; CURRENT_FNVAL=4048; b_lsid=6A54B9F1_197338C1C86; bp_t_offset_14892463=1074077329665294336`,
      },
    });

    const hotList = [];
    const list = res.data.data.list || [];

    list.forEach((item, idx) => {
      hotList.push({
        rank: idx + 1,
        url: `https://www.bilibili.com/video/${item.bvid}`,
        title: item.title,
        heat: item.stat.view,
        site: 'B站',
      });
    });

    console.log(`B站热搜爬取到 ${hotList.length} 条数据`);
    return hotList.slice(0, 20);
  }
}

module.exports = HotSearchService;
