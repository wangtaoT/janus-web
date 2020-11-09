<template>
  <div class="room room-student">
    <div class="room-student-left">
      <div class="room-title">
        标题
      </div>
      <div class="room-reveal">
        <div id="reveal-content" class="room-reveal__content">
          <canvas id="drawing-board" class="room-board"></canvas>
        </div>
      </div>
    </div>

    <div class="room-teacher-right">
<!--      <video-->
<!--          id="video"-->
<!--          ref="video"-->
<!--          class="room-video"-->
<!--          x-webkit-airplay="allow"-->
<!--          webkit-playsinline-->
<!--          playsinline-->
<!--          x5-video-player-type="h5-page"-->
<!--          x5-video-orientation="portrait"-->
<!--          preload="metadata"-->
<!--          controlslist="nofullscreen nodownload noremote footbar"-->
<!--          oncontextmenu="return false;"-->
<!--          muted/>-->

      <canvas id="container" width="200" height="200" class="room-video"></canvas>

    </div>
  </div>
</template>

<script>
import LiveRTCClient from "@/common/livertc-client";
import ShowBorad from "@/common/show-borad";
import api from "@/common/api";
import Messager from "@/common/messager";
import "@/../public/example/index"

export default {
  name: 'Student',
  data() {
    return {
      rtc: null,
      schoolId: 1,
      roomId: 1003,
      userId: "1234",
      roomSecret: 'sdfsdfd',
      adminSecret: 'hw2cxiuya25cf',
      mqttConfig: null,
      messager: null,

      showBorad: null,

      videoCanvas: null,
    }
  },

  async created() {

  },

  mounted() {
    // this.startRtc();
    this.getMqttConfig();

    this.showBorad = new ShowBorad({
      id: 'drawing-board',
      width: 800,
      height: 500,
    });

    this.initPlayer();
  },

  methods: {
    async getMqttConfig() {
      let mqttConfig = await api.mqttConfig(this.schoolId, this.roomId, this.userId);
      this.mqttConfig = mqttConfig;
      console.log("mqtt!!!!", mqttConfig);

      this.initMqtt();
    },

    initMqtt() {
      let messager = new Messager(this.mqttConfig);
      this.messager = messager;

      messager.connect();

      messager.on("message", (message) => {
        switch (message.type) {
          case "line":
            console.log("画笔消息！！！！", message);
            this.showBorad.setLintPoints(message.points);
            break;
          case "clear":
            this.showBorad.reSetCanvas()
            break;
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

      rtc.on("joined", () => {

      });

      rtc.on("remoteStream", stream => {
        let el = document.getElementById('video');
        el.srcObject = stream;
        document.body.addEventListener("mousemove", function () {
          el.play()
        })
      });

      rtc.join(null, this.roomId, this.userId);
    },

    initPlayer() {
      this.videoCanvas = document.getElementById('container');
      if (WXInlinePlayer.isSupport()) {
        WXInlinePlayer.init({
          asmUrl: './example/prod.all.asm.combine.js',
          wasmUrl: './example/prod.all.wasm.combine.js'
        });

        WXInlinePlayer.ready().then(() => {
          let player = new WXInlinePlayer({
            url: 'http://localhost:1980/live/room/live.flv',
            $container: this.videoCanvas,
            hasVideo: true,
            hasAudio: true,
            volume: 1.0,
            muted: false,
            autoplay: true,
            loop: true,
            isLive: true,
            chunkSize: 128 * 1024,
            preloadTime: 5e2,
            bufferingTime: 1e3,
            cacheSegmentCount: 64,
          });

          player.on("loadError", (e) => {
            console.log("loadError", e);
          });
          player.on("loadSuccess", () => {
            console.log("loadSuccess");
          });

          player.on("play", () => {
            console.log("状态: 开播了")
          });
          player.on("buffering", () => {
            console.log("状态: 加载中")
          });
          player.on("playing", () => {
            console.log("状态: 播放中")
          });
          player.on("paused", () => {
            console.log("状态: 已暂停")
          });
          player.on("stopped", () => {
            console.log("状态: 已停止")
          });
          player.on("end", () => {
            console.log("状态: 已放完")
          });
          player.on("mediaInfo", (mediaInfo) => {
            console.log("mediaInfo", mediaInfo);
            const { onMetaData } = mediaInfo;
            //注意：这里是指定绘制的真实分辨率。若要让canvas拉伸填满指定的高宽，则由css的style.width和style.height决定。
            this.videoCanvas.height = onMetaData.height || 200;
            this.videoCanvas.width = onMetaData.width || 200;
            for (let i = 0; i < onMetaData.length; i++) {
              if ("height" in onMetaData[i]) {
                this.videoCanvas.height = onMetaData[i].height;
              } else if ("width" in onMetaData[i]) {
                this.videoCanvas.width = onMetaData[i].width;
              }
            }
          });

          document.body.addEventListener('click', ()=>{
            player.play();
          });
        });
      }
    }
  }
}
</script>

<style lang="less">

.room-student {
  display: -webkit-flex;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;

  &-left {
    flex-grow: 2;
    display: -webkit-flex;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #fff;
  }

  &-right {
  }
}

.room-panel-left {
  flex-grow: 2;
}

.room-panel-right {

}
</style>
