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
let tagx = /.*#[0-9]{4}/
let uidx = /<@!\d+>/

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
        if(arg.msg.toString().match(tagx)) {
            // is ping
            let un = arg.msg.toString().match(tagx)[0].toString().split("#")[0].replace("@", '')
            let g = client.channels.cache.get(arg.channel).guild.members.cache.filter(x => x.user.username === un).array()
            arg.msg = arg.msg.replace(tagx, g[0].user)
        }
        if(arg.msg.toString().includes("/shrug")) arg.msg = arg.msg.replace("/shrug", "¯\_(ツ)_/¯")
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
        let ct = msg.content
        if(msg.mentions) {
            let mts = msg.mentions.users.array()
            mts.forEach(e => {
                let i = `@${e.username}#${e.discriminator}`
                ct = ct.replace(uidx, i)
            })
        }
        let m = {
            content: ct,
            author: msg.author,
            channel: msg.channel.id
        }
        window.webContents.send("msg", {msg: m})
    }
}