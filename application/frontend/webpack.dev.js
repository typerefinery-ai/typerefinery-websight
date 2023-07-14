const {merge} = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const common = require('./webpack.common.js');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = merge(common, {
    mode: 'development',
    plugins: [
    //     new FileManagerPlugin({
    //         events: {
    //             onEnd: {
    //                 copy: [
    //                     {
    //                         source: path.join(__dirname, 'src/index.html'),
    //                         destination: path.join(__dirname, 'src/main/resources/index.html')
    //                     }
    //                 ]
    //             }
    //         }
    //     })
        new HtmlWebpackPlugin({
            template: path.join(__dirname,'src/html','index.html') ,
            filename:'index.html'
        })
    ],
    devServer: {
        static: [
            {
                directory: path.resolve(__dirname, 'src/static'),
                publicPath: '/',
                serveIndex: true,
            },
            {
                directory: path.resolve(__dirname, 'assets'),
                publicPath: '/assets',
                serveIndex: true,
            }
        ],
        port: 8999,
        hot: true,
        liveReload:true,
        // devMiddleware: {
        //     // index: true,
        //     // mimeTypes: { phtml: 'text/html' },
        //     // publicPath: '/dist',
        //     // serverSideRender: true,
        //     writeToDisk: true,
        // },
        watchFiles: ['src/static/*.html', 'src/static/**/*', 'src/resources/**/*'],
      }
});
