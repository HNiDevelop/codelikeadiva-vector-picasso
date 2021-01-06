const { NormalModuleReplacementPlugin } = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const projectSettings = require('./project.settings.js');
const express = require('express');

const pluginHtml = new HtmlWebpackPlugin({
  template: './src/index.html',
  filename: 'index.html',
  title: `${projectSettings.title} | vol. ${projectSettings.vol}`,
  pageTitle: projectSettings.title,
  challengeTitle: `[vol. ${projectSettings.vol}] "${projectSettings.subtitle}"`,
});

const pluginExtractSass = new ExtractTextPlugin({
  filename: '[name].css'
});

const pluginNormalModuleReplacement = new NormalModuleReplacementPlugin(/\/iconv-loader$/, 'node-noop');


module.exports = {
  entry: [
    './src/js/index',
    './src/scss/index.scss'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'challenge.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            ["env", {
              "targets": {
                "browsers": ["last 2 versions"]
              }
            }]
          ],
        }
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader'
            }, {
              loader: 'sass-loader',
              options: {
                includePaths: [
                  path.resolve(__dirname, './src/scss')
                ]
              }
            }
          ],
          fallback: 'style-loader'
        })
      },
    ]
  },
  plugins: [
    pluginHtml,
    pluginExtractSass,
    pluginNormalModuleReplacement
  ],
  devServer: {
    contentBase: './dist',
    setup(app) {
      app.use('/api',
        express.static(path.resolve(__dirname, './src/public/data/'))
      )
    }
  },
};
