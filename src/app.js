const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
let ps = require("./ps.js")
// let ps = require("./ps.js")
const conf = require('./config.json')
let settings = require("./settings.json")
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    // frame: false,
    icon: "./icon.ico",
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.loadFile('index.html')
  win.setMenu(null)
  if (settings.devmode) {
    globalShortcut.register("CommandOrControl+Shift+I", () => {
      win.webContents.openDevTools()
    })
    globalShortcut.register("CommandOrControl+Shift+W", () => { // should this be in devmode or no
      app.quit()
    })
  }
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
 - emoji
 - pings are fucked
 - tenor
 - show user avatars and generally neaten up the displaying of messages
  - images on snapcraft
 - show user-uploaded videos (add on to images, i think message.attachments)
 - maybe rethink the color scheme but idk
 - reduce the spacing between servers
 - server select div scroll on overflow
 - little spinner when bot is trying to sign in, communicate to user that something is actually happening
 - display embeds (yt videos, webpage metadata, just straight embeds)
 - load more messages as user scrolls up (button or auto)
 - keep bot online while app is closed (minimize to tray)

MAYBE:
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