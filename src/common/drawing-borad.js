import {TinyEmitter} from "tiny-emitter";

class DrawingBorad {
    canvas;
    ctx;
    painting = false;//画板控制开关
    startPoint = {x: undefined, y: undefined};//第一个点坐标
    currLines = []; //当前线的点

    constructor(options) {
        this.emitter = new TinyEmitter();
        this.canvas = document.getElementById(options.id);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = options.width;
        this.canvas.height = options.height;

        this.ctx.strokeStyle = "red";

        this.setCanvasBg('white');
        this.listenToUser(this.canvas)
    }

    setCanvasBg(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
    }

    listenToUser(canvas) {
        //特性检测
        if (document.body.ontouchstart !== undefined) {
            //触屏设备
            canvas.ontouchstart = e => {
                //[0]表示touch第一个触碰点
                let x = e.touches[0].offsetX;
                let y = e.touches[0].offsetY;
                this.painting = true;
                this.startPoint = {x: x, y: y};
            };
            canvas.ontouchmove = e => {
                let x = e.touches[0].offsetX;
                let y = e.touches[0].offsetY;
                let newPoint = {x: x, y: y};
                if (this.painting) {
                    this.drawLine(this.startPoint.x, this.startPoint.y, newPoint.x, newPoint.y);
                    this.startPoint = newPoint;
                }
            };
            canvas.ontouchend = () => {
                this.painting = false;
            };
        } else {// 非触屏设备
            //鼠标点击事件（onmousedown）
            canvas.onmousedown = e => {
                let x = e.offsetX;
                let y = e.offsetY;
                this.painting = true;
                this.startPoint = {x: x, y: y};
                this.currLines.push(this.startPoint);
            };
            //    鼠标滑动事件（onmousemove）
            canvas.onmousemove = e => {
                let x = e.offsetX;
                let y = e.offsetY;
                let newPoint = {x: x, y: y};
                if (this.painting) {
                    this.currLines.push(newPoint);
                    this.drawLine(this.startPoint.x, this.startPoint.y, newPoint.x, newPoint.y);
                    this.startPoint = newPoint;
                }
            };
            //    鼠标松开事件（onmouseup)
            canvas.onmouseup = () => {
                this.painting = false;
                this.emitter.emit('line', this.currLines);
                this.currLines = [];
            };
        }
    }

    // 划线函数
    drawLine(xStart, yStart, xEnd, yEnd) {
        //开始绘制路径
        this.ctx.beginPath();
        //线宽
        this.ctx.lineWidth = 2;
        //起始位置
        this.ctx.moveTo(xStart, yStart);
        //停止位置
        this.ctx.lineTo(xEnd, yEnd);
        //描绘线路
        this.ctx.stroke();
        //结束绘制
        this.ctx.closePath();
    }

    reSetCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.setCanvasBg('white');
    }

    on(event, callback) {
        this.emitter.on(event, callback);
    }
}

export default DrawingBorad
