// 静态资源配置（支持多路径）
config.static = {
  prefix: '/', // 全局前缀（可设为空或具体路径）
  dirs: [
    {
      prefix: '/images', // 独立前缀
      dir: path.join(appInfo.baseDir, 'app/public/images'), // 对应目录
    },
    {
      prefix: '/icons',
      dir: path.join(appInfo.baseDir, 'app/public/icons'),
    },
  ],
  dynamic: true, // 动态加载文件（继承全局配置）
  preload: false,
  maxAge: 31536000,
  buffer: false,
};