const EventEmitter = require("events");
// 渲染进程
class Render extends EventEmitter {}
const render = new Render();
module.exports = render;