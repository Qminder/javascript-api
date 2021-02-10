/**
 * API V2 Build Process:
 * 1. Replace 'VERSION' throughout the project with package.json version - DefinePlugin
 * 2. Replace 'ENV' in import filenames with the current environment (node/web) -
 *    NormalModuleReplacementPlugin. Used to hotswap websockets & fetch polyfills
 * 3. Traverse the dep graph - include all files imported. For node.js, make sure to not include
 *    node packages (ws, node-fetch) in the bundle.
 * 4. Use Typescript compiler before Babel compiler, to get the bundled package.
 */

const path = require('path');
const webpack = require('webpack');
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
  return ({
    target: 'web',
    entry: {
      'qminder-api.min': ['whatwg-fetch', './src/qminder-api.ts'],
      'qminder-api': ['whatwg-fetch', './src/qminder-api.ts'],
    },

    output: {
      path: path.resolve(__dirname, 'build-web'),
      filename: '[name].js',
      library: 'Qminder',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },

    module: {
      rules: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
      ]
    },

    stats: {
      colors: true
    },

    resolve: {
      modules: [
        path.resolve('./node_modules'),
        path.resolve('./src'),
      ],
      extensions: ['.js', '.ts'],
    },

    devtool: 'source-map',
    plugins: [
      versionDefinition,
      uglify
    ],
  });
};
