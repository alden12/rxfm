const path = require('path');
const webpackRxjsExternals = require('webpack-rxjs-externals');

module.exports = [
  {
    mode: "production",
    devtool: "source-map",
    entry: "./src/lib/index.ts",
    output: {
      filename: 'index.js',
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
          exclude: '/node_modules/',
          options: {
            configFile: "tsconfig.prod.json"
          }
        },
      ]
    },
    externals: [
      webpackRxjsExternals(),
    ],
  }
];
