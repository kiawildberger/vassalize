const { ipcRenderer, shell } = require("electron")
const fs = require('fs')
const ps = require("./ps")
let conf = require('./config.json')
let confp = require.resolve('./config.json')
let Rsettings = require("./settings.json")
let botActor;
function id(e) { return document.getElementById(e) }

let loggedin = false;
let cdnUrl = /https?:\/\/cdn.discordapp.com\/attachments\/\d+\/\d+\/[a-zA-Z0-9_-]+\.[a-zA-Z]{2,5}/g
let imagetypes = ["jpg", "JPG", 'png', 'PNG', 'gif', 'GIF', 'webp', 'WEBP', 'tiff', 'TIFF', 'jpeg', 'JPEG', 'svg', 'SVG']


// populate settings with appropriate values
if (Rsettings.cachedlength) id('cachedlength').value = Rsettings.cachedlength

if (!conf[0]) {
    id("clearcache").disabled = true;
    id("clearcache").setAttribute('title', 'its empty anyways')
}

// voice?

let gids, gna = [], ccids = [], cna = [], vcids = [], vcna = []; // gids is guild ids, gna is guild names, ccids is channel ids and cna is channel names
ipcRenderer.on("msg", processmsg)
function processmsg(event, arg) {
    // console.log(arg.msg)
        let e = ccids[cna.indexOf(id('channels').value)]
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
                    if (e && e !== botActor.full) sp.push(`<span class="ping">@${e}</span>`)
                    if(e && e === botActor.full) sp.push(`<span class="selfping">@${e}</span>`)
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
            if(arg.msg.content.match(cdnUrl)) {
                arg.msg.content.match(cdnUrl).forEach(e => {
                    let d = e.split('.')
                    d = d[d.length-1]
                    console.log(d)
                    if(imagetypes.includes(d)) { // is an image we support and want to use
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

function dGids(arg) { // generates and populates guild list..?
    if (!loggedin) return;
    let nn = document.createElement('option')
    nn.setAttribute("value", "none")
    nn.innerText = "none"
    id('guilds').appendChild(nn)
    arg.forEach(e => {
        let opt = document.createElement("option")
        opt.setAttribute("value", e.name)
        opt.innerText = e.name
        id('guilds').appendChild(opt)
        gna.push(e.name)
    })
    gids = arg
    id('bs').style.display = "none"
    document.querySelector('.container').style.display = "block"
}
let currentchannel;
id('guilds').addEventListener('change', e => {
    if (e.target.value === "none") {
        id('channels').innerHTML = '<option>none</option>'
        id('msgdisplay').innerText = ''
        id('guild-channels').style.display = "none"
        return;
    }
    id('msgdisplay').innerText = ''
    id('guild-channels').style.display = "block"
    let idx = gna.indexOf(e.target.value)
    ipcRenderer.send("rcids", idx)
})

id('channels').addEventListener("change", () => {
    id('msgdisplay').innerText = ''
    currentchannel = ccids[cna.indexOf(id('channels').value)]
    ipcRenderer.send("cachedmessages", currentchannel, Rsettings.cachedlength)
    id('errout').innerHTML = ''
})

ipcRenderer.on("cids", (event, arg) => {
    id('channels').innerHTML = ''
    arg.forEach(e => {
        let opt = document.createElement("option")
        opt.setAttribute("value", e.name)
        opt.innerText = e.name
        id('channels').appendChild(opt)
        ccids.push(e.id)
        cna.push(e.name)
    })
    id("channels").dispatchEvent(new Event("change"))
})

ipcRenderer.on("valid-token", (event, arg) => {
    id('bs-helper').innerText = "success!"
    id("bs-helper").style.color = "green"
    loggedin = true;
    botActor = arg.user
    setTimeout(() => {
        id('userd').innerHTML = `acting as <b>${arg.user.full}</b>`
        document.title = arg.user.full
        dGids(arg.gids)
    }, 800)
})

ipcRenderer.on("apierror", (event, arg) => {
    if (arg.custom) {
        id('errout').innerHTML = arg.custom
    }
    if (arg === "missing access") {
        id('errout').innerHTML = "cannot read message history - missing permissions"
    }
})

ipcRenderer.on("invalid-token", (event, arg) => { // arg should be "invalid"
    id('bs-helper').innerText = "client could not log in, try again"
    id('bs-helper').style.color = "red"
    setTimeout(() => {
        id('bs-helper').innerText = ''
    }, 2000)
})
ipcRenderer.on("logpls", (event, arg) => {
    console.log(arg)
})

if (conf) {
    for (let i in conf) {
        let r = document.createElement("div")
        if(id('no-recent-logins')) id('no-recent-logins').remove()
        r.classList.add("tcache")
        r.innerText = i;
        r.addEventListener("click", () => {
            ipcRenderer.send("startbot", conf[i])
        })
        id('cached').appendChild(r)
    }
}

id('bot-secret').addEventListener("keypress", e => {
    if (e.keyCode != 13) return;
    if (!e.target.value) return;
    ipcRenderer.send("startbot", e.target.value)
})
id('bs-btn').addEventListener("click", e => {
    if(!id('bot-secret').value) return;
    console.log(id('bot-secret').value)
    ipcRenderer.send("startbot", id("bot-secret").value)
})

id("msgin").addEventListener("keypress", e => {
    if (e.keyCode !== 13) return;
    if (!e.target.value) return;
    id('bs-helper').innerText = ''
    currentchannel = ccids[cna.indexOf(id('channels').value)]
    if (!id('channels').value) currentchannel = ccids[0]
    // console.log(currentchannel)
    ipcRenderer.send("msgin", {
        msg: id("msgin").value,
        channel: currentchannel
    })
    id('msgin').value = ""
})

id('cached-btn').addEventListener('click', () => {
    if(id('cached').style.display == 'block') {
        id('cached').style.display = "none"
    } else {
        id('cached').style.display = "block"
    }
})
id('topt').addEventListener('click', () => {
    id('options').style.display = "block"
})
id("leaveopts").addEventListener("click", () => { // write settings to settings.json
    id('options').style.display = "none"
    let settings = {
        cachedlength: id("cachedlength").value
    }
    fs.writeFileSync("./settings.json", JSON.stringify(settings))
})
id('clearcache').addEventListener("click", () => {
    fs.writeFileSync("./config.json", "{ }")
    document.querySelector("label[for='clearcache']").style.display = 'block'
    setTimeout(() => document.querySelector("label[for='clearcache']").style.display = 'none', 1500)
})