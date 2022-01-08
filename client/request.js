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
        // 定义样式 cssRules
        const cssRules = [];
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
                switch (tagName) {
                    /** 当结束标签为style 当前得到的TOKEN栈内容为<style>...</style> 即样式 */
                    case "style":
                        const styleToken = tokenStack[tokenStack.length - 1];
                        /** 获取样式内容语法树 */
                        const cssAST = css.parse(styleToken.children[0].text);
                        const rules = cssAST.stylesheet.rules;
                        cssRules.push(...rules);
                        break;
                    default:
                        break;
                }
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
            recalculateStyle(cssRules, document);
            console.dir(document, {depth: null});
            // 10.页面解析并加载资源
            // DOM解析完毕
            main.emit("DOMContentLoaded");
            // css和图片加载完完成后
            main.emit("load")
        })
    }
})
/** 计算元素样式 */
function recalculateStyle(cssRules, element, parentStyle = {}) {
    /** 获取元素属性 */
    const attributes = element.attributes;
    /** 样式继承 继承父节点样式 */
    element.computedStyle = { color: parentStyle.color || "black" };
    /** Object.entries: 一个给定对象自身可枚举属性的键值对数组，其排列与使用 
     * 即可以把一个对象的键值以数组的形式遍历出来
     * 例如
     * <div id="hello"> hello </div>
     * 遍历div（元素） attributes（属性） 得到每个属性的key和value
     * 即 key=id value =hello
     * 
     *  
    */
    Object.entries(attributes).forEach(([key, value]) => {
        /** 
         * [ { type: 'rule',
                selectors: [ '#hello' ],
                declarations: [ [Object] ],
                position:
                Position { start: [Object], end: [Object], source: undefined } },
            { type: 'rule',
                selectors: [ '.world' ],
                declarations: [ [Object] ],
                position:
                Position { start: [Object], end: [Object], source: undefined } } ]
        */
        /** 应用样式表 */
        /** 遍历样式规则 */
        cssRules.forEach(rule => {
            /** 得到元素样式选择器 即  #hello */
            let selector = rule.selectors[0];
            /** 判断元素属性的key是否为id 并且 css样式规则 id规则（#）+ 元素属性的value 是否相同 */
            if (key === "id" && selector === ("#" + value) || key === "class" && selector === ("." + value)) {
                /** 得到样式描述值 []
                 *  即 [{color: red}]
                 *  对其进行遍历
                 *  property ：color, value : red
                 **/
                rule.declarations.forEach(({ property, value }) => {
                    /** 样式计算属性 */
                    if(property){
                        element.computedStyle[property] = value;
                    }
                })
            }
        })
        /** 行内样式 */
        if (key === 'style') {
            /** 获取 属性为style的值 并以“；”对其进行分割
             * 例如 <div id="hello" style="background: green;">hello</div>
             * attributes = ["background: green"]
             *  */
            const attributes = value.split(";");
            /** attribute : "background: green"*/
            attributes.forEach((attribute) => {
                /** property:background 
                 *  value: green
                 * */
                const [property, value] = attribute.split(/:\s*/);
                if(property){
                    element.computedStyle[property] = value;
                }
                
            })
        }
    });
    /** 处理子元素 */
    element.children.forEach(child => recalculateStyle(cssRules, child, element.computedStyle));
}

// 1.输入URL地址 
// 由主进程接收用户输入的URL地址
main.emit("request", {
    host, // 域名
    port, // 端口
    path: "/gitlab/web/browser/server/public/index.html" // 路径
})