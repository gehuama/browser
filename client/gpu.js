const EventEmitter = require("events");
// GPU进程
class GPU extends EventEmitter {
    constructor(){
        super()
        /** 最终生成的位图，保存在GPU内存中 */
        this.bitMaps = [];
    }
}
const gpu = new GPU();
module.exports = gpu;