const { ipcRenderer } = require("electron")
function id(e) { return document.getElementById(e) }

let currentchannel;

ipcRenderer.on("msg", (event, arg) => {
    let ul = document.createElement("ul")
    ul.classList.add("msg")
    ul.textContent = arg.msg.author.username+"#"+arg.msg.author.discriminator+": "+arg.msg.content
    ul.setAttribute("data-channel", arg.msg.channel)
    id("msgdisplay").appendChild(ul)
})

let logged;
ipcRenderer.on("log", (event, args) => {
    logged = args
})

id("msgin").addEventListener("keypress", e => {
    if(e.keyCode !== 13) return;
    ipcRenderer.send("msgin", {
        msg: id("msgin").value, 
        channel: id('msgdisplay').children[id('msgdisplay').children.length-1].getAttribute("data-channel")
    })
    id('msgin').value = ""
})