import {TinyEmitter} from "tiny-emitter";

class ShowBorad {
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
    }

    setCanvasBg(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
    }

    setLintPoints(points) {
        if (points.length === 0) {
            return;
        }

        for (let i = 1; i < points.length; i++) {
            let startPoint = points[i - 1];
            let newPoint = points[i];
            this.drawLine(startPoint.x, startPoint.y, newPoint.x, newPoint.y);
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

export default ShowBorad
