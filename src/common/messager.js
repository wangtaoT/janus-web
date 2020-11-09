import { connect } from 'mqtt';
import {TinyEmitter} from 'tiny-emitter';

class Messager {

    constructor(options) {
        this.options = options;
        this.client = null;
        this.reconnecting = false;
        this.emitter = new TinyEmitter();
    }

    connect() {
        console.debug("[:: Messager ::] 开始连接消息服务", o);
        let o = this.options;
        let schema = 'https:' == document.location.protocol ? "wss://": "ws://";
        const client = connect(schema + o.host, {
            clientId: o.clientId,
            username: o.username,
            password: o.password,
            resubscribe: false,
        });

        this.client = client;

        client.on('connect', () => {
            console.debug("[:: Messager ::] 消息服务连接成功");
            this.emitter.emit('connect');

            if (this.reconnecting) {
                this.reconnecting = false;
                this.emitter.emit('reconnected');
            }

            let topics = [o.priRTopic, o.secRTopic];
            client.subscribe(topics, {qos:0},   (err) => {
                if (err) {
                    console.error("[:: Messager ::] 订阅 Topic 失败", err);
                } else {
                    console.debug("[:: Messager ::] 订阅 Topic 成功", topics);
                }
            });
        });

        client.on('message',  (topic, message) => {
            console.debug("[:: Messager ::] 收到消息 ", message.toString(), "来自", topic);

            try {
                message = JSON.parse(message);
            } catch (e) {
                console.error("[:: Messager ::] 消息解析失败", e);
                return ;
            }

            if (Array.isArray(message)) {
                message.forEach((item) => {
                    this.emitter.emit("message", item);
                });
            } else {
                this.emitter.emit("message", message);
            }
        })

        client.on('disconnect', () => {
            console.warn("[:: Messager ::] 消息服务连接已断开");
            this.emitter.emit('disconnect');
        })

        client.on('offline', () => {
            console.warn("[:: Messager ::] 消息服务已离线");
            this.emitter.emit('offline');
        })

        client.on('reconnect', () => {
            console.warn("[:: Messager ::] 正在重新连接消息服务");
            this.reconnecting = true;
            this.emitter.emit('reconnect');
        })

        client.on('close', () => {
            console.warn("[:: Messager ::] 消息服务连接已关闭");
            this.emitter.emit('close');
        })

        client.on('error', (err) => {
            console.error("[:: Messager ::] 消息服务发生错误", err);
            this.emitter.emit('error', err);
        })

        client.on('end', () => {
            console.log("[:: Messager ::] 客户端主动关闭消息服务连接");
            this.emitter.emit('end');
        })
    }

    sendPrimaryMessage(cmd, params) {
        this.sendMessage(cmd, params, true);
    }

    sendSecondaryMessage(cmd, params) {
        this.sendMessage(cmd, params, false);
    }

    sendMessage(cmd, params, isPrimary) {
        let message = {
            ts: new Date().getTime(),
            cmd: cmd,
        }

        if (params) {
            message = Object.assign(message, params);
        }

        let topic = isPrimary === true ? this.options.priWTopic : this.options.secWTopic;

        if (!this.isConnected()) {
            console.warn("[:: Messager ::] 消息服务尚未连接，发送消息失败", message, "TO", topic);
        } else {
            this.client.publish(topic, JSON.stringify(message));
            console.log("[:: Messager ::] 发送消息", message, "TO", topic);
        }
    }

    on(event, callback) {
        this.emitter.on(event, callback);
    }

    isConnected() {
        return this.client && this.client.connected;
    }

    end() {
        if (this.client) {
            this.client.end();
        }
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}

export default Messager;
