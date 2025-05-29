'use strict';
const fse = require('fs-extra');

module.exports = {
  /**
   * 移动文件到目标路径（兼容跨分区场景）
   * @param {string} sourcePath - 源文件路径
   * @param {string} targetPath - 目标文件路径
   * @returns {Promise<void>}
   */
  async moveFile(sourcePath, targetPath) {
    // 使用 fs-extra 的 move 方法（自动处理跨分区）
    await fse.move(sourcePath, targetPath, { overwrite: true });
  }
};
const moment = require('moment');
// 新增时间格式化方法（返回YYYY-MM-DD HH:mm:ss格式）
exports.formatTime = (time) => moment(time).format('YYYY-MM-DD HH:mm:ss');
exports.relativeTime = (time) => moment(new Date(time * 1000)).fromNow();
