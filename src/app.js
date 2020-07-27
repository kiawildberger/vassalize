const { app, BrowserWindow, ipcMain } = require('electron')
let ps = require("./ps.js")
const conf = require('./config.json')
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: "./icon.png",
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

/*
TODO:
 - general polish
 - images display from cached messages
 - better styling/fonts
 - make pings for other users less POP and pings for bot actor very noticeable
 - display embeds (yt videos, webpage metadata, just straight embeds)
 - 

MAYBE:
  - pfps
  - full discord styling
  - typing indicator (can enable/disable)
  - status updater
  - minimize to tray to keep bot hosting and online but window closed
  - scripts (user provides a js file with commands/event handlers)
  - sending embeds
  - brute force fucker for bot tokens lmao
  - search
*/