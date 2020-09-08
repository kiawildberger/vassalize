//&name dummy
//&desc literally stupid

exports.init = function(client) {
  console.log("fuck me, its "+client.user.username+"!")
}

exports.message = function(message) {
  if(message.author.bot) return;
  // if(message.channel.guild.id === 658043882000482305) return;
  console.log(message.channel.guild.id)
  message.channel.send("im not trying to be annoying please forgive me")
}
