<template>
    <div class="main-container">
        <div class="live-header">
            <div class="live-header-left">
                <div title="标题" class="live-room-name">标题</div>
            </div>
            <div class="live-header-right">
                <button>开始直播</button>
            </div>
        </div>
        <div class="live-main-area">
            <div class="live-main-area--tools">

            </div>

            <div class="live-main-area--content">
                <div class="live-document-container">
                    <div class="doc-wrapper">
                        <div class="live-document-inner-wrapper" ref="companyStyle">
                            <div class="doc-box" :style="{ width: boardWidth+ 'px', height:boardHeight+ 'px'}">
                                <canvas id="canvas"></canvas>
                            </div>
                        </div>
                        <div class="live-document-operationbar">
                            <div class="live-document-pencilbar">
                                <div title="选择" style="color: white" :class="{checked:pencilbarActive === 1 }"
                                     @click="changePencilbar(1)">选择
                                </div>
                                <div title="画笔" style="color: white" :class="{checked:pencilbarActive === 2 }"
                                     @click="changePencilbar(2)">画笔
                                </div>
                                <div title="椭圆" style="color: white" :class="{checked:pencilbarActive === 3 }"
                                     @click="changePencilbar(3)">椭圆
                                </div>
                                <div title="矩形" style="color: white" :class="{checked:pencilbarActive === 4 }"
                                     @click="changePencilbar(4)">矩形
                                </div>
                                <div title="箭头" style="color: white" :class="{checked:pencilbarActive === 5 }"
                                     @click="changePencilbar(5)">箭头
                                </div>
                                <div title="文字" style="color: white" :class="{checked:pencilbarActive === 6 }"
                                     @click="changePencilbar(6)">文字
                                </div>
                                <div title="橡皮" style="color: white" :class="{checked:pencilbarActive === 7 }"
                                     @click="changePencilbar(7)">橡皮
                                </div>
                                <div title="清空" style="color: white" :class="{checked:pencilbarActive === 8 }"
                                     @click="changePencilbar(8)">清空
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="live-chats-box">
                <div class="video-box">
                    <video
                        id="video"
                        ref="video"
                        class="room-video"
                        x-webkit-airplay="allow"
                        webkit-playsinline
                        playsinline
                        x5-video-player-type="h5-page"
                        x5-video-orientation="portrait"
                        preload="metadata"
                        controlslist="nofullscreen nodownload noremote footbar"
                        oncontextmenu="return false;"
                        muted
                    />
                </div>
            </div>

        </div>
    </div>
</template>

<script>
import FlipCamera from "./common/flip-camera";
import LiveRTCStream from "@/common/livertc-stream";
import LiveRTCClient from "@/common/livertc-client";
import api from "@/common/api";
import Messager from "@/common/messager";
import Vue from "vue"
import Whiteboard from "@/common/white-board"


export default {
    name: 'Teacher',
    data() {
        return {
            stream: null,
            camera: null,
            rtc: null,
            schoolId: 1,
            roomId: 1003,
            userId: "123123",
            roomSecret: 'sdfsdfd',
            adminSecret: 'hw2cxiuya25cf',
            mqttConfig: null,
            messager: null,

            microphoneSwitch: true, // 麦克风开关
            drawingBorad: null,

            initHeight: 0,
            initWidth: 0,
            boardHeight: 0,
            boardWidth: 0,
            whiteboard: null,
            pencilbarActive: 1,
        }
    },

    async created() {
        this.camera = new FlipCamera();
        let mediaStream = await this.camera.open();
        let stream = new LiveRTCStream(mediaStream);
        stream.play("video");
        this.stream = stream;
    },

    mounted() {
        this.whiteboard = new Whiteboard('canvas');
        this.whiteboard.init();

        // let rect = new fabric.Rect({
        //     top: 0,
        //     left: 0,
        //     width: 100,
        //     height: 70,
        //     fill: 'red'
        // });
        // this.canvas.add(rect);

        this.setBoardSize();
        window.onresize = () => {
            this.setBoardSize();
        }


        this.startRtc();
        // this.getMqttConfig();

    },

    methods: {
        setBoardSize() {
            let outerWidth = this.$refs.companyStyle.offsetWidth;
            let outerHeight = this.$refs.companyStyle.offsetHeight;

            let outerRatio = outerWidth / outerHeight;

            if (outerRatio >= 16 / 9) {
                this.boardHeight = outerHeight;
                this.boardWidth = (16 / 9) * outerHeight;
            } else {
                this.boardWidth = outerWidth;
                this.boardHeight = outerWidth / (16 / 9);
            }

            if (this.initHeight === 0) {
                this.initHeight = this.boardHeight;
                this.initWidth = this.boardWidth;
            }

            this.whiteboard.setZoom(this.boardWidth / this.initWidth);
            this.whiteboard.setSize(this.boardWidth, this.boardHeight);
        },

        changePencilbar(number) {
            if (number === 1) {
                this.whiteboard.setDrawType(this.whiteboard.CHOOSE);
            } else if (number === 2) {
                this.whiteboard.setDrawType(this.whiteboard.PAN);
            } else if (number === 3) {
                this.whiteboard.setDrawType(this.whiteboard.ELLIPSE);
            } else if (number === 4) {
                this.whiteboard.setDrawType(this.whiteboard.RECTANGLE);
            } else if (number === 5) {
                this.whiteboard.setDrawType(this.whiteboard.ARROW);
            } else if (number === 6) {
                this.whiteboard.setDrawType(this.whiteboard.FONT);
            } else if (number === 7) {
                this.whiteboard.setDrawType(this.whiteboard.REMOVE);
            }
            this.pencilbarActive = number;
        },

        async getMqttConfig() {
            let mqttConfig = await api.mqttConfig(this.schoolId, this.roomId, this.userId);
            this.mqttConfig = mqttConfig;

            this.initMqtt();
        },

        initMqtt() {
            let messager = new Messager(this.mqttConfig);
            this.messager = messager;

            messager.connect();

            messager.on("message", (message) => {
                switch (message.cmd) {
                    default:
                        console.log("未知消息", message);
                }
            });
        },

        async startRtc() {
            let rtc = new LiveRTCClient({
                debug: false,
                server: "//" + "192.168.200.51" + ":8088/janus",
            });
            this.rtc = rtc;

            try {
                await rtc.init();
            } catch (error) {
                console.error(error)
                return;
            }

            try {
                let exists = await rtc.existsRoom(this.roomId);

                if (exists.exists === true) {
                    await rtc.destroyRoom({
                        roomId: this.roomId,
                        roomSecret: this.roomSecret,
                    });
                }

                await rtc.createRoom({
                    roomId: this.roomId,
                    roomSecret: this.roomSecret,
                    adminSecret: this.adminSecret,
                });
            } catch (error) {
                console.error(error)
                return;
            }

            rtc.on("joined", () => {
                this.publish();
            });

            rtc.on("stream-published", async () => {
                let payloadType = rtc.getPayloadType();

                let forwardStarted
                try {
                    forwardStarted = await api.startForward({
                        roomId: this.roomId,
                        streamId: "11",
                        audioPt: payloadType.audioPt,
                        videoPt: payloadType.videoPt,
                        rtmp: "rtmp://127.0.0.1/live/room",
                    });
                } catch (error) {
                    console.error(error);
                    return;
                }

                try {
                    await rtc.forward({
                        roomId: this.roomId,
                        audioPort: forwardStarted.audioPort,
                        videoPort: forwardStarted.videoPort,
                        roomSecret: this.roomSecret,
                        adminSecret: this.adminSecret,
                    });
                } catch (error) {
                    console.error(error);
                }
            });

            rtc.join(null, this.roomId, this.userId);
        },

        publish() {
            this.rtc.publish(this.stream);
        },

        onClickStart() {
        },

        onSwitchMicrophone() {
            if (this.microphoneSwitch) {
                this.rtc.muteAudio();
                this.microphoneSwitch = false;
            } else {
                this.rtc.unmuteAudio();
                this.microphoneSwitch = true;
            }
        },

        onBoardClear() {
            this.drawingBorad.reSetCanvas()
            this.messager.sendSecondaryMessage("test", {
                type: "clear",
            })
        },
    }
}
</script>

<style lang="less">


</style>
