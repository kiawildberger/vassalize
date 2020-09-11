//&name dummy
//&desc literally stupid

exports.init = function(client) {
  console.log("bro its "+client.user.username+"!")
}

exports.message = function(message) {
  if(message.author.bot || message.channel.guild.id === 658043882000482305) return;
  message.channel.send("where can i buy one of these")
  // message.channel.send("im not trying to be annoying please forgive me")
}
