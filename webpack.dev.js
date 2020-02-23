const path = require('path');
// import webpackRxjsExternals from 'webpack-rxjs-externals';
const webpackRxjsExternals = require('webpack-rxjs-externals');

module.exports = [
  {
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
      contentBase: path.join(__dirname, "dist"),
      port: 3000,
      compress: true
    },
    entry: './src/app/app.ts',
    output: {
      filename: 'app.bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      extensions: [".ts", ".js", ".json"]
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
          exclude: '/node_modules/'
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
          exclude: '/node_modules/'
        },
      ]
    }
  },
  {
    mode: "development",
    devtool: "inline-source-map",
    optimization: {
      runtimeChunk: true
    },
    entry: "./src/rxfm/index.ts",
    output: {
      filename: 'rxfm.js',
      path: path.resolve(__dirname, 'dist'),
      library: "rxfm",
    },
    resolve: {
      extensions: [".ts", ".js", ".json"]
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