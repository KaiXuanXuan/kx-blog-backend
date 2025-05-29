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
  config.middleware = ['auth'];

  // 静态资源配置（使public/images目录可通过/images前缀访问）
  config.static = {
    prefix: '/images', // 前端访问URL前缀
    dir: path.join(appInfo.baseDir, 'app/public/images'), // 服务器存储目录
    dynamic: true, // 动态加载文件
    preload: false,
    maxAge: 31536000, // 浏览器缓存时间（秒）
    buffer: false,
  };
  // 可选：配置中间件作用范围（如排除登录接口）
  config.auth = {
    enable: true,
    match: (ctx) => !['/api/user/login', '/api/user/register', '/api/blog/list', '/api/blog/detail'].includes(ctx.path),
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
      password: '123456',
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
  };

  config.jwt = {
    secret: 'MC4CAQAwBQYDK2VwBCIEIIol9HEzdyY6IBlvb7r7vWgsoS2ynVkqAinAODv4wQes', // 替换为安全的密钥
    expiresIn: '7d', // Token 过期时间（7天）
  };

  config.cors = {
    // 允许的源（必须为具体域名，不可用*）
    origin: ['kaixx.top', 'www.kaixx.top'],
    // 允许的HTTP方法
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    // 允许的请求头（如需要前端传自定义头，需在此声明）
    allowHeaders: 'Content-Type,Authorization,X-CSRF-Token',
    // 允许前端获取的响应头（可选）
    exposeHeaders: '',
    // 是否允许携带Cookie（若前端需传Cookie，设为true）
    credentials: true,
  };

  return {
    ...config,
    ...userConfig,
  };
};
