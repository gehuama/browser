const EventEmitter = require("events");
// 主进程
class Main extends EventEmitter {}
const main = new Main();
// 导出主进程
module.exports = main;