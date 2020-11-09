const webpack = require('webpack');
// vue.config.js
module.exports = {
    devServer: {
        disableHostCheck: true,
        inline: false,
        hot: false,
        liveReload: false,
        // public: 'lilei.mynatapp.cc',
        injectClient: false,
        injectHot: false,
        port: 8081,
        proxy: {
            '/api/dev': {
                target: 'http://127.0.0.1:8080',
            },
            '/api/rtcforward': {
                target: 'http://127.0.0.1:8288',
            },
        }
    },
    configureWebpack: {
        plugins: [
            new webpack.ProvidePlugin({adapter: 'webrtc-adapter'}),
        ],
        module: {
            rules: [
                // janus.js does not use 'export' to provide its functionality to others, instead
                // it creates a global variable called 'Janus' and expects consumers to use it.
                // Let's use 'exports-loader' to simulate it uses 'export'.
                {
                    test: require.resolve('janus-gateway'),
                    loader: 'exports-loader',
                    options: {
                        exports: 'Janus',
                    },
                }
            ]
        }
    },
    chainWebpack(config) {
        config.plugins.delete('preload')
    }
}
