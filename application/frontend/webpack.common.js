'use strict';

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TSConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const SOURCE_ROOT = __dirname + '/src';
const OUTPUT_ROOT = __dirname + '/src/main/resources/webroot';

const resolve = {
    extensions: ['.js', '.ts'],
    plugins: [new TSConfigPathsPlugin({
        configFile: './tsconfig.json'
    })]
};

module.exports = {
    resolve: resolve,
    entry: {
        main: { import: SOURCE_ROOT + '/main.ts', filename: 'main/main.js' },
    },
    output: {
        filename: (chunkData) => {
            return chunkData.chunk.name === 'dependencies' ? 'dependencies/[name].js' : '[name].js';
        },
        path: path.resolve(__dirname, 'dist')
    },
    externals: {
        bootstrap: "bootstrap",
        jquery: "jQuery",
        popperjs: "@popperjs/core"

    },
    // externals: Object.keys(require('./package.json').dependencies)
    //     .reduce(
    //         function (acc, cur) {
    //             acc[cur] = cur
    //             return acc
    //         },
    //         new Object()
    //     ), 
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    },
                    {
                        loader: 'glob-import-loader',
                        options: {
                            resolve: resolve
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            url: false
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins() {
                                return [
                                    require('autoprefixer')
                                ];
                            }
                        }
                    },
                    {
                        loader: 'sass-loader',
                    },
                    {
                        loader: 'glob-import-loader',
                        options: {
                            resolve: resolve
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new ESLintPlugin({
            extensions: ['js', 'ts', 'tsx']
        }),
        new MiniCssExtractPlugin({
            filename: '[name]/[name].css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, SOURCE_ROOT + '/resources'), to: './main' }
            ]
        }),
    ],
    stats: {
        assetsSort: 'chunks',
        builtAt: true,
        children: false,
        chunkGroups: true,
        chunkOrigins: true,
        colors: false,
        errors: true,
        errorDetails: true,
        env: true,
        modules: false,
        performance: true,
        providedExports: false,
        source: false,
        warnings: true
    }
};
