const http = require("http");
const htmlparser2 = require("htmlparser2")
const css = require("css");
const main = require("./main");
const network = require("./network");
const render = require("./render");
const host = "127.0.0.1";
const port = 8080
// 2.转发请求
// 浏览器主进程接收请求，会把请求转发给网络进程
main.on("request", function (options) {
    // 会把请求转发给网络进程
    network.emit("request", options);
})
// 5. 通知渲染进程
// 主进程 接收到消息后要通知渲染进程进行开始渲染
main.on("prepareRender", function (response) {
    // 6.提交导航
    // 主进程发送提交导航的消息给渲染进程
    render.emit("commitNavigation", response);
})

//**********网络进程********************
network.on("request", (options) => {
    // 3. 发起URL请求
    // 调用http模块发送请求给服务
    let request = http.request(options, (response) => {
        // 4. 读取响应头
        let header = response.headers;
        // 7. 读取响应体
        // 告诉主进程庆开始渲染页面
        main.emit("prepareRender", response)
    })
    request.end();
})

/**************渲染进程 */
render.on("commitNavigation", (response) => {
    const headers = response.headers;
    // 获取 响应体的类型 渲染进程
    const contentType = headers['content-type'];
    // 说明这是一个HTML响应
    if (contentType.indexOf("text/html") !== -1) {
        // 定义一个文档对象
        const document = { type: "document", attributes: {}, children: [] };
        // 定义一个token栈
        const tokenStack = [document];
        // 1 通过渲染进程把html字符串转化成DOM树 
        const parser = new htmlparser2.Parser({
            onopentag(tagName, attributes) { // 遇到开始标签
                // 栈顶的就是父节点
                const parent = tokenStack[tokenStack.length - 1];
                // 创建新的DOM节点
                const child = {
                    type: "element",
                    tagName, // html
                    children: [],
                    attributes
                }
                parent.children.push(child);
                tokenStack.push(child);
            },
            ontext(text) {
                if (!/^[\r\n\s]*$/.test(text)) {
                    // 文本节点不需要入栈
                    // 栈顶的就是父节点
                    const parent = tokenStack[tokenStack.length - 1];
                    // 创建新的DOM节点
                    const child = {
                        type: "text",
                        text,
                        tagName: "text", // html
                        children: [],
                        attributes: {}

                    }
                    parent.children.push(child);
                }
            },
            onclosetag(tagName) {
                // 让栈顶元素出栈
                tokenStack.pop();
            }
        });
        // 8.传输数据 
        // 持续接受响应体 一旦接收到部分响应体，直接传递给htmlparser
        response.on("data", (buffer) => {
            parser.write(buffer.toString())
        })
        // 9.文档传输完毕
        response.on("end", () => {
           // 计算每个DOM节点的具体的样式 继承 层叠
            // 10.页面解析并加载资源
            // DOM解析完毕
            main.emit("DOMContentLoaded");
            // css和图片加载完完成后
            main.emit("load")
        })
    }
})


// 1.输入URL地址 
// 由主进程接收用户输入的URL地址
main.emit("request", {
    host, // 域名
    port, // 端口
    path: "/gitlab/web/browser/server/public/index.html" // 路径
})