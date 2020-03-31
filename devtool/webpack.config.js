'use strict';

const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const SRC_DIR = path.resolve(__dirname, './src')
const OUT_DIR = path.resolve(__dirname, './build')

const common = {
  entry: {
    contentScript: `${SRC_DIR}/contentScript.ts`,
    background: `${SRC_DIR}/background.ts`,
  },
  output: {
    path: OUT_DIR,
    filename: '[name].js',
  },
  devtool: 'source-map',
  stats: {
    all: false,
    errors: true,
    builtAt: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'images',
              name: '[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: '**/*',
        context: 'public',
      },
    ]),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
};

module.exports = common;
