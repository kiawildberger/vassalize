const fs = require("fs");
let Rsettings = require("./settings.json")
const {
  ipcRenderer
} = require("electron")

// if(!fs.existsSync("./scripts.json")) fs.writeFileSync("./scripts.json", "[]")
let scripts = require("./scripts.json")
exports.scripts = scripts
function updateRefresh(e) {
  e.forEach(q => {
    if(!fs.existsSync(q.opath)) return;
    let fullfile = fs.readFileSync(q.path, "utf-8"), ofile = fs.readFileSync(q.opath, "utf-8")
    // console.log((fullfile === ofile))
    if(fullfile !== ofile) {
      fs.writeFileSync(q.path, ofile) // rewrites file in /scripts/ to match original
    }
  })
  fs.writeFileSync("./scripts.json", JSON.stringify(e))
  ipcRenderer.send("refreshScripts")
}
exports.update = updateRefresh
require("clear-module")("./settings.json"); Rsettings = require("./settings.json")
function logFile(e) {if (Rsettings.fileLogging) fs.appendFile("./logfile", e + "\n", () => {})}

function refreshJSONFromFile(script) {
  let fullfile = fs.readFileSync(script.path, "utf-8"),
    name, desc, iLines = fullfile.split("\n");
  iLines = iLines.filter(el => el != "")
  iLines.forEach(line => {
    if (line.includes("&name")) {
      script.name = line.replace("//", '').replace("&name", '').trim()
    }
    if (line.includes("&desc")) {
      script.desc = line.replace("//", '').replace("&desc", '').trim()
    }
  })
  if(scripts.indexOf(script) > -1) scripts.splice(scripts.indexOf(script), 1)
  scripts.push(script)
}

function createScriptHTML(script) {
  refreshJSONFromFile(script)
  let ul = document.createElement("ul");
  ul.classList.add("customscript-ul");
  ul.title = script.opath
  ul.setAttribute("cs-enabled", script.enabled)
  let buttonenabled = (script.enabled) ? "Disable" : "Enable";
  ul.innerHTML = `<h4 class="name">${script.name}</h4>
  <p class="desc">${script.desc}</p>`
  let input = document.createElement("input")
  input.type = "button"
  input.classList.add("cs-toggle")
  input.value = buttonenabled
  input.addEventListener("click", () => {
    if (!script.enabled) {
      script.enabled = true
    } else {
      script.enabled = false
    }
    updateRefresh(scripts)
    input.value = (script.enabled) ? "Disable" : "Enable";
  })
  let p = document.createElement("input")
  p.className = "cs-close"
  p.value = "Remove"
  p.type = "button"
  p.style.float = "right"
  p.title = "remove " + script.name + " from script library and delete file"
  p.addEventListener("click", () => {
    scripts.splice(scripts.indexOf(script), 1)
    updateRefresh(scripts)
    if(!fs.existsSync(script.path)) {
      logFile("[Scripts] could not delete file "+script.path+" because it did not exist")
      ul.remove()
      return;
    }
    fs.unlinkSync(script.path)
    logFile("[Scripts] deleted "+script.path)
    ul.remove()
  })
  ul.appendChild(p)
  ul.appendChild(input)
  p.style.margin = 0
  input.style.margin = 0
  input.style.marginRight = "0.5em"
  document.getElementById("cscript-list").appendChild(ul)
}
scripts.forEach(e => {
  if (!fs.existsSync(e.path)) {
    scripts = scripts.splice(scripts.indexOf(e), 1)
    if (scripts.length === 1) scripts = []
    fs.writeFileSync("./scripts.json", JSON.stringify(scripts))
    return;
  }
  createScriptHTML(e)
})

exports.processFiles = function(q) {
  Array.from(q.target.files).forEach(e => { // can use "./custom/"+e.name or e.path to get path, not sure which one is "correct"
    let fullfile = fs.readFileSync(e.path, "utf-8"),
      name, desc, iLines = fullfile.split("\n");
    iLines = iLines.filter(el => el != "")
    iLines.forEach(line => {
      if (line.includes("&name")) {
        name = line.replace("//", '').replace("&name", '').trim()
      }
      if (line.includes("&desc")) {
        desc = line.replace("//", '').replace("&desc", '').trim()
      }
    })
    let filename = name.split(" ")[0]
    let csobj = {
      name: name,
      desc: desc,
      enabled: false,
      path: "./custom/scripts/" + filename + ".js",
      opath: e.path
    }
    scripts.push(csobj)
    fs.writeFileSync("./custom/scripts/" + filename + ".js", fullfile)
    createScriptHTML(csobj)
  })
  fs.writeFileSync("./scripts.json", JSON.stringify(scripts))
  ipcRenderer.send("refreshScripts")
  exports.scripts = scripts
}
