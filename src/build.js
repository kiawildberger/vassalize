// dont fuckin touch this shit again just run "node build.js" then move the cachefile into the build folder and export

const packager = require('electron-packager')
const fs = require('fs')

const options = {
  platform: ['win32'],
  arch: 'x64',
  name: 'rubber',
  dir: '.',
  icon: "icon.ico",
  out: '../',
  overwrite: true,
  asar: true,
  prune: true,
  files: [
    "src/app.js",
    "src/ps.js",
    "src/index.html",
    "src/index.js",
    "src/style.css",
    "src/settings.json"
  ]
}

packager(options, (error, path) => {
  if (error) {
    return (
      console.log(`Error: ${error}`)
    )
  }

  console.log(`Package created, path: ${path}`)
})