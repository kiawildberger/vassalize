console.log = function(str){ require("fs").appendFile("./logfile", str+"\n", () => {}) };
//&name dummy
//&desc testbed file bruv

exports.init = function(client) {
  console.log(client.user.username)
}

exports.message = function(message) {
  console.log(message.author.discriminator)
}
