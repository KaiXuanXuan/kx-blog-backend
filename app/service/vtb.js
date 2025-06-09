const { exec } = require('child_process');

class VtbService extends require('egg').Service {

  // 因为需要走科学上网代理，已废弃
  async info() {
    return new Promise((resolve, reject) => {
      exec('curl https://api.vtbs.moe/v1/info', (error, stdout, stderr) => {
        if (error) {
          this.ctx.logger.error('curl获取VTB信息失败:', error);
          reject(error);
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            reject(e);
          }
        }
      });
    });
  }
}

module.exports = VtbService;
