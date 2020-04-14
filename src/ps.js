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

exports.init = function(win, tok) {
    window = win;
    const client = new Discord.Client();
    client.on("ready", () => {
        console.log("I am ready!");
    });
    client.on("message", (message) => {
        process(message)
    });
    client.login(tok);
    isLoggedIn = true
    ipcMain.on("msgin", (event, arg) => {
        client.channels.cache.get(arg.channel).send(arg.msg)
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