const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ProgressPlugin = require('progress-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV,
  entry: path.resolve(__dirname, 'src/app.js'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool: "source-map",
  plugins: [
    new webpack.IgnorePlugin(/^codemirror$/), // hack fix for summernote dependency,
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html')
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new ProgressPlugin(true)
  ],
  module: {
    rules: [
      // JavaScript / ES6
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, 'src/components')],
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      // Less
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'less-loader' }
        ]
      },
      // CSS
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      // Fonts
      {
        test: /\.ttf$/,
        use: [{
          loader: 'ttf-loader',
          options: {
            name: './font/[hash].[ext]',
          },
        }, ]
      },
      // Images
      // Inline base64 URLs for <=8k images, direct URLs for the rest
      {
        test: /\.(png|jpg|jpeg|gif|svg|eot|woff|woff2)$/,
        use: {
          loader: 'url-loader',
          options: {
            include: [
              path.resolve(__dirname, 'public'),
              path.resolve(__dirname, 'src/less')
            ],
            query: {
              limit: 8192,
              name: 'img/[name].[ext]?[hash]'
            }
          }
        }
      }
    ]
  }
};
