const { ipcRenderer } = require("electron")
function id(e) { return document.getElementById(e) }

ipcRenderer.on("msg", (event, arg) => {
    let ul = document.createElement("ul")
    ul.classList.add("msg")
    let ct = arg.msg.content
    let mt = ct.match(/.*#[0-9]{4}/)
    if(mt) {
        mt = mt[0]
        mt = mt.split("@")
        let sp = []
        mt.forEach(e => {
            if(e) sp.push(`<span class="png">@${e}</span>`)
        })
        ct = ct.replace(/@.*#\d{4}/, sp.join(" "))
    }
    ul.innerHTML = arg.msg.author.username + "#" + arg.msg.author.discriminator + ": " + ct
    ul.setAttribute("data-channel", arg.msg.channel)
    id("msgdisplay").appendChild(ul)
    id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight
})

let gids, gna = [], ccids = [], cna = [];
ipcRenderer.on("gids", (event, arg) => {
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
})
let currentchannel;
id('guilds').addEventListener('change', e => {
    if(e.target.value === "none") {
        id('channels').innerHTML = '<option>none</option>'
        id('msgdisplay').innerText = ''
        return;
    }
    id('msgdisplay').innerText = ''
    let idx = gna.indexOf(e.target.value)
    ipcRenderer.send("rcids", idx)
})

id('channels').addEventListener("change", () => id('msgdisplay').innerText = '')

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
})

id('bot-secret').addEventListener("keypress", e => {
    if(e.keyCode != 13) return;
    ipcRenderer.send("startbot", e.target.value)
    id('bs').style.display = "none"
    document.querySelector('.container').style.display = "block"
})

id("msgin").addEventListener("keypress", e => {
    if (e.keyCode !== 13) return;
    if(id("channels").value === "")
    currentchannel = ccids[cna.indexOf(id('channels').value)]
    ipcRenderer.send("msgin", {
        msg: id("msgin").value,
        channel: currentchannel
    })
    id('msgin').value = ""
})