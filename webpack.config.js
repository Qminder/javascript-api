/**
 * API V2 Build Process:
 * 1. Replace 'VERSION' throughout the project with package.json version - DefinePlugin
 * 2. Replace 'ENV' in import filenames with the current environment (node/web) -
 *    NormalModuleReplacementPlugin. Used to hotswap websockets & fetch polyfills
 * 3. Traverse the dep graph - include all files imported. For node.js, make sure to not include
 *    node packages (ws, node-fetch) in the bundle.
 * 4. Strip Flow.js types, compile ES2017 to ES5, concat and minify to produce one JS bundle.
 *    For node.js, skip the minification step.
 */

const path = require('path');
const webpack = require('webpack');
const FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const uglify = new UglifyJsPlugin({
  include: /\.min\.js$/,
  sourceMap: true,
  minimize: true,
});

const versionDefinition = new webpack.DefinePlugin({
  VERSION: JSON.stringify(require('./package.json').version),
});

module.exports = function() {

  const moduleReplacements = new webpack.NormalModuleReplacementPlugin(/(.*)-ENV/, function (resource) {
    resource.request = resource.request.replace(/-ENV/, '-web');
  });

  return ({
    target: 'web',
    entry: {
      'qminder-api.min': ['es6-promise', 'whatwg-fetch', './src/qminder-api.js'],
      'qminder-api': ['es6-promise', 'whatwg-fetch', './src/qminder-api.js'],
    },

    output: {
      path: path.resolve(__dirname, 'build-web'),
      filename: '[name].js',
      library: 'Qminder',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },

    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }]
    },

    stats: {
      colors: true
    },

    resolve: {
      modules: [
        path.resolve('./node_modules'),
        path.resolve('./src'),
      ],
      extensions: ['.js'],
    },

    devtool: 'source-map',
    plugins: [
      versionDefinition,
      moduleReplacements,
      new FlowBabelWebpackPlugin(),
      uglify
    ],
  });
};
