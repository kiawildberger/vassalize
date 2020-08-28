const fs = require("fs"),
  byline = require("byline");
const {
  ipcRenderer
} = require("electron")

// if(!fs.existsSync("./scripts.json")) fs.writeFileSync("./scripts.json", "[]")
let scripts = require("./scripts.json")
exports.scripts = scripts
const firstLine = `console.log = function(str){ require("fs").appendFile("./logfile", str+"\\n", () => {}) };\n`

function updateRefresh(e) {
  fs.writeFileSync("./scripts.json", JSON.stringify(e))
  ipcRenderer.send("refreshScripts")
}

function createScriptHTML(script) {
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
    console.log(scripts)
    updateRefresh(scripts)
    input.value = (script.enabled) ? "Disable" : "Enable";
  })
  ul.appendChild(input)
  let p = document.createElement("p")
  p.className = "cs-close"
  p.textContent = "X"
  p.title = "remove " + script.name + " from script library"
  p.addEventListener("click", () => {
    scripts.splice(scripts.indexOf(script), 1)
    updateRefresh(scripts)
    ul.remove()
  })
  ul.appendChild(p)
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
    cfirstline = firstLine
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
      path: "./custom/" + filename + ".js",
      opath: e.path
    }
    scripts.push(csobj)
    if (fullfile.includes(firstLine)) {
      fs.writeFileSync("./custom/" + filename + ".js", fullfile)
    } else {
      fs.writeFileSync("./custom/" + filename + ".js", cfirstline + fullfile)
    }
    createScriptHTML(csobj)
  })
  fs.writeFileSync("./scripts.json", JSON.stringify(scripts))
  ipcRenderer.send("refreshScripts")
  exports.scripts = scripts
}
