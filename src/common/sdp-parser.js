
class SdpParser {

    static parse(sdp) {
        let parsed = {};
        let pattern = /a=rtpmap:(\d+) h264.*/i;
        let matched = pattern.exec(sdp);
        if (matched) {
            parsed.videoPt = matched[1];
        }

        pattern = /a=rtpmap:(\d+) opus.*/i;
        matched = pattern.exec(sdp);
        if (matched) {
            parsed.audioPt = matched[1];
        }

        return parsed;
    }
}

export default SdpParser;
