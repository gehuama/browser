const EventEmitter = require("events");
const http = require("http");
// 网络进程
class Network extends EventEmitter {
    /** 请求额外资源
     * options 请求选项
     */
    fetchResource(options){
        return new Promise(resolve=>{
            /** 
             * response 回调
             */
            let request = http.request(options, response=>{
                /** 请求响应头 */
                const headers = response.headers;
                const buffers = [];
                response.on("data", buffer=>{
                    // 数据流
                    buffers.push(buffer);
                })
                response.on("end", ()=>{
                    resolve({
                        headers,
                        body: Buffer.concat(buffers).toString()
                    });
                });
            });
            request.end()
        })
    }
}
const network = new Network();
module.exports = network;