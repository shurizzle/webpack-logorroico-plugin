import webpack from 'webpack';
import path from 'path';
import LogorroicoPlugin from '../../src';

module.exports = {
  devServer: {
    hot: true,
  },
  target: 'web',
  context: `${__dirname}/..`,
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    'babel-polyfill',
    `${__dirname}/../src/index.js`,
  ],
  devtool: 'eval-source-map',
  output: {
    filename: 'static/bundle.js'
  },
  plugins: [
    new LogorroicoPlugin('languages', path.join(__dirname, '..', 'langs')),
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['react-hot', 'babel'],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
};
