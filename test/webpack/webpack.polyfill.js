const webpack = require('webpack')
const path = require('path')
const fs = require('fs')

const files = {
  'url': 'module.exports = require("url")',
  'timers': 'module.exports = require("timers")',
  'util': 'module.exports = require("util")'
}

const entry = {}
Object.keys(files).forEach((name) => {
  const file = path.join(__dirname, name + '.js')
  fs.writeFileSync(file, files[name], 'utf8')
  entry[name] = file
})

const config = {
  mode: 'production',
  devtool: 'none',
  entry,
  output: {
    path: path.join(__dirname, './polyfill'),
    filename: '[name].polyfill.js',
    library: '[name]',
    libraryTarget: 'umd'
  },
  optimization: {
    minimize: false
    // namedModules: false,
    // namedChunks: false
  }
}

webpack(config, (err, stat) => {
  console.log(stat.toString({ colors: true }))
  Object.keys(files).forEach((name) => {
    fs.unlinkSync(path.join(__dirname, name + '.js'))
  })
})
