import axios from "axios";

const http = axios.create({
    baseURL: '/api/dev',
})

const http_test = axios.create({
    baseURL: '/api/rtcforward',
})

function getConfig(params) {
    return {
        headers: {
            'Content-Type': 'application/json',
        },
        params: params,
    }
}

function convertError(e) {
    let result;
    if (e.response.data.code) {
        result = e.response.data;
    } else {
        result = {
            code: "unknown_error",
            message: e.response.statusText,
            status: e.response.status,
        }
    }

    return result;
}

export default {
    mqttConfig: (schoolId, roomId, userId) => {
        return new Promise((resolve, reject) => {
            http.get("/mqttConfig", getConfig({
                schoolId: schoolId,
                roomId: roomId,
                userId: userId,
            }))
                .then(function (response) {
                    console.debug("[:: API ::] invoke success", response.data);
                    resolve(response.data);
                })
                .catch(function (error) {
                    console.error("[:: API ::] invoke error", error);
                    reject(convertError(error));
                });
        });
    },

    startForward: (params) => {
        return new Promise((resolve, reject) => {
            http_test.post("/start", params)
                .then(function (response) {
                    console.debug("[:: API ::] invoke success", response.data);
                    resolve(response.data);
                })
                .catch(function (error) {
                    console.error("[:: API ::] invoke error", error);
                    reject(convertError(error));
                });
        });
    },
}
