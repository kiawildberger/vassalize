//&name dummy
//&desc literally stupid

exports.init = function(client) {
  console.log(client.user.username+"#"+client.user.discriminator + " has signed in!")
}

exports.message = function(message, channel) {
  console.log(message.author.username)
  return channel.title
}