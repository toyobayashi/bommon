const fs = require('fs')
const path = require('path')

const lib = fs.readdirSync(path.join(__dirname, '../../lib'))

const entry = {}

lib.forEach((item) => {
  if (/\.min\.js$/.test(item)) return
  const target = path.join(__dirname, '../../lib', item)
  if (fs.statSync(target).isDirectory()) return
  entry[path.basename(item, '.js')] = target
})

module.exports = {
  mode: 'development',
  devtool: 'none',
  entry,
  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].bundle.js'
  }
}
