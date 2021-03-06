const fs = require('fs')
const path = require('path')
const UglifyJS = require('uglify-js')

const lib = fs.readdirSync(path.join(__dirname, '../lib'))

const list = []
const concatList = []

lib.forEach((item) => {
  if (/\.min\.js$/.test(item)) return
  const target = path.join(__dirname, '../lib', item)
  if (fs.statSync(target).isDirectory()) return
  if (/modern/.test(item)) {
    list.push({ src: target, options: createOptions() })
  } else {
    list.push({ src: target, options: createOptions(true) })
    const minjs = path.join(path.dirname(target), path.basename(target, '.js') + '.min.js')
    concatList.push(minjs)
  }
})

list.push({ src: path.join(__dirname, '../bommon.js'), options: createOptions(true) })
list.push({ src: path.join(__dirname, '../bommon.minimal.js'), options: createOptions(true) })

list.forEach((item) => {
  const res = UglifyJS.minify(fs.readFileSync(item.src, 'utf8'), item.options)
  if (res.error) {
    console.error(res.error)
    return
  }
  fs.writeFileSync(path.join(path.dirname(item.src), path.basename(item.src, '.js') + '.min.js'), res.code, 'utf8')
  console.log(item.src)
})

let code = ''
concatList.forEach(minjs => {
  code += fs.readFileSync(minjs, 'utf8')
})

fs.writeFileSync(path.join(__dirname, '../lib/nodejs.min.js'), code, 'utf8')

function createOptions (ie8) {
  return {
    mangle: true,
    compress: false,
    ...(ie8 !== undefined ? { ie8 } : {})
  }
}
