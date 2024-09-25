const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  target: "web",
  mode: "development",
  devtool: "source-map",
  externals: {
    "graphand-js": "graphand-js",
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
    ],
  },
  entry: {
    main: "./src/index.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.min.js",
    library: {
      name: "rxjs-auth",
      type: "umd",
    },
    globalObject: "this",
  },
  watch: !!parseInt(process.env.WATCH),
  watchOptions: {
    ignored: [path.resolve(__dirname, "node_modules"), path.resolve(__dirname, "docs"), path.resolve(__dirname, "dist")],
  },
};
