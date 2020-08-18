const { ipcRenderer, shell } = require("electron")
const fs = require('fs')
const ps = require("./ps.js")
const elebar = require("electron-titlebar")
let conf, confp;
if (!fs.existsSync("./config.json")) {
    fs.writeFileSync("./config.json", "{ }")
} else {
    conf = require('./config.json')
    confp = require.resolve("./config.json")
}
let Rsettings = require("./settings.json")
let botActor;
function id(e) { return document.getElementById(e) }

let loggedin = false;
let cdnUrl = /https?:\/\/cdn.discordapp.com\/attachments\/\d+\/\d+\/[a-zA-Z0-9_-]+\.[a-zA-Z]{2,5}/g
let imagetypes = ["jpg", "JPG", 'png', 'PNG', 'gif', 'GIF', 'webp', 'WEBP', 'tiff', 'TIFF', 'jpeg', 'JPEG', 'svg', 'SVG']
let gids = [], index = 0, currentchannel;
ipcRenderer.on("msg", processmsg)
function processmsg(event, arg) {
    let e;
    gids[index].channels.forEach(o => {
        if (o.id === currentchannel) {
            e = currentchannel
        }
    })
    if (e == arg.msg.channel) {
        let ul = document.createElement("ul")
        ul.classList.add("msg")
        ul.classList.add("collection-item")
        let ct = arg.msg.content
        let mt = ct.match(/.*#[0-9]{4}/)
        if (mt) {
            mt = mt[0]
            mt = mt.split("@")
            let sp = []
            mt.forEach(e => {
                if (e && e !== document.title) sp.push(`<span class="ping">@${e}</span>`)
                if (e && e === document.title) sp.push(`<span class="selfping">@${e}</span>`)
            })
            ct = ct.replace(/@.*#\d{4}/, sp.join(" "))
        }
        let isimg = false;
        ul.innerHTML = arg.msg.author.username + "#" + arg.msg.author.discriminator + ": " + ct
        if (arg.msg.images) {
            isimg = true;
            arg.msg.images.forEach(q => {
                let img = document.createElement("img")
                img.classList.add("user-img")
                img.src = q.url
                img.title = q.url
                ul.appendChild(img)
                img.addEventListener('click', () => { shell.openExternal(q.url) }) // shell.openExternal opens links in default browser, not electron
                img.addEventListener("load", () => id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight)
                // i guess the failed image doesn't send an error event???
                // img.addEventListener("error", () => { img.tagName = "p"; img.textContent = "failed to load image" })
            })
        }
        if (arg.msg.content.match(cdnUrl)) {
            arg.msg.content.match(cdnUrl).forEach(e => {
                let d = e.split('.')
                d = d[d.length - 1]
                console.log(d)
                if (imagetypes.includes(d)) { // is an image we support and want to use
                    let img = document.createElement('img')
                    img.classList.add('user-img')
                    img.src = e
                    img.title = e
                    img.addEventListener('click', () => { shell.openExternal(e) })
                    ul.appendChild(img)
                    img.addEventListener("load", () => id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight)
                }
            })
        }
        ul.setAttribute("data-channel", arg.msg.channel)
        id("msgdisplay").appendChild(ul)
        if (!isimg) { id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight }
    }
}

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
        e.addEventListener("click", () => {
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
            id('channellist').innerHTML = `<div class="channel-label">channels</div>`
            let server = gids[e.getAttribute('data-index')]
            server.channels.forEach(e => { // server.channels.forEach
                let elm = document.createElement("div")
                elm.classList.add("channel-item")
                elm.textContent = "#" + e.name
                elm.setAttribute('data-id', e.id)
                elm.addEventListener("click", () => {
                    currentchannel = e.id
                    q = [...document.querySelectorAll(".activechannel")]
                    q.forEach(e => { e.classList.remove("activechannel") })
                    elm.classList.add("activechannel")
                    id('msgdisplay').innerHTML = ''
                    ipcRenderer.send("getChannelContent", e.id)
                })
                id("channellist").appendChild(elm)
                if (server.channels.indexOf(e) === 0) elm.dispatchEvent(new Event('click'))
            })
        })
    })
    id('bs').style.display = "none"
    document.querySelector('.container').style.display = "block"
}

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
                ipcRenderer.send("startbot", conf[i])
            })
            id('cached').appendChild(r)
        }
    }
}
checkCached()

ipcRenderer.on("validtoken", (event, args) => { // the *one* ipc i will use
    if (args.bot && args.guildInfo) {
        botActor = args.botActor, gids = args.guildInfo
    }
    id('bs-helper').innerText = "success!"
    id("bs-helper").style.color = "green"
    loggedin = true;
    setTimeout(() => {
        id('userd').innerHTML = `acting as <b>${args.bot.full}</b>`
        document.title = args.bot.full
        // id('titlebar-title').textContent = args.bot.full
        id('bs-helper').innerText = ''
        fillGuildSelect(args.guildInfo)
    }, 800)
})
id('bot-secret').addEventListener("keypress", e => {
    if (e.keyCode != 13) return;
    if (!e.target.value) return;
    ipcRenderer.send("startbot", e.target.value)
})
id('bs-btn').addEventListener("click", e => {
    if (!id('bot-secret').value) return;
    ipcRenderer.send("startbot", id("bot-secret").value)
})
id("msgin").addEventListener("keypress", e => {
    if (e.keyCode !== 13) return;
    if (!e.target.value) return;
    id('bs-helper').innerText = ''
    console.log(gids)
    console.log(index)
    console.log(currentchannel)
    ipcRenderer.send("msgin", {
        msg: id("msgin").value,
        channel: currentchannel
    })
    id('msgin').value = ""
})
id('cached-btn').addEventListener('click', () => {
    if (id('cached').style.display == 'block') {
        id('cached').style.display = "none"
    } else {
        id('cached').style.display = "block"
    }
})
id('topt').addEventListener('click', () => {
    document.querySelector('.container').style.display = 'none'
    id('options').style.display = "block"
    // populate settings with stored values
    if (Rsettings.cachedlength) id('cachedlength').value = Rsettings.cachedlength
    if (!Object.keys(require("./config.json"))) {
        id("clearcache").disabled = true;
        id("clearcache").setAttribute('title', 'no tokens to clear')
    }
    if (Rsettings.devmode) {
        id('devmode').checked = true // on/off tho
    } else { id("devmode").checked = false }
})
id("leaveopts").addEventListener("click", () => { // write settings to settings.json
    id('options').style.display = "none"
    document.querySelector('.container').style.display = 'block'
    let dvm;
    if (id('devmode').value == "on") {
        dvm = true
    } else { dvm = false }
    let settings = {
        cachedlength: id("cachedlength").value,
        devmode: dvm // bool
    }
    fs.writeFileSync("./settings.json", JSON.stringify(settings))
})
id('clearcache').addEventListener("click", () => {
    fs.writeFileSync("./config.json", "{ }")
    id('clearcache').disabled = true
    id("clearcache").setAttribute('title', 'no tokens to clear')
    document.querySelector("label[for='clearcache']").style.display = 'block'
    setTimeout(() => document.querySelector("label[for='clearcache']").style.display = 'none', 1500)
})