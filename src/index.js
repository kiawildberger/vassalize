const { ipcRenderer } = require("electron")
function id(e) { return document.getElementById(e) }

ipcRenderer.on("msg", (event, arg) => {
    let ul = document.createElement("ul")
    ul.classList.add("msg")
    ul.textContent = arg.msg.author.username + "#" + arg.msg.author.discriminator + ": " + arg.msg.content
    ul.setAttribute("data-channel", arg.msg.channel)
    id("msgdisplay").appendChild(ul)
    id('msgdisplay').scrollTop = id('msgdisplay').scrollHeight
})

let gids, gna = [], ccids = [], cna = [];
ipcRenderer.on("gids", (event, arg) => {
    arg.forEach(e => {
        let opt = document.createElement("option")
        opt.setAttribute("value", e.name)
        opt.innerText = e.name
        id('guilds').appendChild(opt)
        gna.push(e.name)
    })
    gids = arg
    console.log(gna)
})
let currentchannel;
id('guilds').addEventListener('change', e => {
    // let r = e.target.innerText.split("\n")
    // let guild = gids[r.indexOf(e.target.value)] // is guild ig
    // let guild = gids[gna.indexOf(e.target.value)].id
    let idx = gna.indexOf(e.target.value)
    ipcRenderer.send("rcids", idx)
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
})

id("msgin").addEventListener("keypress", e => {
    if (e.keyCode !== 13) return;
    currentchannel = ccids[cna.indexOf(id('channels').value)]
    ipcRenderer.send("msgin", {
        msg: id("msgin").value,
        channel: currentchannel
    })
    id('msgin').value = ""
})