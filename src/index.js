const { ipcRenderer } = require("electron")
let conf = require('./config.json')
function id(e) { return document.getElementById(e) }

let loggedin = false;


let gids, gna = [], ccids = [], cna = [];
ipcRenderer.on("msg", (event, arg) => {
    ccids.forEach(e => {
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
                    if (e) sp.push(`<span class="png">@${e}</span>`)
                })
                ct = ct.replace(/@.*#\d{4}/, sp.join(" "))
            }
            ul.innerHTML = arg.msg.author.username + "#" + arg.msg.author.discriminator + ": " + ct
            ul.setAttribute("data-channel", arg.msg.channel)
            id("msgdisplay").appendChild(ul)
            id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight
        }
    })
})

function dGids(arg) {
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
        return;
    }
    id('msgdisplay').innerText = ''
    let idx = gna.indexOf(e.target.value)
    ipcRenderer.send("rcids", idx)
})

id('channels').addEventListener("change", () => {
    id('msgdisplay').innerText = ''
    currentchannel = ccids[cna.indexOf(id('channels').value)]
    ipcRenderer.send("cachedmessages", currentchannel)

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
    setTimeout(() => {
        id('userd').innerText = arg.user
        dGids(arg.gids)
    }, 1000)
})
ipcRenderer.on("invalid-token", (event, arg) => { // arg should be "invalid"
    id('bs-helper').innerText = "client could not log in, try again"
    id('bs-helper').style.color = "red"
})
ipcRenderer.on("cached", (event, arg) => {
    console.log(arg)
})

if (conf) {
    for (let i in conf) {
        let r = document.createElement("ul")
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

id("msgin").addEventListener("keypress", e => {
    if (e.keyCode !== 13) return;
    if (!e.target.value) return;
    id('bs-helper').innerText = ''
    currentchannel = ccids[cna.indexOf(id('channels').value)]
    if (!id('channels').value) currentchannel = ccids[0]
    console.log(currentchannel)
    ipcRenderer.send("msgin", {
        msg: id("msgin").value,
        channel: currentchannel
    })
    id('msgin').value = ""
})