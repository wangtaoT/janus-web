class FlipCamera {

    constructor(persistent = true) {
        this.persistent = persistent;
        this.cameraList = [];
    }

    async open(audio = true) {
        let pos = "front";
        let constraints = await this._getCameraConstraints(pos, audio);

        console.debug("[:: FlipCamera ::]] open camera constraints", constraints);

        return navigator.mediaDevices.getUserMedia(constraints);
    }

    async _getCameraConstraints(position, audio = true) {
        position = position === "back" ? "back" : "front";

        return new Promise((resolve) => {
            let facingMode = position === "front" ? "user" : "environment";
            resolve({audio: audio, video: {facingMode: facingMode}});
        });
    }
}

export default FlipCamera;
