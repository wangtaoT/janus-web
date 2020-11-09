class LiveRTCStream {
    constructor(mediaStream) {
        this.mediaStream = mediaStream;
    }

    play(elId) {
        let el = document.getElementById(elId);
        el.srcObject = this.mediaStream;
        el.onloadedmetadata = function () {
            el.play();
        };
    }

    stop() {
        this.getTracks().forEach(function (track) {
            track.stop();
        });
        this.mediaStream = null;
    }

    getTracks() {
        return this.mediaStream.getTracks();
    }

    getMediaStream() {
        return this.mediaStream;
    }
}

export default LiveRTCStream;
