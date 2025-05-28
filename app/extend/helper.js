const moment = require('moment');
// 新增时间格式化方法（返回YYYY-MM-DD HH:mm:ss格式）
exports.formatTime = time => moment(time).format('YYYY-MM-DD HH:mm:ss');
exports.relativeTime = time => moment(new Date(time * 1000)).fromNow();