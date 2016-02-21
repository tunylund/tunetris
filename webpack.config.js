var webpack = require('webpack')

module.exports = {
  entry: {
    app: './src/tunetris.js',
    vendor: ['three', 'events', 'util', 'detect-pitch']
  },
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  module: {
    loaders: []
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js')
  ]
}
