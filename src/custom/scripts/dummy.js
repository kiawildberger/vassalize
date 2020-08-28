//&name dummy
//&desc literally stupid

exports.init = function(client) {
  console.log(client.user.username+"#"+client.user.discriminator + " has signed in!")
  return "LOGGED IN"
}

exports.message = function(message, channel) {
  if(message.author.bot) return;
  message.channel.send("what a nerd, who says \""+message.content+"\"")
}
