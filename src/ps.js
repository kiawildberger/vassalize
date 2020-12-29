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
const clearmodule = require("clear-module")
let uinfo = {}
let window;
let lastmessage;
let isLoggedIn = false
let gids = []
let cids = [];
let uidx = /<@!\d+>/g;
let client;
let scripts = require("./scripts.json")
let enabledscripts = scripts.filter(e => e.enabled)

function logFile(e) {
  if (Rsettings.fileLogging) fs.appendFile("./logfile", e + "\n", () => { })
}

exports.init = function (win, tok) {
  client = new Discord.Client()
  window = win;
  client.on("ready", () => {
    if (isLoggedIn) return;
    if(Rsettings.status) client.user.setPresence(Rsettings.status)
    clearmodule("./settings.json");
    Rsettings = require("./settings.json")
    if (enabledscripts.length > 0 && Rsettings.csenabled) {
      enabledscripts.forEach(e => {
        try {
          clearmodule(e.path)
          let script = require(e.path)
          if (script.init) var g = script.init(client)
          logFile("[Script] " + e.name + " started successfully")
          console.log(`[Script] ${e.name} started successfully`)
          if (g) {
            logFile('[Script]'+e.name + " > " + g)
          }
        } catch (err) {
          logFile("[Script] " + e.name + " failed to start")
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
      guildNumber: client.guilds.cache.array().length,
      id: client.user.id
    }
    clearmodule("./config.json")
    clearmodule("./settings.json")
    Rsettings = require("./settings.json")
    tokens = require("./config.json")
    tokens[botuser] = tok
    if(Rsettings.cachetokens) fs.writeFileSync("./config.json", JSON.stringify(tokens));
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
  client.on("messageUpdate", (oldMessage, newMessage) => {
    window.webContents.send("messageupdated", {id: oldMessage.id, content: newMessage.content})
  })
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
  let tagx = /@.*#[0-9]{4}/;
  ipcMain.on("msgin", (event, arg) => {
    if (arg.msg.toString().match(tagx)) { // is ping
      let un = arg.msg.toString().match(tagx)[0].toString().split("#")[0].replace("@", '')
      let g = client.users.cache.find(x => x.username === un)
      console.log(un, g)
      arg.msg = arg.msg.replace(`@${g.username}#${g.discriminator}`, g)
    }
    if (arg.msg.toString().includes("/shrug")) arg.msg = arg.msg.replace(/\/shrug/g, "¯\_(ツ)_/¯")
    client.channels.cache.get(arg.channel).send(arg.msg)
  })
  function process(msg, iscached = false) {
    clearmodule("./settings.json");
    Rsettings = require("./settings.json")
    if (Rsettings.csenabled && !iscached) {
      window.webContents.send("refreshScript")
      enabledscripts.forEach(e => {
        try {
          clearmodule(e.path)
          let script = require(e.path)
          var g = script.message(msg)
          if (g) logFile(e.name + " > " + g)
        } catch(err) {
          logFile("[Script] " + e.name + " was unable to receive a message")
          console.log(`[Script] ${e.name} was unable to receive a message`)
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
      guild: msg.guild.id, // what
      time: msg.createdTimestamp
    }
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