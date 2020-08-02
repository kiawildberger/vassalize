const Discord = require("discord.js");
const { ipcMain, desktopCapturer } = require("electron")
const fs = require('fs')
const conf = require('./config.json')
let Rsettings = require("./settings.json")
require("dotenv").config()

let settings = {
    mode: "user", // define actions available (user is user-controlled)
    defaultprefix: ".",
    prefix: "."
}
let uinfo = {}
let window;
let lastmessage;
let isLoggedIn = false
let gids = []
let cids = []
let tagx = /.*#[0-9]{4}/;
let uidx = /<@!\d+>/g;

exports.init = function (win, tok) {
    let client = new Discord.Client();
    window = win;
    client.on("ready", () => {
        client.guilds.cache.array().forEach(t => {
            let channels = [], msgcontent = [];
            t.channels.cache.array().forEach(e => {
                if (e.type === "text") {
                    channels.push({ name: e.name, id: e.id })
                }
            })
            gids.push({
                icon: `https://cdn.discordapp.com/icons/${t.id}/${t.icon}.png`,
                name: t.name,
                id: t.id,
                channels: channels
            })
            isLoggedIn = true
        })
        let tokens = {}
        let botuser = client.user.username + "#" + client.user.discriminator
        uinfo = {
            name: client.user.username,
            discrim: client.user.discriminator,
            full: botuser
        }
        if (conf) tokens = conf;
        tokens[botuser] = tok
        fs.writeFileSync("./config.json", JSON.stringify(tokens));
        window.webContents.send("validtoken", { bot: uinfo, guildInfo: gids })
    });
    client.on("message", (message) => {
        process(message)
    });
    client.login(tok)
        .catch(err => {
            console.log('invalid token?')
            return "invalid token"
        })
    ipcMain.on("getChannelContent", (event, id) => {
        let b = client.channels.cache.get(id)
        if (b) {
            b.messages.fetch().then((resp) => {
                let t = resp.array()
                t.length = Rsettings.cachedlength
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
                        author: {
                            username: msg.author.username,
                            discriminator: msg.author.discriminator,
                            id: msg.author.id,
                            avatar: msg.author.avatarURL()
                        },
                        channel: msg.channel.id
                    }
                    if (msg.attachments) {
                        let d = msg.attachments.array()
                        d.forEach(e => {
                            e = e.url
                        })
                        m.images = d
                    }
                    setTimeout(() => {
                        process(msg)
                    }, 100)
                })
            }).catch(err => {
                if (err.name === "DiscordAPIError" && err.message === "Missing Access") {
                    return { err: "missing access" }
                }
            })
        } else { // could not fetch messages for some unknown reason
            return { err: "could not fetch messages ¯\\_(ツ)_/¯" }
        }
    })
    ipcMain.on("msgin", (event, arg) => {
        if (arg.msg.toString().match(tagx)) { // is ping
            let un = arg.msg.toString().match(tagx)[0].toString().split("#")[0].replace("@", '')
            let g = client.channels.cache.get(arg.channel.id).guild.members.cache.filter(x => x.user.username === un).array()
            arg.msg = arg.msg.replace(tagx, g[0].user)
        }
        if (arg.msg.toString().includes("/shrug")) arg.msg = arg.msg.replace("/shrug", "¯\_(ツ)_/¯")
        client.channels.cache.get(arg.channel.id).send(arg.msg)
    })

    function process(msg) {
        let ct = msg.content
        if (msg.mentions.users.array().length >= 1) {
            let mts = msg.mentions.users.array()
            mts.forEach(e => {
                let i = `@${e.username}#${e.discriminator}`
                ct = ct.replace(`<@${e.id}>`, i)
                ct = ct.replace(`<@!${e.id}>`, i)
            })
        }
        let m = {
            content: ct,
            author: {
                username: msg.author.username,
                discriminator: msg.author.discriminator,
                id: msg.author.id,
                avatar: msg.author.avatarURL()
            },
            channel: msg.channel.id
        }
        if (msg.attachments.size) {
            m.images = msg.attachments.array()
        }
        window.webContents.send("msg", { msg: m })
        if (msg.content.includes("discord.gg")) {
            console.log(msg)
        }
    }
}

// pings need to be shown as pings (user#0000) instead of a uid
