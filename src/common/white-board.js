import {fabric} from 'fabric'

const DEFAULT_MSG = '请输入内容';

const drawWidth = 3;
const drawColor = 'red';

class Whiteboard {
    CHOOSE = "choose";
    PAN = 'pan';
    ELLIPSE = 'ellipse';
    RECTANGLE = 'rectangle';
    ARROW = 'arrow';
    FONT = 'font';
    REMOVE = 'remove';

    constructor(canvasId) {
        this.canvasId = canvasId;
        this.backgroundColor = null;
        this.board = null;
        this.drawType = this.CHOOSE;
        this.zoom = 1;

        this.mouseFrom = {};//起始点
        this.mouseTo = {};
        this.moveCount = 1; //绘制移动计数器
        this.doDrawing = false; // 绘制状态
        this.drawingObject = null;
    }

    init(backgroundColor = 'white') {
        this.backgroundColor = backgroundColor;

        this.board = new fabric.Canvas(this.canvasId);
        this.board.perPixelTargetFind = true;//按实际内容选择
        this.board.selection = false;//关闭组选择
        this.board.enableRetinaScaling = false;
        this.board.backgroundColor = this.backgroundColor;
        this.board.freeDrawingBrush.color = drawColor;//设置自由绘颜色
        this.board.freeDrawingBrush.width = drawWidth;

        this.setDrawType(this.drawType);

        this.board.on("selection:created", e => {
            if (this.drawType === this.REMOVE) {
                console.info("selection:" + e.target)
                this.remove(e);
            }
        });
        this.board.on("selection:updated", e => {
            console.info("selection:" + e.target)
        });

        //绑定画板事件
        this.board.on("mouse:down", (options) => {
            // console.log("mouse:down：" + options);
            if (this.drawType === this.REMOVE) {
                return;
            }

            this.doDrawing = true;
            let xy = this.transformMouse(options.e.offsetX, options.e.offsetY);
            this.mouseFrom.x = xy.x;
            this.mouseFrom.y = xy.y;
            this.mouseDown();
        });
        this.board.on("mouse:move", (options) => {
            if (!this.doDrawing) {
                //减少绘制频率
                return;
            }
            // console.log("mouse:move：" + options);
            this.moveCount++;
            let xy = this.transformMouse(options.e.offsetX, options.e.offsetY);
            this.mouseTo.x = xy.x;
            this.mouseTo.y = xy.y;
            this.drawing();
        });
        this.board.on("mouse:up", (options) => {
            // console.log("mouse:up：" + options);
            let xy = this.transformMouse(options.e.offsetX, options.e.offsetY);
            this.mouseTo.x = xy.x;
            this.mouseTo.y = xy.y;
            this.moveCount = 1;
            this.doDrawing = false;

            if (this.drawingObject) {
                this.board.remove(this.drawingObject);
                this.board.add(this.drawingObject);
                this.drawingObject = null;
            }
        });
    }

    setDrawType(drawType) {
        console.info("drawType:" + drawType)
        this.drawType = drawType;
        switch (drawType) {
            case this.CHOOSE:
                this.board.skipTargetFind = false;
                this.board.isDrawingMode = false;
                break
            case this.PAN:
                this.board.skipTargetFind = true;
                this.board.discardActiveObject();
                this.board.renderAll();
                this.board.isDrawingMode = true;
                break
            case this.FONT:
                this.board.skipTargetFind = false;
                this.board.discardActiveObject();
                this.board.renderAll();
                this.board.isDrawingMode = false;
                break
            case this.ELLIPSE:
                this.board.skipTargetFind = true;
                this.board.discardActiveObject();
                this.board.renderAll();
                this.board.isDrawingMode = false;
                break
            case this.RECTANGLE:
                this.board.skipTargetFind = true;
                this.board.discardActiveObject();
                this.board.renderAll();
                this.board.isDrawingMode = false;
                break
            case this.ARROW:
                this.board.skipTargetFind = true;
                this.board.discardActiveObject();
                this.board.renderAll();
                this.board.isDrawingMode = false;
                break
            case this.REMOVE:
                this.board.skipTargetFind = false;
                this.board.discardActiveObject();
                this.board.renderAll();
                this.board.isDrawingMode = false;
                break
        }
    }

    isDrawingMode(mode) {
        this.board.isDrawingMode = mode;
    }

    setZoom(zoom) {
        this.zoom = zoom;
        this.board.setZoom(zoom);
    }

    setSize(width, height) {
        this.board.setWidth(width)
        this.board.setHeight(height)
    }

    //坐标转换
    transformMouse(mouseX, mouseY) {
        return {x: mouseX / this.zoom, y: mouseY / this.zoom};
    }

    //删除
    remove(e) {
        this.board.remove(e.target);
    }

    mouseDown() {
        switch (this.drawType) {
            case this.ELLIPSE:
                let ellipse = this.drawingObject = new fabric.Ellipse({
                    left: this.mouseFrom.x,
                    top: this.mouseFrom.y,
                    fill: "rgba(255, 255, 255, 0)",
                    originX: "left",
                    originY: "top",
                    rx: 0,
                    ry: 0,
                    stroke: drawColor,
                    strokeWidth: drawWidth
                });
                this.board.add(ellipse);
                break
            case this.RECTANGLE:
                let rect = this.drawingObject = new fabric.Rect({
                    left: this.mouseFrom.x,
                    top: this.mouseFrom.y,
                    fill: "rgba(255, 255, 255, 0)",
                    originX: "left",
                    originY: "top",
                    width: 0,
                    height: 0,
                    angle: 0,
                    stroke: drawColor,
                    strokeWidth: drawWidth
                });
                this.board.add(rect);
                break
            case this.ARROW:
                break
            // case this.FONT:
            //     let iTextSample = new fabric.IText(DEFAULT_MSG, {
            //         left: this.mouseFrom.x,
            //         top: this.mouseFrom.y,
            //         fontFamily: 'Helvetica',
            //         fill: '#333',
            //         lineHeight: 1.1,
            //         textDecoration: 'underline',
            //         fontSize: 30,
            //         cache: false,
            //     });
            //
            //     this.board.on("text:editing:entered", e => {
            //         let obj = this.board.getActiveObject();
            //         if (obj.text === DEFAULT_MSG) {
            //             obj.selectAll();
            //             obj.text = "";
            //             obj.hiddenTextarea.value = "";
            //             // obj.dirty = true;
            //             // obj.setCoords();
            //             this.board.renderAll();
            //         }
            //     });
            //
            //     this.board.add(iTextSample);
            //     iTextSample.enterEditing();
            //     iTextSample.hiddenTextarea.focus();
            //     break
        }
    }

    //绘制
    drawing() {
        switch (this.drawType) {
            case this.ELLIPSE:
                let rx = Math.abs(this.mouseFrom.x - this.mouseTo.x) / 2;
                let ry = Math.abs(this.mouseFrom.y - this.mouseTo.y) / 2;
                if (rx > this.drawingObject.strokeWidth) {
                    rx -= this.drawingObject.strokeWidth / 2
                }
                if (ry > this.drawingObject.strokeWidth) {
                    ry -= this.drawingObject.strokeWidth / 2
                }
                this.drawingObject.set({rx: rx, ry: ry});

                if (this.mouseFrom.x > this.mouseTo.x) {
                    this.drawingObject.set({originX: 'right'});
                } else {
                    this.drawingObject.set({originX: 'left'});
                }
                if (this.mouseFrom.y > this.mouseTo.y) {
                    this.drawingObject.set({originY: 'bottom'});
                } else {
                    this.drawingObject.set({originY: 'top'});
                }
                this.board.renderAll();
                break
            case this.RECTANGLE:
                if (this.mouseFrom.x > this.mouseTo.x) {
                    this.drawingObject.set({left: Math.abs(this.mouseTo.x)});
                }
                if (this.mouseFrom.y > this.mouseTo.y) {
                    this.drawingObject.set({top: Math.abs(this.mouseTo.y)});
                }

                this.drawingObject.set({width: Math.abs(this.mouseFrom.x - this.mouseTo.x)});
                this.drawingObject.set({height: Math.abs(this.mouseFrom.y - this.mouseTo.y)});

                this.board.renderAll();
                break
            case this.ARROW:
                // let canvasObject = this.drawingObject = new fabric.Path(this.drawArrow(this.mouseFrom.x, this.mouseFrom.y, this.mouseFrom.x, this.mouseFrom.y, 30, 30), {
                //     fill: "rgba(255, 255, 255, 0)",
                //     stroke: drawColor,
                //     strokeWidth: drawWidth
                // });
                // this.board.add(canvasObject);
                break
            // case this.FONT:
            //     let iTextSample = new fabric.IText(DEFAULT_MSG, {
            //         left: this.mouseFrom.x,
            //         top: this.mouseFrom.y,
            //         fontFamily: 'Helvetica',
            //         fill: '#333',
            //         lineHeight: 1.1,
            //         textDecoration: 'underline',
            //         fontSize: 30,
            //         cache: false,
            //     });
            //
            //     this.board.on("text:editing:entered", e => {
            //         let obj = this.board.getActiveObject();
            //         if (obj.text === DEFAULT_MSG) {
            //             obj.selectAll();
            //             obj.text = "";
            //             obj.hiddenTextarea.value = "";
            //             // obj.dirty = true;
            //             // obj.setCoords();
            //             this.board.renderAll();
            //         }
            //     });
            //
            //     this.board.add(iTextSample);
            //     iTextSample.enterEditing();
            //     iTextSample.hiddenTextarea.focus();
            //     break
        }
    }

    //绘制箭头方法
    drawArrow(fromX, fromY, toX, toY, theta, headlen) {
        theta = typeof theta != "undefined" ? theta : 30;
        headlen = typeof theta != "undefined" ? headlen : 10;
        // 计算各角度和对应的P2,P3坐标
        let angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI,
            angle1 = (angle + theta) * Math.PI / 180,
            angle2 = (angle - theta) * Math.PI / 180,
            topX = headlen * Math.cos(angle1),
            topY = headlen * Math.sin(angle1),
            botX = headlen * Math.cos(angle2),
            botY = headlen * Math.sin(angle2);
        let arrowX = fromX - topX,
            arrowY = fromY - topY;
        let path = " M " + fromX + " " + fromY;
        path += " L " + toX + " " + toY;
        arrowX = toX + topX;
        arrowY = toY + topY;
        path += " M " + arrowX + " " + arrowY;
        path += " L " + toX + " " + toY;
        arrowX = toX + botX;
        arrowY = toY + botY;
        path += " L " + arrowX + " " + arrowY;
        return path;
    }
}

export default Whiteboard;
