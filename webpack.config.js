const webpack = require('webpack');
const path = require('path');
const ProgressPlugin = require('progress-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: ["babel-polyfill", path.resolve(__dirname, 'src/app.js')],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool: 'source-map',
  plugins: [
    new webpack.IgnorePlugin(/^codemirror$/), // hack fix for summernote dependency,
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/app.html'),
      filename: 'app.html'
    }),
    new ProgressPlugin(true),
    new CleanWebpackPlugin(path.resolve(__dirname, 'dist')),
    new CopyWebpackPlugin([{
        from: path.resolve(__dirname, 'frontend'),
        to: path.resolve(__dirname, 'dist/frontend'),
        toType: 'dir'
      },
      {
        from: path.resolve(__dirname, 'frontend/index.html'),
        to: path.resolve(__dirname, 'dist/index.html'),
        toType: 'file'
      },
    ])
  ],
  module: {
    rules: [
      // JavaScript / ES6
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  shippedProposals: true,
                  targets: {
                    browsers: ['>2%']
                  }
                }]
              ]
            }
          },
          {
            loader: 'eslint-loader'
          }
        ]
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
      // HTML
      {
        test: /\.html$/,
        exclude: [
          /node_modules/,
          path.resolve(__dirname, 'src/app.html')
        ],
        use: [{
          loader: 'file-loader',
          query: {
            publicPath: '/'
          }
        }]
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
