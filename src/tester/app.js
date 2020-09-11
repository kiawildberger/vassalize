const Discord = require("discord.js"), fs = require("fs");
let win, token;
let client = new Discord.Client();
client.on('ready', () => {
    console.log(client.user.tag)
    process.exit(0)
})
client.on('error', () => {
    console.log("nope")
    process.exit(1)
})
process.on("unhandledRejection", () => {
    console.log("nope")
    process.exit(1)
})

client.login(process.argv[2])