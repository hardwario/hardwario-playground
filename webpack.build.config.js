const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Config directories
const SRC_DIR = path.resolve(__dirname, "src");
const OUTPUT_DIR = path.resolve(__dirname, "dist");

// Any directories you will be adding code/files into, need to be added to this array so webpack will pick them up
const defaultInclude = [SRC_DIR];

module.exports = {
    entry: SRC_DIR + "/index.js",
    output: {
        path: OUTPUT_DIR,
        publicPath: "./",
        filename: "bundle.js",
        assetModuleFilename: 'assets/[hash][ext][query]'
    },
    mode: "production",
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
                include: [defaultInclude, /node_modules/]
            },
            {
                test: /\.scss$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
                include: defaultInclude
            },
            {
                test: /\.jsx?$/,
                use: ["babel-loader", "shebang-loader"]
            },
            {
                test: /\.(jpe?g|png|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'img/[name]__[hash:5][ext]'
                },
                include: defaultInclude
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'font/[name]__[hash:5][ext]'
                },
                include: [/node_modules/, SRC_DIR]
            }
        ]
    },
    target: "electron-renderer",
    plugins: [
        new HtmlWebpackPlugin({
            title: "HARDWARIO Playground v" + process.env.npm_package_version
        }),
        new MiniCssExtractPlugin({
            filename: "bundle.css"
        }),
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify("production"),
        })
    ],
    stats: {
        colors: true,
        children: false,
        chunks: false,
        modules: false
    }
};
