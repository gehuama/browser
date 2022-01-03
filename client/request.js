const http = require("http");
const main = require("./main");
const network = require("./network");
const render = require("./render");
const host ="localhost";
const port = 80
// 2.转发请求
// 浏览器主进程接收请求，会把请求转发给网络进程
main.on("request", function(options){
    // 会把请求转发给网络进程
    network.emit("request", options);
})
// 5. 通知渲染进程
// 主进程 接收到消息后要通知渲染进程进行开始渲染
main.on("prepareRender", function(response){
    // 6.提交导航
    // 主进程发送提交导航的消息给渲染进程
    render.emit("commitNavigation", response);
})

//**********网络进程********************
network.on("request",(options)=>{
    // 3. 发起URL请求
    // 调用http模块发送请求给服务
    let request = http.request(options, (response)=>{
        // 4. 读取响应头
        let header =  response.headers;
         // 7. 读取响应体
        // 告诉主进程庆开始渲染页面
        main.emit("prepareRender", response)
    })
    request.end();
})

/**************渲染进程 */
render.on("commitNavigation", (response)=>{
    const buffers = [];
    // 8.传输数据 
    // 持续接受响应体
    response.on("data", (buffer)=>{
        buffers.push(buffer);
    })
    // 9.文档传输完毕
    response.on("end",()=>{
        const resultBuffer = Buffer.concat(buffers); // 二进制缓冲区
        const html = resultBuffer.toString(); // 转化HTML字符串
        console.log("html", html);
       // 10.页面解析并加载资源
        // DOM解析完毕
        main.emit("DOMContentLoaded");
        // css和图片加载完完成后
        main.emit("load")
    })
})


// 1.输入URL地址 
// 由主进程接收用户输入的URL地址
main.emit("request", {
    host, // 域名
    port, // 端口
    path: "/index.html" // 路径
})