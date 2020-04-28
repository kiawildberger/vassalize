const Discord = require("discord.js");
const { ipcMain } = require("electron")
const fs = require('fs')
const conf = require('./config.json')
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

exports.init = function (win, tok) {
    window = win;
    const client = new Discord.Client();
    client.on("ready", () => {
        client.guilds.cache.array().forEach(t => {
            gids.push(t)
            isLoggedIn = true
        })
        let tokens = {}
        let botuser = client.user.username + "#" + client.user.discriminator
        if (conf) tokens = conf;
        tokens[botuser] = tok
        fs.writeFileSync("./config.json", JSON.stringify(tokens));
        console.log(botuser + " is ready!!")
        window.webContents.send("valid-token", { user: botuser, gids: gids })
    });
    client.on("message", (message) => {
        process(message)
    });
    client.login(tok)
        .catch(err => {
            window.webContents.send("invalid-token", "invalid")
            console.log('bad token')
            return;
        })
    ipcMain.on("msgin", (event, arg) => {
        if (arg.msg.toString().match(tagx)) { // is ping
            let un = arg.msg.toString().match(tagx)[0].toString().split("#")[0].replace("@", '')
            let g = client.channels.cache.get(arg.channel).guild.members.cache.filter(x => x.user.username === un).array()
            arg.msg = arg.msg.replace(tagx, g[0].user)
        }
        if (arg.msg.toString().includes("/shrug")) arg.msg = arg.msg.replace("/shrug", "¯\_(ツ)_/¯")
        console.log(arg.channel, arg.msg)
        client.channels.cache.get(arg.channel).send(arg.msg)
    })
    ipcMain.on("rcids", (event, guild) => {
        let cids = []
        let e = gids[guild];
        e.channels.cache.filter(c => c.type === "text").array().forEach(r => {
            cids.push(r)
        })
        window.webContents.send("cids", cids)
    })
    ipcMain.on("cachedmessages", (event, arg) => {
        let b = client.channels.cache.get(arg)
        if (b) {
            b.messages.fetch().then((resp) => {
                let t = resp.array()
                t.length = 10
                t = t.reverse()
                t.forEach(msg => {
                    let ct = msg.content
                    if (msg.mentions) {
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
                    if (t.indexOf(msg) === t.length - 1) {
                        if (msg.attachments) {
                            m.images = []
                            msg.attachments.array().forEach(e => {
                                m.images.push(e.url)
                            })
                        }
                    }
                    setTimeout(() => {
                        window.webContents.send("msg", { msg: m })
                    }, 100)
                })
            }).catch(shit => {
                if (shit.name === "DiscordAPIError" && shit.message === "Missing Access") {
                    window.webContents.send("apierror", "missing access")
                }
            })
        } else { // could not fetch messages for some unknown reason
            window.webContents.send("apierror", {custom: "could not fetch messages ¯\_(ツ)_/¯"})
        }
    })
}

function process(msg) {
    if (settings.mode === "user") {
        let ct = msg.content
        if (msg.mentions) {
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
        window.webContents.send("msg", { msg: m })
    }
}