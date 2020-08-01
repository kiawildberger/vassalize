const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
let ps = require("./ps.js")
// let ps = require("./ps.js")
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
  // win.webContents.openDevTools()
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    win.webContents.openDevTools()
  })
}

app.whenReady().then(() => {
  createWindow()
  ipcMain.on("startbot", (event, tok) => {
    ps.init(win, tok)
  })
  // if(conf) window.webContents.send("cached", conf)
})

/*
TODO:
 - general polish
 x images display from cached messages
 x better styling/fonts
 - send bot messages (from input on page) through discord instead of straight to the display (for fancy parsing like pings and images)
 x messages from other channels dont display when other channel is selected
 x make pings for other users less POP and pings for bot actor very noticeable
 - display embeds (yt videos, webpage metadata, just straight embeds)
 - move away from chota (css)
    - use Open Sans or smthn
 - load more messages as user scrolls up (button or auto)

MAYBE:
  - pfps
  - full discord styling
  - typing indicator (can enable/disable)
  - status updater
  - minimize to tray to keep bot online and online but window closed
  - scripts (user provides a js file with commands/event handlers)
  - sending embeds
  - brute force fucker for bot tokens lmao
  - search messages
  - VOICE? bruh
*/