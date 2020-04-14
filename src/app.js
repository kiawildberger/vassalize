const { app, BrowserWindow, ipcMain } = require('electron')
let ps = require("./ps.js")
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
  ps.init(win, process.env.TOKEN)
})