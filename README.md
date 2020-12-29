# Vassalize

Control <sup>(hijack)</sup> a discord bot!

**I'm not stealing bot tokens, go dig through the code if you don't trust me. Look for appearances of "./config.json" and id("bot-secret")**

### Features:
- minimize to tray for cleanliness
- see user media (videos, images, etc)
- replaces `/shrug` with `¯\_(ツ)_/¯`
- allows for quick automation with custom scripts
- caches tokens for easier login (can be disabled for security of course)

### Upcoming features:
- [ ] add/update vassalize documentation
- [ ] view cached tokens
- [ ] status polishing
- [ ] be able to send custom emojis
- [ ] display embeds
- [ ] server select div scroll on overflow

You can check the bottom of src/app.js for a much more frequently-updated todo list.

---

### Scripts

Vassalize provides a way for users to automate the processing of messages with user-provided scripts. A basic vassalize script file (.js) has a structure like shown:
```js
//&name <name>
//&desc <description>
exports.init = function(client) {
  // code here
}
exports.message = function(message, currentchannel) {
  // code here
}
```
The script can have as much or as little code as you need, but as long as the `&name`, `&desc`, `init` and `message` properties are present, vassalize will accept it as a script. Only single-line comments will work with the &name and &desc properties for the time being.
The `client` and `message` arguments to `init` and `message` respectively are directly from discord.js. Refer to the [documentation](https://discord.js.org/#/docs/main/stable/general/welcome) for details on discord.js.

To run the script, make sure the "Allow custom scripts to run" option is checked, import your file, and enable it.

Custom scripts log messages to the system console, so users who wish to see console messages will have to run via `npm start` rather than the executable. The return values of all functions are displayed in `src/logfile` This might change in the future.

---

If you spot an issue, feel free to report it on the [issue page](https://github.com/kiawildberger/vassalize/issues)!
