const EventEmitter = require("events");
// GPU进程
class GPU extends EventEmitter {}
const gpu = new GPU();
module.exports = GPU;