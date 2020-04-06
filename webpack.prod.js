const path = require('path');
const webpackRxjsExternals = require('webpack-rxjs-externals');

module.exports = [
  {
    mode: "production",
    devtool: "source-map",
    entry: "./src/index.ts",
    output: {
      filename: 'index.umd.js',
      path: path.resolve(__dirname, 'dist'),
      library: "rxfm",
      libraryTarget: 'umd',
    },
    resolve: {
      extensions: [".ts", ".js", ".json"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
          exclude: '/node_modules/'
        },
      ]
    },
    externals: [
      webpackRxjsExternals(),
    ],
  }
];