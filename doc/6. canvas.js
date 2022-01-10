const { createCanvas } = require("canvas");
const fs = require("fs");
const canvas = createCanvas(150, 250);
const ctx = canvas.getContext("2d");

// cvsCtx.font = "20px Impact";
// cvsCtx.strokeStyle = "red";
// cvsCtx.strokeText("hello", 0, 20);



// body
ctx.fillStyle= "white"
ctx.fillRect(0,0,100,0)

// container
ctx.fillStyle= "red"
ctx.fillRect(0,0,100,100)

// hello
ctx.fillStyle= "green"
ctx.fillRect(0,100,100,100)

// hello 文本
ctx.font = "20px Impact"
ctx.strokeStyle = "blue"
ctx.strokeText("hello",0, 120)

// absolute
ctx.fillStyle= "pink"
ctx.fillRect(0,0,50,50)
// 绝对定位 文本
ctx.font = "20px Impact"
ctx.strokeStyle = "black"
ctx.strokeText("绝对定位",0, 20)




fs.writeFileSync("result.png", canvas.toBuffer("image/png"));

