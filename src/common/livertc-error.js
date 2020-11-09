export default class LiveRTCError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'LiveRTCError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
