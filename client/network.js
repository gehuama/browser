const EventEmitter = require("events");
// 网络进程
class Network extends EventEmitter {}
const network = new Network();
module.exports = network;