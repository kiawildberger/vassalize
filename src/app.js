const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  shell, dialog
} = require('electron')
let ps = require("./ps.js")
const fs = require("fs")
const conf = require('./config.json')
let settings = require("./settings.json")
const clearmodule = require("clear-module")
let win;

ipcMain.on("addwindow", (event, arg) => childWindow(arg.url))

function childWindow(url) {
  let childwindow = new BrowserWindow({
    width: 350,
    height: 200,
    parent: win,
    frame:false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  // childwindow.webContents.openDevTools();
  childwindow.loadFile(url)
}
let fullyClose = false;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    icon: "./icon.ico",
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true
    }
  })
  win.loadFile('index.html')
  win.setMenu(null)
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    clearmodule("./settings.json")
    settings = require("./settings.json")
    if(settings.devmode) {
      if(win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools()
      }
    }
  })
  globalShortcut.register("CommandOrControl+Shift+W", () => app.quit())
  win.webContents.on('new-window', function(event, url) {
    event.preventDefault();
    shell.openExternal(url)
  });
  win.on("close", e => {
    clearmodule("./settings.json")
    settings = require("./settings.json")
    if(fullyClose || !settings.minimize) {
      win.destroy();
    }
    if(settings.minimize && !fullyClose) {
      win.hide();
      e.preventDefault();
    }
  })
}

app.whenReady().then(() => {
  createWindow();
  
  ipcMain.on("startbot", (event, tok) => {
    ps.init(win, tok)
  })
  ipcMain.on("show", () => win.show())
  ipcMain.on("hide", () => win.hide())
  ipcMain.on("quit", () => { fullyClose = true; app.quit() })
  ipcMain.on("restart", () => {
    app.relaunch()
    app.exit()
  })
  ipcMain.on("confirm-restore-settings", (event, arg) => {
    fs.writeFileSync("./settings.json", JSON.stringify(require("./defaultsettings.json")))
  })
})

/*

TODO:
 + keep bot online while app is closed (minimize to tray)
 + custom script editing while app is open (no restart required)
 - status polishing
 + default settings, can restore to defaults
 - timestamps, deleted messages, edits
  + deleted messages are marked as deleted
 - be able to send custom emojis
 - get non-custom emoji to look normal
 - load more messages as user scrolls up (button or auto)
  + made it look a whole lot nicer
 - make message readability better (separation between)
 - open links externally (also autolink)
 - display embeds (yt videos, webpage metadata, just straight embeds)
 - server select div scroll on overflow
  - fuck that lmao

MAYBE:
  - brute force fucker for bot tokens lmao
  - VOICE? bruh
*/
