const Discord = require("discord.js");
const { ipcMain } = require("electron")
const fs = require('fs')
let conf;
if (!fs.existsSync("./config.json")) {
  fs.writeFileSync("./config.json", "{ }")
  conf = require("./config.json")
}
let Rsettings = require("./settings.json")
require("dotenv").config()
let settings = {
  mode: "user", // define actions available (user is user-controlled)
  defaultprefix: ".",
  prefix: "."
}
const clearmodule = require("clear-module")
let uinfo = {}
let window;
let lastmessage;
let isLoggedIn = false
let gids = []
let cids = []
let tagx = /.*#[0-9]{4}/;
let uidx = /<@!\d+>/g;
let client;
let scripts = require("./scripts.json")
let enabledscripts = scripts.filter(e => e.enabled)

function logFile(e) {
  if (Rsettings.fileLogging) fs.appendFile("./logfile", e + "\n", () => { })
}

exports.init = function (win, tok) {
  client = new Discord.Client()
  ipcMain.on("refreshScripts", () => scripts = require("./scripts.json"))
  window = win;
  client.on("ready", () => {
    if (isLoggedIn) return;
    if(Rsettings.status) client.user.setPresence(Rsettings.status)
    if (enabledscripts.length > 0 && Rsettings.csenabled) {
      window.webContents.send("refreshScript")
      enabledscripts.forEach(e => {
        try {
          let script = require(e.path)
          if (script.init) var g = script.init(client)
          logFile("[Scripts] " + e.name + " started successfully")
          if (g) {
            logFile(e.name + " > " + g)
          }
        } catch (err) {
          logFile("[Scripts] " + e.name + " failed to start")
          throw err;
        }
      })
    }
    client.guilds.cache.array().forEach(t => {
      let channels = [],
        msgcontent = [],
        emojis = [],
        emojids = [];
      t.channels.cache.array().forEach(e => {
        if (e.type === "text") {
          channels.push({
            name: e.name,
            id: e.id
          })
        }
      })
      t.emojis.cache.array().forEach(e => {
        emojis.push({
          name: e.name,
          id: e.id,
          url: e.url
        })
        emojids.push(e.id)
      })
      let ob = {
        name: t.name,
        id: t.id,
        channels: channels,
        emoji: emojis,
        emojiIds: emojids
      }
      if (t.icon) ob.icon = `https://cdn.discordapp.com/icons/${t.id}/${t.icon}.png`
      if (!t.icon) ob.abbr = t.nameAcronym
      gids.push(ob)
      isLoggedIn = true
    })
    let tokens = {}
    let botuser = client.user.username + "#" + client.user.discriminator
    uinfo = {
      name: client.user.username,
      discrim: client.user.discriminator,
      full: botuser,
      pfp: client.user.avatarURL(),
      guildNumber: client.guilds.cache.array().length
    }
    if (conf) tokens = conf;
    tokens[botuser] = tok
    fs.writeFileSync("./config.json", JSON.stringify(tokens));
    window.webContents.send("validtoken", {
      bot: uinfo,
      guildInfo: gids
    })
  });
  client.on("message", (message) => {
    process(message)
  });
  client.on("messageDelete", message => {
    window.webContents.send("messagedeleted", message.id)
  });
  client.login(tok)
    .catch(err => {
      window.webContents.send('invalidtoken')
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
            process(msg, true)
          }, 100)
        })
      }).catch(err => {
        if (err.name === "DiscordAPIError" && err.message === "Missing Access") {
          return {
            err: "missing access"
          }
        }
      })
    } else { // could not fetch messages for some unknown reason
      return {
        err: "could not fetch messages ¯\\_(ツ)_/¯"
      }
    }
  })
  ipcMain.on("msgin", (event, arg) => {
    if (arg.msg.toString().match(tagx)) { // is ping
      let un = arg.msg.toString().match(tagx)[0].toString().split("#")[0].replace("@", '')
      let g = client.channels.cache.get(arg.channel).guild.members.cache.filter(x => x.user.username === un).array()
      arg.msg = arg.msg.replace(tagx, g[0].user)
    }
    if (arg.msg.toString().includes("/shrug")) arg.msg = arg.msg.replace("/shrug", "¯\_(ツ)_/¯")
    client.channels.cache.get(arg.channel).send(arg.msg)
  })
  function process(msg, iscached = false) {
    if (Rsettings.csenabled && !iscached) {
      window.webContents.send("refreshScript")
      enabledscripts.forEach(e => {
        try {
          clearmodule(e.path)
          let script = require(e.path)
          var g = script.message(msg)
          if (g) logFile(e.name + " > " + g)
        } catch(err) {
          logFile("[Scripts] " + e.name + " was unable to receive a message")
          throw err;
        }
      })
    }
    let ct = msg.content
    if (msg.mentions.users.array().length >= 1) {
      let mts = msg.mentions.users.array()
      mts.forEach(e => {
        let i = `@${e.username}#${e.discriminator}`
        ct = ct.replace(`<@${e.id}>`, i)
        ct = ct.replace(`<@!${e.id}>`, i)
      })
    }
    let avatarURL = msg.author.displayAvatarURL()
    // if(avatarURL === null) {
    //   avatarURL = msg.author.defaultAvatarURL()
    // }
    let m = {
      content: ct,
      id: msg.id,
      author: {
        username: msg.author.username,
        discriminator: msg.author.discriminator,
        id: msg.author.id,
        avatar: avatarURL
      },
      channel: msg.channel.id,
      guild: msg.guild.id // what
    }
    // console.log(msg.mentions)
    if (msg.mentions.users.array().length != 0) {
      m.mentions = msg.mentions.users.array()
    }
    if (msg.attachments.size) {
      m.images = msg.attachments.array()
    }
    window.webContents.send("msg", {
      msg: m
    })
    if (msg.content.includes("discord.gg")) {
      console.log('someone sent a discord invite link: ' + msg.content)
    }
  }
  ipcMain.on("typing", (event, arg) => {
    if (!Rsettings.typing) return;
    if (arg.start) {
      client.channels.cache.get(arg.chid).startTyping()
    } else if (arg.stop) {
      client.channels.cache.get(arg.chid).stopTyping()
    }
  })
  ipcMain.on("clearstatus", () => {
    client.user.setActivity(null);
    win.webContents.send("clearstatus")
    clearmodule("./settings.json")
    let newsettings = require("./settings.json")
    if(newsettings.status) delete newsettings.status
    fs.writeFileSync("./settings.json", JSON.stringify(newsettings));
  });
  ipcMain.on("statusEntered", (event, arg) => {
    // pain
    clearmodule("./settings.json")
    let newsettings = require("./settings.json")
    newsettings.status = arg.presenceData
    fs.writeFileSync("./settings.json", JSON.stringify(newsettings))
    client.user.setPresence(arg.presenceData)
    win.webContents.send("statusUpdate", {presenceData: arg.presenceData})
  })
}