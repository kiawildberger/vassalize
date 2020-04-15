const Discord = require("discord.js");
const { ipcMain } = require("electron")
require("dotenv").config()

let settings = {
    mode: "user", // define actions available (user is user-controlled)
    defaultprefix: ".",
    prefix: "."
}
let window;
let lastmessage;
let isLoggedIn = false
let gids = []
let cids = []

exports.init = function(win, tok) {
    window = win;
    const client = new Discord.Client();
    client.on("ready", () => {
        console.log("I am ready!");
        client.guilds.cache.array().forEach(t => {
            gids.push(t)
            isLoggedIn = true
        })
        window.webContents.send("gids", gids)
    });
    client.on("message", (message) => {
        process(message)
    });
    client.login(tok);
    ipcMain.on("msgin", (event, arg) => {
        client.channels.cache.get(arg.channel).send(arg.msg)
    })
    // channels.cache.filter(c => c.type === "text")
    ipcMain.on("rcids", (event, guild) => {
        let cids = []
        let e = gids[guild];
        e.channels.cache.filter(c => c.type === "text").array().forEach(r => {
            cids.push(r)
        })
        window.webContents.send("cids", cids)
    })
}

function process(msg) {
    if(settings.mode === "user") {
        let m = {
            content: msg.content,
            author: msg.author,
            channel: msg.channel.id
        }
        window.webContents.send("msg", {msg: m})
    }
}