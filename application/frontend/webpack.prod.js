const {merge} = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const common = require('./webpack.common.js');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: ['default', {
                        calc: true,
                        convertValues: true,
                        discardComments: {
                            removeAll: true
                        },
                        discardDuplicates: true,
                        discardEmpty: true,
                        mergeRules: true,
                        normalizeCharset: true,
                        reduceInitial: true, // This is since IE11 does not support the value Initial
                        svgo: true
                    }],
                }
            }),
        ],
        splitChunks: {
            cacheGroups: {
                main: {
                    chunks: 'all',
                    name: 'site',
                    test: 'main',
                    enforce: true
                }
            }
        }
    },
    performance: {hints: false},
    plugins: [
        new FileManagerPlugin({
            events: {
                onEnd: {
                    copy: [
                        {
                            source: path.join(__dirname, 'dist/main'),
                            destination: path.join(__dirname, 'src/main/resources/apps/typerefinery/webroot')
                        },
                        {
                            source: path.join(__dirname, 'src/static'),
                            destination: path.join(__dirname, 'src/main/resources/apps/typerefinery')
                        }
                    ]
                }
            }
        })
    ],    
});
