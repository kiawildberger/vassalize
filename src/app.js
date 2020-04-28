/* TODO:
  - better guild/channel selection
  - images (no video though)
  - better UI in general
  - mess around with guild invites, see if i can get client to join when user sends invite link /shrug
*/

const { app, BrowserWindow, ipcMain } = require('electron')
let ps = require("./ps.js")
const conf = require('./config.json')
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: "./rbr.jpg",
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.loadFile('index.html')
  win.setMenu(null)
  win.webContents.send("gal-data", {a:'b'})
  win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  ipcMain.on("startbot", (event, tok) => {
    ps.init(win, tok)
  })
  if(conf) window.webContents.send("cached", conf)
})