const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  shell
} = require('electron')
const clearmodule = require("clear-module"), fs = require("fs");
let settings = require("./settings.json"), win, ps = require("./ps.js");
ipcMain.on("addwindow", (event, arg) => childWindow(arg.url));

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
  childwindow.webContents.openDevTools();
  childwindow.loadFile(url)
  childwindow.on("close", () => win.show())
}
let fullyClose = false;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    icon: "./icon.ico",
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true,
      enableRemoteModule: true
    }
  })
  win.setResizable(false)
  win.loadFile('./index.html')
  win.setMenu(null)
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    clearmodule("./settings.json")
    settings = require("./settings.json")
    if(settings.devmode) {
      if(win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else if(win.isVisible()) {
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
  require("@electron/remote/main").initialize()
  ipcMain.on("startbot", (event, tok) => {
    ps.init(win, tok)
  })
  ipcMain.on("clearstatus", () => win.webContents.send("clearstatus"))
  ipcMain.on("statusEntered", (e, arg) => win.webContents.send("statusentered", arg))
  ipcMain.on("show", () => win.show())
  ipcMain.on("hide", () => win.hide())
  ipcMain.on("quit", () => { fullyClose = true; app.quit(); })
  ipcMain.on("restart", () => {
    app.relaunch()
    app.exit()
  })
  ipcMain.on("confirm-restore-settings", (event, arg) => {
    fs.writeFileSync("./settings.json", JSON.stringify(require("./defaultsettings.json")))
    win.webContents.send("refreshSettings")
  })
})

/*

TODO:
  - voice:
    - ui: why do people not show up sometimes (need to test with dandan + ori)
    - ui: add icons for mute/dc instead of text
    - ui: add some ui indicator to tell user that they're connected, and where
  - ctrl+shift+i opens vassalize devtools no matter the visibility/active state of vassalize
  - pinging multiple people at once
  - update server/channel ui when updated
    - joined server
    - channels updated
  - view cached tokens
  - status polishing
  - be able to send custom emojis
  - display embeds
  - server select div scroll on overflow
  + channel list shows server name

MAYBE:
  - send embeds
  - voice bruh
*/
