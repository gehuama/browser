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
            // 创建一个只包含可见元素的布局树
            const html = document.children[0];
            const body = html.children[1];
            const layoutTree = createLayoutTree(body);
            // 更新布局树，计算每个元素布局信息
            updateLayoutTree(layoutTree);
            // 根据布局树生成图层树
            const layers = [layoutTree];
            // 创建图层树
            createLayersTree(layoutTree, layers);
            // 根据分层树生成绘制步骤，并复合图层
            const paintSteps = compositeLayers(layers);
            // 把步骤展开
            console.log(paintSteps.flat().join("\r\n"));

            // 10.页面解析并加载资源
            // DOM解析完毕
            main.emit("DOMContentLoaded");
            // css和图片加载完完成后
            main.emit("load")
        })
    }
})
/** 生成绘制步骤 */
function compositeLayers(layers) {
    return layers.map(layer => paint(layer));
}
/** 绘制 */
function paint(element, paintSteps = []) {
    const { top = 0, left = 0, color = "black", background = "white", width = 100, height = 0 } = element.layout;
    if (element.type == "text") {
        /** 用canvas 模拟绘图指令 */
        // 字体大小
        paintSteps.push(`ctx.font = "20px Impact"`);
        // 字体颜色
        paintSteps.push(`ctx.strokeStyle = "${color}"`);
        // 写入文字 干掉空格
        paintSteps.push(`ctx.strokeText("${element.text}",${parseFloat(left)}, ${parseFloat(top) + 20})`);
    } else {
        // 背景颜色
        paintSteps.push(`ctx.fillStyle= "${background}"`);
        // 绘制矩形
        paintSteps.push(`ctx.fillRect(${parseFloat(left)},${parseFloat(top)},${parseFloat(width)},${parseFloat(height)})`)
    }
    element.children.forEach(child=>paint(child, paintSteps))
    return paintSteps;
}

/** 创建图层树 */
function createLayersTree(element, layers) {
    // 遍历子节点，判断是否是否要生成新的图层，如果生成，则从当前图层中删除
    element.children = element.children.filter(child => !createNewLayer(child, layers));
    /* 递归子元素 */
    element.children.forEach(child => createLayersTree(child, layers));
    return layers;
}
/** 创建分层树 */
function createNewLayer(element, layers) {
    let newLayer = false;
    const attributes = element.attributes;
    Object.entries(attributes).forEach(([key, value]) => {
        /** 行内样式 */
        if (key === 'style') {
            /** 获取 属性为style的值 并以“；”对其进行分割
             * 例如 <div id="hello" style="background: green;">hello</div>
             * attributes = ["background: green"]
             *  */
            const attributes = value.split(/;\s*/);
            /** attribute : "background: green"*/
            attributes.forEach((attribute) => {
                /** property:background 
                 *  value: green
                 * */
                const [property, value] = attribute.split(/:\s*/);
                if (property) {
                    element.computedStyle[property] = value;
                    if (property === 'position' && (value === "absolute" || value === "fixed")) {
                        // 因为这是一个新的层，所以里面的元素需要重新计算一下自己的布局位置
                        updateLayoutTree(element)
                        layers.push(element)
                        newLayer = true;
                    }
                }

            })
        }
    });
    return newLayer;
}
/** 更新布局树
 * 计算布局树上每个元素的布局信息
 * @param {*} element
 * @param {*} top 自己距离自己父节点顶部距离
 * @param {*} parentTop 父节点居顶部距离
 */
function updateLayoutTree(element, top = 0, parentTop = 0) {
    const computedStyle = element.computedStyle;
    /** 构建元素布局 */
    element.layout = {
        /**
         * https://www.processon.com/diagraming/61d9d245e401fd06a8be45a4
         * layout.top=top(自己距离自己父节点顶部距离)+parentTop(父节点居顶部距离)
         * */
        top: top + parentTop,
        left: 0,
        width: computedStyle.width,
        height: computedStyle.height,
        color: computedStyle.color,
        background: computedStyle.background
    }
    let childTop = 0;
    element.children.forEach(child => {
        updateLayoutTree(child, childTop, element.layout.top);
        childTop += parseFloat(child.computedStyle.height || 0);
    })
}
/** 创建布局树 */
function createLayoutTree(element) {
    /** 过滤不需要生成布局的元素 */
    element.children = element.children.filter(isShow);
    /* 递归子元素 */
    element.children.forEach(createLayoutTree);
    return element;
}
/** 判断元素是否显示 */
function isShow(element) {
    let show = true; // 默认都显示
    if (element.tagName === "head" || element.tagName === "script" || element.tagName === "link") {
        show = false;
    }
    /** 拿到元素属性 */
    const attributes = element.attributes;
    Object.entries(attributes).forEach(([key, value]) => {
        /** 行内样式 */
        if (key === 'style') {
            /** 获取 属性为style的值 并以“；”对其进行分割
             * 例如 <div id="hello" style="background: green;">hello</div>
             * attributes = ["background: green"]
             *  */
            const attributes = value.split(/;\s*/);
            /** attribute : "background: green"*/
            attributes.forEach((attribute) => {
                /** property:background 
                 *  value: green
                 * */
                const [property, value] = attribute.split(/:\s*/);
                if (property) {
                    element.computedStyle[property] = value;
                    if (property === 'display' && value === "none") {
                        show = false;
                    }
                }

            })
        }
    });
    return show;
}
/** 计算元素样式 */
function recalculateStyle(cssRules, element, parentStyle = {}) {
    /** 获取元素属性 */
    const attributes = element.attributes;
    /** 样式继承 继承父节点样式 元素计算样式 */
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
                    if (property) {
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
            const attributes = value.split(/;\s*/);
            /** attribute : "background: green"*/
            attributes.forEach((attribute) => {
                /** property:background 
                 *  value: green
                 * */
                const [property, value] = attribute.split(/:\s*/);
                if (property) {
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
    path: "/gitlab/web/browser/server/public/postion.html" // 路径
})