const { ipcRenderer, shell } = require("electron"),
  Discord = require("discord.js"),
  { Tray, Menu } = require("@electron/remote"),
  fs = require('fs'),
  clearmodule = require("clear-module"),
  scriptreader = require("./scriptreader.js"),
  titlebar = require("electron-titlebar");
let conf, botActor, Rsettings = require("./settings.json")
if (!fs.existsSync("./config.json")) {
  fs.writeFileSync("./config.json", "{ }")
  conf = require("./config.json")
} else {
  conf = require('./config.json')
}
function id(e) { return document.getElementById(e) }
let isVoiceConnected = false;

function traySettings(e, value) {
  // let settings = Rsettings;
  // settings[e] = value;
  // Rsettings = settings;
  // fs.writeFileSync("./settings.json", JSON.stringify(settings))
  let corresponding = {
    cachetokens: "cachetokens",
    cachedlength: "cachedlength",
    minimize: "minimizeWhenClosed",
    typing: "typingIndicator",
    csenabled: "scriptsenabled",
    fileLogging: "logfile",
    devmode: "devmode"
  }
  id(corresponding[e]).click()
  let settings = {
    cachedlength: id("cachedlength").value,
    devmode: id("devmode").checked,
    typing: id("typingIndicator").checked,
    fileLogging: id("logfile").checked,
    csenabled: id("scriptsenabled").checked,
    minimize: id("minimizeWhenClosed").checked,
    cachetokens: id('cachetokens').checked
  }
  Rsettings = settings
  fs.writeFileSync("./settings.json", JSON.stringify(settings))
}

let windowIsVisible = true;
let tray = new Tray(require('path').join(__dirname, "icon.ico")), contextMenu;
function setTrayItems() {
  contextMenu = Menu.buildFromTemplate([
    {label: "vassalize", enabled: false },
    {type:"separator"},
    {type:"submenu", label: "options",
      submenu: [
        // ideally these would all interact properly with the options menu and i *had it working* but its broken now
        {label: "store tokens in cache", type:"checkbox", checked:Rsettings.cachetokens, click: () => { traySettings("cachetokens", !Rsettings.cachetokens)}},
        {label: "developer mode", type:"checkbox", checked:Rsettings.devmode, click: () => { traySettings("devmode", !Rsettings.devmode)}},
        {label: "users can see when you're typing", type:"checkbox", checked:Rsettings.typing, click: () => { traySettings("typing", !Rsettings.typing)}},
        {label: "allow custom scripts to run", type:"checkbox", checked:Rsettings.csenabled, click: () => { traySettings("csenabled", !Rsettings.csenabled)}},
        {label: "log to file", type:"checkbox", checked:Rsettings.fileLogging, click: () => { traySettings("fileLogging", !Rsettings.fileLogging)}},
        {label: "clear logfile", click: () => id("clearlogfile").click()},
        {label:"clear cached tokens", click: () => id('clearcache').click()},
        {label:"restore default settings", click: () => id('opt-restore-defaults').click()}
      ]},
    // { label: "window visible", type:"checkbox", checked:windowIsVisible, click: () => toggleVisible() },
    { label: "quit", click: () => ipcRenderer.send("quit") }, // role: "quit" doesnt work here bc window is already hidden probably
  ])
  tray.on("click", () => toggleVisible())
  tray.setToolTip("vassalize")
  tray.setContextMenu(contextMenu);
}
setTrayItems();

function toggleVisible() {
  console.log(contextMenu.items[3])
  if(windowIsVisible) {
    ipcRenderer.send('hide')
    windowIsVisible = false;
    contextMenu.items[3].label = "show window"
    let m = Menu.buildFromTemplate(contextMenu)
    tray.setContextMenu(m)
  } else if(!windowIsVisible) {
    ipcRenderer.send('show')
    windowIsVisible = true;
    contextMenu.items[3].label = "hide window"
    let m = Menu.buildFromTemplate(contextMenu)
    tray.setContextMenu(m)
  }
}

let loggedin = false;
let cdnUrl = /https?:\/\/cdn.discordapp.com\/attachments\/\d+\/\d+\/[a-zA-Z0-9_-]+\.[a-zA-Z]{2,5}/g
// why is cdnurl have the {2,5} after it, what if src has more numbers??? needa test regex101.com lamo gotem
// that is file extension 4head     bonk
let tenorurl = /https:\/\/tenor.com\/view\/[a-z-]+\d+/g
let urlregex = /https?:\/\/.*\..*/g
let mdurlregex = /(\[.*\])(.*)/g
let imagetypes = ["jpg", "JPG", 'png', 'PNG', 'gif', 'GIF', 'webp', 'WEBP', 'tiff', 'TIFF', 'jpeg', 'JPEG', 'svg', 'SVG']
let vidtypes = ["mp4", "MP4", "webm", "WEBM", "mkv", "MKV", "ogg", "OGG", "ogv", "OGV", "avi", "AVI", "gifv", "GIFV", "mpeg", "MPEG"]
let gids = [], index = 0, currentchannel, currentserver;
ipcRenderer.on("msg", (e, arg) => {
  processmsg(arg);
})

function processmsg(arg) {
  let e, link
  let hasmdlink = arg.msg.content.match(mdurlregex)
  if (hasmdlink) {
    // console.log(hasmdlink)
  }
  gids[index].channels.forEach(o => {
    if (o.id === currentchannel) {
      e = currentchannel
    }
  })
  if (e == arg.msg.channel) {
    let ul = document.createElement("ul")
    ul.setAttribute("uid", arg.msg.author.id)
    ul.classList.add("msg")
    ul.classList.add("collection-item")
    let ct = arg.msg.content
    let mt = arg.msg.mentions

    let ts = arg.msg.time, days = ["Sun", "Mon", "Tues", 'Wed', 'Thurs', 'Fri', 'Sat'], months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', "Oct", 'Nov', 'Dec'],
      time = new Date(ts), month = months[time.getMonth()], weekday = days[time.getDay()], day = time.getDate(), year = time.getFullYear(),
      times = `${time.getHours()}:${(time.getMinutes() < 10) ? "0"+time.getMinutes() : time.getMinutes()}`,
      fulltime = `${weekday}, ${month} ${day} ${year}, at ${times}`;

    // custom emoji
    // let pemojis = ct.match(/<:[a-zA-Z0-9]+:\d+>/g)
    let pemojis;
    if (pemojis) {
      pemojis.forEach(e => {
        let d = e.split(":")[2].replace(">", ''),
          name = e.split(":")[1],
          url;
        if (gids[index].emojiIds.includes(d)) {
          url = gids[index].emoji[gids[index].emojiIds.indexOf(d)].url
        }
        let elem = `![emoji](${url})`
      })
    }
    const uEmoji = require("universal-emoji-parser")
    ct = uEmoji.parse(ct)
    ct = require("snarkdown")(ct)
    ct = `<p mid="${arg.msg.id}" title="${fulltime}">${ct}</p>`

    if (ct.includes("@everyone")) {
      ct = ct.replace("@everyone", `<span class="selfping">@everyone</span>`)
    }
    if (ct.includes("@here")) {
      ct = ct.replace("@here", `<span class="selfping">@here</span>`)
    }
    if (mt) {
      mt.forEach(e => {
        ct = ct.replace(`@${e.username}#${e.discriminator}`, `<span class="ping">@${e.username}#${e.discriminator}</span>`)
        if (e.username === botActor.username && e.discriminator === botActor.discrim) {
          ct = ct.replace(`@${e.username}#${e.discriminator}`, `<span class="selfping">@${e.username}#${e.discriminator}</span>`)
        }
      })
    }
    let isimg = false
    let useravatar = `<img src="${arg.msg.author.avatar}" class="user-avatar">`
    let usertag = `<div class="username-card">${arg.msg.author.username}<span class="user-discrim">#${arg.msg.author.discriminator}</span>&nbsp;&nbsp;</div>`
    let lastmsg = document.querySelectorAll("ul.collection-item")[document.querySelectorAll("ul.collection-item").length - 1]
    if (lastmsg && lastmsg.getAttribute("uid") === arg.msg.author.id) {
      lastmsg.innerHTML += ct;
    } else {
      ul.innerHTML = useravatar + usertag + ct
    }

    if (arg.msg.images) {
      isimg = true; // should be "ismedia" bc videos but im not gon change that rn
      arg.msg.images.forEach(q => {
        let d = q.attachment.split(".")[q.attachment.split(".").length - 1]
        if (imagetypes.includes(d)) {
          let img = document.createElement("img")
          img.classList.add("user-img")
          img.src = q.url
          img.title = q.url
          ul.appendChild(img)
          img.addEventListener('click', () => {
            shell.openExternal(q.url)
          }) // shell.openExternal opens links in default browser, not electron
          img.addEventListener("load", () => id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight)
          // i guess the failed image doesn't send an error event???
          // img.addEventListener("error", () => { img.tagName = "p"; img.textContent = "failed to load image" })
        } else if (vidtypes.includes(d)) {
          let video = document.createElement("video")
          let source = document.createElement("source")
          source.setAttribute("src", q.attachment)
          source.setAttribute("type", "video/" + d.toLowerCase())
          video.controls = "true"
          video.width = "200" // slightly bigger than images, maybe should incrase the size of images??
          video.appendChild(source)
          video.classList.add("user-video")
          ul.appendChild(video)
          // should add to open external? maybe an pseudo-element that appears when hovered would be best
          video.addEventListener("load", () => id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight)
        }
      })
    }
    if (arg.msg.content.match(cdnUrl)) {
      arg.msg.content.match(cdnUrl).forEach(e => {
        let d = e.split('.')
        d = d[d.length - 1]
        if (imagetypes.includes(d)) { // ig i have to have the caps in the array cos im not iterating on it
          let img = document.createElement('img')
          img.classList.add('user-img')
          img.src = e
          img.title = e
          img.addEventListener('click', () => {
            shell.openExternal(e)
          })
          ul.appendChild(img)
          img.addEventListener("load", () => id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight)
        }
      })
    }
    ul.setAttribute("data-channel", arg.msg.channel)
    id("msgdisplay").appendChild(ul)
    if (!isimg) {
      id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight
    }
  }
}

let firstrun = true;
function fillGuildSelect(arg) { // generates and populates guild list
  if (!loggedin) return;
  arg.forEach(e => {
    if (!e.abbr) {
      let div = document.createElement('div')
      let opt = document.createElement("img")
      opt.setAttribute("class", "serverlist-item")
      opt.setAttribute("data-index", arg.indexOf(e))
      div.appendChild(opt)
      opt.setAttribute("src", e.icon)
      opt.title = e.name
      let tri = document.createElement("div")
      tri.classList.add("channel-triangle")
      div.appendChild(tri)
      tri.style.display = 'none'
      id('serverlist').appendChild(div)
    } else if (e.abbr) {
      let opt = document.createElement('div')
      opt.setAttribute("data-index", arg.indexOf(e))
      opt.classList.add("serverlist-item")
      let text = document.createElement("p")
      text.textContent = e.abbr
      opt.title = e.abbr
      opt.appendChild(text)
      let tri = document.createElement("div")
      tri.classList.add("channel-triangle")
      tri.style.display = 'none'
      opt.appendChild(tri)
      id('serverlist').appendChild(opt)
    }
  })
  gids = arg
  let q = [...document.querySelectorAll('.serverlist-item')]
  q.forEach(e => {
    e.addEventListener("click", () => { // handles selecting a server
      id('msgin').disabled = false
      if (q[q.indexOf(e)] != q) q.splice(q.indexOf(e), 1) // if this is duplicate of another one, should remove it
      id('msgdisplay').innerHTML = ''
      if (id('channellist').style.display === "none") id('channellist').style.display = 'block'
      let r = [...document.querySelectorAll('.serverlist-active')]
      r.forEach(e => e.classList.remove("serverlist-active"))
      e.classList.add("serverlist-active")
      index = e.getAttribute('data-index')
      let tdistance = 68 + (75 * parseInt(e.getAttribute('data-index'))) + "px";
      Array.from(document.querySelectorAll(".channel-triangle")).forEach(e => e.style.display = "none")
      if (e.tagName === "IMG") {
        e.nextElementSibling.style.display = 'block'
        e.nextElementSibling.style.top = tdistance
      } else {
        e.querySelector('.channel-triangle').style.display = "block"
        e.querySelector('.channel-triangle').style.top = tdistance
      }
      id('channellist').innerHTML = `<div id="channel-label">channels</div>`
      id("msgin").focus();
      let server = gids[e.getAttribute('data-index')]
      currentserver = server;
      id("channel-label").innerText = server.name
      server.channels.forEach(e => {
        let elm = document.createElement("div")
        elm.classList.add("channel-item")
        elm.textContent = "# " + e.name
        elm.setAttribute('data-id', e.id)
        elm.setAttribute("data-type", "text")
        elm.addEventListener("click", () => { // handles selecting a channel
          currentchannel = e.id
          q = [...document.querySelectorAll(".activechannel")]
          q.forEach(e => {
            e.classList.remove("activechannel")
          })
          elm.classList.add("activechannel")
          id('msgdisplay').innerHTML = ''
          ipcRenderer.send("getChannelContent", e.id)
        })
        id("channellist").appendChild(elm)
        if (server.channels.indexOf(e) === 0) elm.dispatchEvent(new Event('click'))
      })
      // for voice channels, maybe i shouldnt copy code like this but whatever
      server.vchannels.forEach(vc => {
        let elm = document.createElement("div")
        elm.classList.add("channel-item")
        let name = vc.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        // this image NEEDS to be redone in xd or smthn, fit the style better
        elm.innerHTML = '< '+name;
        elm.setAttribute('data-id', vc.id)
        elm.setAttribute("data-type", "voice")
        let users = document.createElement("div")
        elm.addEventListener("click", () => { // handles selecting a vc
          ipcRenderer.send("voiceConnect", vc.id); // connect to voice
          id("vcchannel").innerText = "connected to: "+server.name + "/"+vc.name;
          isVoiceConnected = vc.id;
          id("voicestate").style.display = "block";
        })
        users.classList.add("vc-users")
        // users.setAttribute("id", "vcusers")
        vc.members.forEach(e => {
          users.innerHTML = ""
          let userimg = document.createElement("img")
          userimg.setAttribute("data-id", e.id)
          userimg.src = e.avatar
          userimg.classList.add("vc-userimg");
          userimg.title = e.username+"#"+e.discriminator
          users.appendChild(userimg);
        })
        if(firstrun) { // otherwise "possible eventemitter memory leak detected"
          ipcRenderer.setMaxListeners(0) // im pretty sure this is bad but i think i need it
          ipcRenderer.on("voiceupdate", (a, update) => {
            console.log(update.type)
            if(update.type === "join") {
              let e = update.user;
              vc.members.push(e)
              let userimg = document.createElement("img")
              userimg.setAttribute("data-id", e.id)
              userimg.src = e.avatar;
              userimg.classList.add("vc-userimg");
              userimg.title = e.username+"#"+e.discriminator
              document.querySelector(`div[data-id="${update.channelID}"]`).appendChild(userimg);
              console.log(update)
            } else if(update.type === "leave") {
              let user = document.querySelector(`img[data-id="${update.user.id}"`)
              // sometimes user is null? means that the icon isnt being created after the first time
              user.remove();
            }
          })
          firstrun = false;
        }
        elm.appendChild(users)
        id("channellist").appendChild(elm) // i want to categorize text/voice channels into seperate divs but... the html isnt updating?? idk
      })
    })
  })
  id('bs').style.display = "none"
  id("container").style.display = "block"
  id('topt').setAttribute("returnTo", "container")
  id('loginbg').style.display = 'none'
}

id("vc-dc").addEventListener("click", () => {
  if(isVoiceConnected) ipcRenderer.send("vc-dc", isVoiceConnected)
  id("voicestate").style.display = "none";
})

// setInterval(() => {
//   if(!currentserver) return;
//   ipcRenderer.send("requestvcusersupdate", currentserver.id);
// }, 500)

ipcRenderer.on("invalidtoken", () => {
  id('bs-helper').style.color = 'red'
  id('bs-helper').textContent = "something went wrong and could not login"
  setTimeout(() => {
    id('bs-helper').textContent = ''
  }, 3000)
})

async function checkCached() {
  if (conf) {
    for (let i in conf) {
      let r = document.createElement("div")
      if (id('no-recent-logins')) id('no-recent-logins').remove()
      r.classList.add("tcache")
      r.innerText = i;
      r.addEventListener("click", async () => {
        r.setAttribute('state', "pending")
        setTimeout(() => r.setAttribute("state", "selected"), 100)
        ipcRenderer.send("startbot", conf[i])
      })
      id('cached').appendChild(r)
    }
  }
}
checkCached()

function fillStatus(bot, presenceData = undefined) {
  if (!bot) return;
  clearmodule("./settings.json")
  let sett = require("./settings.json")
  if (!sett.status) {
    id("userd").innerHTML = `<img class="statusd" src="${bot.pfp}">
    <div class="status-data">
    <p class="statusn">${bot.name}<span class="status-discrim"> #${bot.discrim}</span></p>
    <p class="status-pres hoverunderline" id="openstat">Set a status</p>
    </div>`
    id('openstat').addEventListener("click", () => { ipcRenderer.send("addwindow", {url:"./status.html"}) })
    return;
  }
  let stattype = sett.status.activity.type.toLowerCase()
  stattype = stattype.replace(stattype[0], stattype[0].toUpperCase());
  console.log(stattype)
  let statname = sett.status.activity.name.toLowerCase();
  if (presenceData) {
    stattype = presenceData.activity.type
    statname = presenceData.activity.name.toLowerCase();
    stattype = stattype.replace(stattype[0], stattype[0].toUpperCase());
    console.log(stattype)
  }
  if (stattype === "Listening" || stattype === "LISTENING") stattype = "Listening to"
  if (stattype === "PLAYING") stattype = "Playing"
  if (stattype === "WATCHING") stattype = "Watching"
  // this is pain why do i have to write this out manually??? did the .replace() not work or smthn
  let template = `<img class="statusd" src="${bot.pfp}">
  <div class="status-data">
  <p class="statusn">${bot.name}<span class="status-discrim"> #${bot.discrim}</span></p>
  <p class="hoverunderline status-pres" onclick="ipcRenderer.send('addwindow', {url:'./status.html'})"><span class="status-type">${stattype} </span>${statname}</p>
  </div>` // nice readability huh
  id('userd').innerHTML = template;
}
ipcRenderer.on("statusUpdate", (event, arg) => fillStatus(botActor, arg.presenceData));

ipcRenderer.on("validtoken", (event, args) => { // the *one* ipc i will use
  let { bot, guildInfo } = args;
  if (bot && guildInfo) {
    botActor = bot, gids = guildInfo
    document.querySelector(".serverlist-label").innerHTML += `<span> (${gids.length})</span>`;
  }
  id('bs-helper').innerText = "success!"
  id("bs-helper").style.color = "green"
  loggedin = true;
  fillStatus(bot);
  setTimeout(() => {
    // id('userd').innerHTML = `acting as <span style="cursor:pointer;" onclick="ipcRenderer.send('addwindow', {url:'./status.html'})"><b>${args.bot.full}</b></span>`
    document.title = bot.full
    id('titlebar-title').textContent = "vassalize: "+bot.full.toLowerCase()
    id('bs-helper').innerText = ''
    fillGuildSelect(guildInfo)
  }, 800)
})
id("bot-secret").addEventListener("keypress", e => {
  if (e.code != "Enter") return; // keyCode is apparently deprecated?
  if (!e.target.value) return;
  ipcRenderer.send("startbot", e.target.value)
})
id("bot-secret").addEventListener("keydown", (e) => {
  if(e.key === "Backspace" && e.target.value.length <= 1) {
    id('cached-btn').style.transform = "rotate(0deg)"
    id('cached-btn').setAttribute("mode", "cached")
  } else {
    id('cached-btn').style.transform = "rotate(-90deg)"
    id('cached-btn').setAttribute("mode", "submit")
  }
})
id("bot-secret").addEventListener('keyup', () => { if(id("bot-secret").value === "") id('cached-btn').style.transform = "rotate(0deg)" })

let istyping = false;
setInterval(() => {
  if (currentchannel && Rsettings.typing && id("msgin").value === "") {
    ipcRenderer.send("typing", {
      stop: true,
      chid: currentchannel
    })
  }
}, 1500)
id("msgin").addEventListener("keypress", e => {
  if (!istyping) {
    ipcRenderer.send("typing", {chid:currentchannel, stop:true}) // is this the right one?
    istyping = true
  }
  if (id("msgin").value === "") {
    ipcRenderer.send("typing", {chid:currentchannel, stop:true})
    istyping = false
  }
  if (e.keyCode !== 13) return;
  if (!e.target.value) return;
  id('bs-helper').innerText = ''
  ipcRenderer.send("typing", {chid:currentchannel,stop:true})
  istyping = false;
  ipcRenderer.send("msgin", {msg: id('msgin').value, channel: currentchannel})
  id('msgin').value = ""
})
if(Object.keys(require("./config.json")).length > 0) {
  id('cached-btn').setAttribute('mode', 'cached')
}
id('cached-btn').addEventListener('click', () => {
  if(id('cached-btn').getAttribute("mode") === "cached") {
    if (id('cached').style.display == 'block') {
      id('cached').style.animation = 'slideIn 0.1s ease'
      setTimeout(() => id('cached').style.display = "none", 90)
    } else {
      id('cached').style.animation = 'slideOut 0.1s ease'
      id('cached').style.display = "block"
    }
  } else if(id('cached-btn').getAttribute("mode") === "submit") {
    if (!id("bot-secret").value) return;
    ipcRenderer.send("startbot", id("bot-secret").value)
  }
})
id('topt').addEventListener('click', () => {
  // id("container").style.display = 'none'
  // contextMenu.items[2].enabled = false;
  tray.setContextMenu(contextMenu)
  id('container').style.filter = "blur(2px)"
  id('bs').style.filter = "blur(2px)"
  id('topt').style.display = 'none'
  id('bs').style.display = 'none';
  id('options').style.display = "block"
  clearmodule("./settings.json")
  // Rsettings = require("./settings.json")
  // console.log(Rsettings)
  // populating settings with stored values
  if (Rsettings.cachedlength) id('cachedlength').value = Rsettings.cachedlength
  // remember, this does nothing because require() caches modules/json files, definitley need to change
  clearmodule("./config.json")
  if (!Object.keys(require("./config.json"))) {
    id("clearcache").disabled = true;
    id("clearcache").setAttribute('title', 'no tokens to clear')
  }
  id('devmode').checked = Rsettings.devmode
  id("typingIndicator").checked = Rsettings.typing
  id("logfile").checked = Rsettings.fileLogging
  id("scriptsenabled").checked = Rsettings.csenabled
  id("minimizeWhenClosed").checked = Rsettings.minimize
  id("cachetokens").checked = Rsettings.cachetokens
})
id("leaveopts").addEventListener("click", () => { // write settings to settings.json
  setTrayItems(); // for updating the options menu in the tray
  id('options').style.display = "none"
  let returnto = id('topt').getAttribute("returnTo")
  if(returnto === "bs") { id('bs').style.display = "block" }
  id('topt').style.display = 'block'
  id('bs').style.filter = "none"
  id('container').style.filter = "none"
  id('container').style.display = 'default'
  id('container').style.filter = "none"
  let settings = {
    cachedlength: id("cachedlength").value,
    devmode: id("devmode").checked,
    typing: id("typingIndicator").checked,
    fileLogging: id("logfile").checked,
    csenabled: id("scriptsenabled").checked,
    minimize: id("minimizeWhenClosed").checked,
    cachetokens: id('cachetokens').checked
  }
  let t = contextMenu.items[2].submenu.items;
  t[0].checked = settings.cachetokens;
  t[1].checked = settings.devmode;
  t[2].checked = settings.typing;
  t[3].checked = settings.csenabled;
  t[4].checked = settings.fileLogging;
  contextMenu.items[2].enabled = true;
  tray.setContextMenu(contextMenu)
  Rsettings = settings
  fs.writeFileSync("./settings.json", JSON.stringify(settings))
})
/**
 * @desc Sets the elements in #options to the correct values
 */
function refreshSettings() {
  // setTrayItems()
  clearmodule("./settings.json")
  Rsettings = require("./settings.json")
  id('cachedlength').value = Rsettings.cachedlength
  id('devmode').checked = Rsettings.devmode
  id("typingIndicator").checked = Rsettings.typing
  id("logfile").checked = Rsettings.fileLogging
  id("scriptsenabled").checked = Rsettings.csenabled
  id("minimizeWhenClosed").checked = Rsettings.minimize
  id('cachetokens').checked = Rsettings.cachetokens
}
ipcRenderer.on("refreshSettings", () => refreshSettings())
id("opt-restore-defaults").addEventListener("click", () => {
  ipcRenderer.send("confirm-restore-settings")
})
id('clearcache').addEventListener("click", () => {
  fs.writeFileSync("./config.json", "{ }")
  Array.from(document.querySelectorAll(".tcache")).forEach(e => e.remove())
  id('clearcache').disabled = true
  id("clearcache").setAttribute('title', 'no tokens to clear')
  document.querySelector("label[for='clearcache']").style.display = 'block'
  setTimeout(() => document.querySelector("label[for='clearcache']").style.display = 'none', 1500)
})
id('viewtokens').addEventListener('click', () => {
  ipcRenderer.send('addwindow', {url: "cachedtokens.html"})
})
function messageDeleted(id) {
  let messageElement = document.querySelector(`p[mid="${id}"]`)
  if (messageElement) messageElement.innerHTML += `<span class="message-reminder">(deleted)</span>`
}
// ipcRenderer.on("messageupdated", (event, message) => {
function messageUpdate(id, content) {
  let messageElement = document.querySelector(`p[mid="${id}"]`)
  if(messageElement) {
    let oldcontent = messageElement.innerText.replace("(edited, hover here to see previous content)", '');
    messageElement.innerText = content;
    messageElement.innerHTML += `<span class="message-reminder" title="${oldcontent}">(edited, hover here to see previous content)</span>`
  }
}
id("custom-script-input").addEventListener("change", e => {
  scriptreader.processFiles(e)
})