const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { spawn } = require("child_process");

const SRC_DIR = path.resolve(__dirname, "src");
const OUTPUT_DIR = path.resolve(__dirname, "dist");
const defaultInclude = [SRC_DIR];

let electronStarted = false; // prevent multiple spawns on HMR

module.exports = {
  entry: SRC_DIR + "/index.js",
  output: {
    path: OUTPUT_DIR,
    publicPath: "/",
    filename: "bundle.js",
    assetModuleFilename: "assets/[hash][ext][query]",
  },
  mode: "development",
  module: {
    rules: [
      { test: /\.css$/, use: ["style-loader", "css-loader"], include: [defaultInclude, /node_modules/] },
      { test: /\.scss$/, use: ["style-loader", "css-loader", "sass-loader"], include: defaultInclude },
      { test: /\.jsx?$/, use: ["babel-loader", "shebang-loader"] },
      {
        test: /\.(jpe?g|png|gif)$/,
        type: "asset/resource",
        generator: { filename: "img/[name]__[hash:5][ext]" },
        include: defaultInclude,
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        type: "asset/resource",
        generator: { filename: "font/[name]__[hash:5][ext]" },
        include: [/node_modules/, SRC_DIR],
      },
    ],
  },
  target: "electron-renderer",
  plugins: [
    new HtmlWebpackPlugin({ title: "HARDWARIO Playground v" + process.env.npm_package_version }),
    new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("development") }),
  ],
  devtool: "cheap-source-map",
  devServer: {
    static: { directory: OUTPUT_DIR },
    // optional niceties:
    // hot: true,
    // client: { overlay: true },
    onListening(devServer) {
      if (electronStarted) return;
      if (!devServer) throw new Error("webpack-dev-server is not defined");

      electronStarted = true;
      spawn("electron", ["."], { shell: true, env: process.env, stdio: "inherit" })
        .on("close", () => process.exit(0))
        .on("error", (err) => console.error(err));
    },
  },
};
