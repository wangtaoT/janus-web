import {Janus} from 'janus-gateway';
import {TinyEmitter} from 'tiny-emitter';
import SdpParser from "./sdp-parser";
import LiveRTCError from "./livertc-error";
import TimeQueue from "./time-queue";

let opaqueId = Janus.randomString(12);
let feeds = [];

class LiveRTCClient {
    constructor(config) {
        this.roomId = null;
        this.publisherId = null;
        this.pvtid = null;
        this.janus = null;
        this.room = null;
        this.sdp = null;
        this.config = config;
        this.emitter = new TinyEmitter();
        this.packetLossQueue = new TimeQueue();
    }

    init() {
        return new Promise((resolve, reject) => {
            Janus.init({
                debug: this.config.debug,
                callback: async () => {
                    let server = this.config.server;
                    console.log("[:: RTC ::] rtc server", server);

                    let janus = this.janus = new Janus({
                        server: server,
                        success: () => {
                            janus.attach({
                                plugin: "janus.plugin.videoroom",
                                opaqueId: opaqueId,
                                success: (room) => {
                                    console.log("[:: RTC ::] init success");
                                    this.room = room;
                                    resolve();
                                },
                                error: (cause) => {
                                    console.error("[:: RTC ::] init attach error", cause);
                                },
                                iceState: (state) => {
                                    console.log("[:: RTC ::] ICE state changed to " + state);
                                },
                                mediaState: (medium, on) => {
                                    console.log("[:: RTC ::] Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
                                },
                                webrtcState: (on) => {
                                    console.log("[:: RTC ::] Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                                },
                                slowLink: (uplink, lost) => {
                                    console.warn("[:: RTC ::] Janus reports problems " + (uplink ? "sending" : "receiving") +
                                        " packets on this PeerConnection (" + lost + " lost packets)");
                                    this.packetLossQueue.push(lost);
                                },
                                onmessage: (msg, jsep) => {
                                    console.log("[:: RTC ::] received message", msg, jsep);
                                    let event = msg['videoroom'];
                                    if (event) {
                                        if (event === 'joined') {
                                            this.roomId = msg['room'];
                                            this.publisherId = msg['id'];
                                            this.pvtid = msg['private_id'],
                                                this.emit('joined', {
                                                    roomId: msg['room'],
                                                    publisherId: msg['id'],
                                                    privatePublisherId: msg['private_id'],
                                                });
                                            if (msg["publishers"]) {
                                                let list = msg["publishers"];
                                                console.log("Got a list of available publishers/feeds:", list);
                                                for (let f in list) {
                                                    let id = list[f]["id"];
                                                    let display = list[f]["display"];
                                                    let audio = list[f]["audio_codec"];
                                                    let video = list[f]["video_codec"];
                                                    console.log("[:: RTC ::] publishers", "  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                                    this.newRemoteFeed(id, display, audio, video);
                                                }
                                            }
                                        } else if (event === "event") {
                                            if (msg['configured'] && msg['configured'] === 'ok') {
                                                if (jsep.sdp) {
                                                    this.sdp = jsep.sdp;
                                                }

                                                this.emit('stream-published', {
                                                    roomId: msg['room'],
                                                });
                                            } else if (msg['unpublished'] && msg['unpublished'] === 'ok') {
                                                this.room.hangup();
                                                console.warn("[:: RTC ::] hangup");
                                                this.emit('stream-unpublished');
                                            }
                                        }
                                    }

                                    if (jsep) {
                                        console.log("[:: RTC ::] handle remote jsep", jsep);
                                        this.room.handleRemoteJsep({jsep: jsep});
                                    }
                                },
                                oncleanup: () => {
                                    console.warn("[:: RTC ::] on clean up");
                                },
                                onlocalstream: () => {
                                    console.log("[:: RTC ::] onlocalstream!!!!!!!");
                                },
                            });
                        },
                        error: (cause) => {
                            console.error("[:: RTC ::] init error", cause);
                            reject(new LiveRTCError(cause, "rtc_init_failed"));
                        },
                    });
                }
            });
        });
    }

    join(token, rid, uid) {
        let message = {
            request: "join",
            room: rid,
            ptype: "publisher",
            display: "uid-" + uid,
        };

        console.log("[:: RTC ::] join room", message);

        this.room.send({message: message});
    }

    leave() {
        let message = {
            request: "leave",
        };

        console.log("[:: RTC ::] leave room", message);

        this.room.send({message: message});
    }

    publish(stream) {
        return new Promise((resolve, reject) => {
            console.log("[:: RTC ::] publish stream", stream);

            this.room.createOffer({
                stream: stream.getMediaStream(),
                success: (jsep) => {
                    console.log("[:: RTC ::] publish stream success", jsep);
                    let message = {
                        request: "configure",
                        audio: true,
                        video: true,
                        audiocodec: "opus",
                        videocodec: "h264"
                    };
                    this.room.send({message: message, jsep: jsep});
                    this.packetLossQueue.clear();
                    resolve(jsep);
                },
                error: (error) => {
                    console.log("[:: RTC ::] publish stream error", error);
                    reject(error);
                }
            })
        });
    }

    unpublish() {
        this.room.send({
            message: {request: "unpublish"}
        });
    }

    muteAudio() {
        this.room.muteAudio();
    }

    unmuteAudio() {
        this.room.unmuteAudio();
    }

    getBitrate() {
        return this.room.getBitrate();
    }

    getLostPackets(timeGT) {
        return this.packetLossQueue.sum(timeGT);
    }

    getPayloadType() {
        let sdp = SdpParser.parse(this.sdp);
        return {
            audioPt: sdp.audioPt,
            videoPt: sdp.videoPt,
        };
    }

    forward(options) {
        return new Promise((resolve, reject) => {
            let sdp = SdpParser.parse(this.sdp);
            let message = {
                "request": "rtp_forward",
                "room": options.roomId,
                "publisher_id": this.publisherId,
                "audiopt": sdp.audioPt,
                "videopt": sdp.videoPt,
                "audio_port": options.audioPort,
                "video_port": options.videoPort,
                "host": "127.0.0.1",
                "secret": options.roomSecret,
                "admin_key": options.adminSecret,
            };

            console.log("[:: RTC ::] invoke api (forward)", message);

            this.room.send({
                message: message,
                success: function (data) {
                    if (data.error) {
                        console.error("[:: RTC ::] invoke api (forward) success", data);
                        reject(new LiveRTCError(data.error, data.error_code));
                    } else {
                        console.log("[:: RTC ::] invoke api (forward) success", data);
                        resolve(data);
                    }
                },
                error: function (error) {
                    console.error("[:: RTC ::] invoke api (forward) success", error);
                    reject(new LiveRTCError(error, "rtc_forward_api_failed"));
                }
            });
        });
    }

    createRoom(options) {
        return new Promise((resolve, reject) => {
            let message = {
                "request": "create",
                "room": options.roomId,
                "permanent": false,
                "secret": options.roomSecret,
                "is_private": true,
                "publishers": 2,
                "bitrate": 1024000,
                "bitrate_cap": true,
                "fir_freq": 1,
                "audiocodec": "opus",
                "videocodec": "h264",
                "admin_key": options.adminSecret,
            }

            console.log("[:: RTC ::] invoke api (createRoom)", message);
            this.room.send({
                message: message,
                success: function (data) {
                    if (data.error) {
                        console.error("[:: RTC ::] invoke api (createRoom) error", data);
                        reject(new LiveRTCError(data.error, data.error_code));
                    } else {
                        console.log("[:: RTC ::] invoke api (createRoom) success", data);
                        resolve(data);
                    }
                },
                error: function (error) {
                    console.error("[:: RTC ::] invoke api (createRoom) error", error);
                    reject(new LiveRTCError(error, "rtc_create_api_failed"));
                }
            });
        });
    }

    existsRoom(roomId) {
        return new Promise((resolve, reject) => {
            let message = {
                "request": "exists",
                "room": roomId,
            }
            console.log("[:: RTC ::] invoke api (existsRoom)", message);

            this.room.send({
                message: message,
                success: function (data) {
                    if (data.error) {
                        console.error("[:: RTC ::] invoke api (existsRoom)` error", data);
                        reject(new LiveRTCError(data.error, data.error_code));
                    } else {
                        console.log("[:: RTC ::] invoke api (existsRoom) success", data);
                        resolve(data);
                    }
                },
                error: function (error) {
                    console.error("[:: RTC ::] invoke api (existsRoom) error", error);
                    reject(new LiveRTCError(error, "rtc_exists_api_failed"));
                }
            });
        });
    }

    destroyRoom(options) {
        return new Promise((resolve, reject) => {
            let message = {
                "request": "destroy",
                "room": options.roomId,
                "secret": options.roomSecret,
                "permanent": false,
            }

            console.log("[:: RTC ::] invoke api (destroyRoom)", message);

            this.room.send({
                message: message,
                success: function (data) {
                    if (data.error) {
                        console.error("[:: RTC ::] invoke api (destroyRoom) error", data);
                        reject(new LiveRTCError(data.error, data.error_code));
                    } else {
                        console.log("[:: RTC ::] invoke api (destroyRoom) success", data);
                        resolve(data);
                    }
                },
                error: function (error) {
                    console.error("[:: RTC ::] invoke api (destroyRoom) error", error);
                    reject(new LiveRTCError(error, "rtc_destory_api_failed"));
                }
            });
        });
    }

    on(event, callback) {
        this.emitter.on(event, callback);
    }

    emit(event, args) {
        console.log("[:: RTC ::] emit event (****** " + event + " ******)", args);
        this.emitter.emit(event, args);
    }

    newRemoteFeed(id, display, audio, video) {
        console.log("[:: RTC ::] newRemoteFeed");
        let remoteFeed = null;
        this.janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                opaqueId: opaqueId,
                success: pluginHandle => {
                    remoteFeed = pluginHandle;
                    remoteFeed.simulcastStarted = false;
                    let subscribe = {
                        request: "join",
                        room: this.roomId,
                        ptype: "subscriber",
                        feed: id,
                        private_id: this.pvtid
                    };
                    remoteFeed.videoCodec = video;
                    remoteFeed.send({message: subscribe});
                },
                error: function (error) {
                    console.error("  -- Error attaching plugin...", error);
                },
                onmessage: function (msg, jsep) {
                    console.log(" ::: Got a message (subscriber) :::", msg, jsep);
                    let event = msg["videoroom"];
                    if (event) {
                        if (event === "attached") {
                            for (let i = 1; i < 6; i++) {
                                if (!feeds[i]) {
                                    feeds[i] = remoteFeed;
                                    remoteFeed.rfindex = i;
                                    break;
                                }
                            }
                            remoteFeed.rfid = msg["id"];
                            remoteFeed.rfdisplay = msg["display"];
                            console.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
                        }
                    }
                    if (jsep) {
                        console.log("Handling SDP as well...", jsep);
                        remoteFeed.createAnswer(
                            {
                                jsep: jsep,
                                media: {audioSend: false, videoSend: false},
                                success: function (jsep) {
                                    console.log("Got SDP!", jsep);
                                    let body = {request: "start", room: this.roomId};
                                    remoteFeed.send({message: body, jsep: jsep});
                                },
                                error: function (error) {
                                    console.error("WebRTC error:", error);
                                }
                            });
                    }
                },
                onremotestream: stream => {
                    console.log("[:: RTC ::] onremotestream!!!!!!!");
                    this.emit('remoteStream', stream);
                },
                oncleanup: function () {
                    console.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
                    if (remoteFeed.spinner)
                        remoteFeed.spinner.stop();
                    remoteFeed.spinner = null;
                }
            });
    }
}

export default LiveRTCClient;
