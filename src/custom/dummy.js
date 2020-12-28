//&name dummy
//& testing script

exports.init = (client) => {
    console.log(client.user.username)
    return client.user.username
}

exports.message = (message, currentchannel) => {
    console.log(message.content);
    return message.content;
}