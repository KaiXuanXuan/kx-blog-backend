/* eslint valid-jsdoc: "off" */

const path = require('path');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1748072458315_8998';

  // add your middleware config here
  config.middleware = ['auth', 'permission'];

  // 静态资源配置（使public/images目录可通过/images前缀访问）
  config.static = {
    prefix: '/',
    dirs: [
      {
        prefix: '/images', // 前端访问URL前缀
        dir: path.join(appInfo.baseDir, 'app/public/images'), // 服务器存储目录
      },
      {
        prefix: '/icons',
        dir: path.join(appInfo.baseDir, 'app/public/icons'),
      },
    ],
    dynamic: true,
    preload: false,
    maxAge: 31536000,
    buffer: false,
  };
  // 可选：配置中间件作用范围（如排除登录接口）
  config.auth = {
    enable: true,
    match: (ctx) =>
      !['/api/user/login', '/api/user/register', '/api/blog/list', '/api/blog/detail', '/api/resource/search', '/api/resource/items', '/api/resource/categories', '/api/hotSearch/latest'].includes(
        ctx.path
      ),
  };
  config.permission = {
    enable: true,
    match: (ctx) =>
      [
        '/api/blog/add',
        '/api/blog/update',
        '/api/blog/delete',
        '/api/resource/category/add',
        '/api/resource/category/update',
        '/api/resource/category/delete',
        '/api/resource/item/add',
        '/api/resource/item/update',
        '/api/resource/item/delete',
      ].includes(ctx.path),
  };

  // 热搜爬虫配置
  config.siteMap = {
    微博: 'fetchWeiboHot',
    百度: 'fetchBaiduHot',
    B站: 'fetchBilibiliHot',
  };

  // 模板引擎
  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.tpl': 'nunjucks',
    },
  };

  // multipart配置
  config.multipart = {
    mode: 'file',
    // 允许上传的文件大小
    fileSize: '50mb',
    // 允许上传的文件类型
    fileExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
    // 上传文件存储目录
    uploadDir: path.join(appInfo.baseDir, 'app/public/images'),
    iconsDir: path.join(appInfo.baseDir, 'app/public/icons'),
  };

  // mysql配置
  config.mysql = {
    // 单数据库信息配置
    client: {
      // host
      host: 'localhost',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: 'ade648436f8d56a2',
      // 数据库名
      database: 'test1',
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
  };

  // news配置
  config.news = {
    pageSize: 5,
    serverUrl: 'https://hacker-news.firebaseio.com/v0',
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  };

  config.jwt = {
    secret: 'MC4CAQAwBQYDK2VwBCIEIIol9HEzdyY6IBlvb7r7vWgsoS2ynVkqAinAODv4wQes', // 替换为安全的密钥
    expiresIn: '7d', // Token 过期时间（7天）
  };

  const allowOrigins = ['https://kaixx.top', 'https://www.kaixx.top', 'https://api.coze.cn', 'http://localhost:5175'];

  config.cors = {
    origin: (ctx) => {
      const requestOrigin = ctx.get('origin');
      if (allowOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }
      return ''; // 或者 return false;
    },
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    allowHeaders: 'Content-Type,Authorization,X-CSRF-Token',
    exposeHeaders: '',
    credentials: true,
  };

  config.session = {
    sameSite: 'none',
    secure: true,
  };

  config.security = {
    csrf: {
      enable: true,
      ignore: (ctx) => {
        // 允许来源为 https://kaixx.top/ 的请求跳过 CSRF 校验
        const origin = ctx.get('origin');
        const referer = ctx.get('referer');
        return origin === 'https://kaixx.top' || (referer && referer.startsWith('https://kaixx.top/'));
      },
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
