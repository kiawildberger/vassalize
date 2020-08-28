const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut
} = require('electron')
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
    icon: "./icon.png",
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.loadFile('index.html')
  win.setMenu(null)
  // opening devtoosl will not be in the very final release
  globalShortcut.register("CommandOrControl+Shift+I", () => win.webContents.openDevTools())
  globalShortcut.register("CommandOrControl+Shift+W", () => app.quit())
  win.webContents.on('new-window', function(event, url) {
    event.preventDefault();
    shell.openExternal(url)
  });
}

app.whenReady().then(() => {
  createWindow()
  ipcMain.on("startbot", (event, tok) => {
    ps.init(win, tok)
  })
})

/*

TODO:
 - update readme to include "docs" for scripts
 - be able to send custom emojis
 + custom scripts and actions (user provides a js file with commands/event handlers)
 - get non-custom emoji to look normal
 - load more messages as user scrolls up (button or auto)
 - timestamps, deleted messages, edits
 + typing indicator
 + show user avatars and generally neaten up the displaying of messages
  + made it look a whole lot nicer
 + using markdown-it to cover basic formatting (bold, italics, etc)
  - will do it myself
 - make message readability better (separation between)
    + consolidate continued messages from same user
 - open links externally
    - not on linux?
 - tenor
    - holy fuck is pain
 - display embeds (yt videos, webpage metadata, just straight embeds)
 - keep bot online while app is closed (minimize to tray)
 - server select div scroll on overflow
  - fucc that lmao

MAYBE:
  - status updater
  - brute force fucker for bot tokens lmao
  - VOICE? bruh
*/
