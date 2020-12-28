# Vassalize

Control <sup>(hijack)</sup> a discord bot!

It can read/send messages and view attachments, which is all discord really does anyways.

### Upcoming features:
- [ ] add/update vassalize documentation
- [x] minimize to tray isnt as buggy anymore
- [ ] view cached tokens
- [x] access options before logging in
- [ ] status polishing
- [x] timestamps, deleted messages, edits
- [ ] be able to send custom emojis
- [ ] display embeds (just straight embeds)
- [ ] server select div scroll on overflow

You can check the bottom of src/app.js for a much more frequently-updated todo list.

---

## Notable features

- Replaces **every appearance** of `/shrug` with `¯\_(ツ)_/¯` in outgoing messages.
- Allows for quick automation with [scripts](#Scripts).
- Can be used as a bot hosting method with scripts and auto-start enabled.

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

If you spot one of the many issues, feel free to report it on the [issue page](https://github.com/kiawildberger/vassalize/issues)!
