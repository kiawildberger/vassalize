# Vassalize

Control <sup>(hijack)</sup> a discord bot!

It can read/send messages and view attachments (videos soon!), which is all discord really does anyways.

### Upcoming features:
- [ ] add/update vassalize documentation
- [ ] prevent code injection
- [ ] fix logfile to actually work
- [ ] fixing minimize to tray because right now it's a buggy mess<sup>just like the rest of vassalize</sup>
- [ ] view cached tokens
- [ ] access options before logging in
- [ ] status polishing
- [ ] timestamps, deleted messages, edits
  - [x] deleted messages are marked as deleted
- [ ] be able to send custom emojis
- [ ] display embeds (just straight embeds)
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
The script can have as much or as little code as you need, but as long as the `&name`, `&desc`, `init` and `message` properties are present, vassalize will accept it as a script.
The `client` and `message` arguments to `init` and `message` respectively are straight from discord.js. Refer to the [documentation](https://discord.js.org/#/docs/main/stable/general/welcome) for details on discord.js.

To run the script, make sure the "Allow custom scripts to run" option is checked, import your file, and enable it. After reloading the app, it should run.

Custom scripts log messages to the system console, so users who wish to see console messages will have to run via `npm start` rather than the executable. The return values of all functions are displayed in `src/logfile` This might change in the future.

---

If you spot one of the many issues, feel free to report it on the [issue page](https://github.com/kiawildberger/vassalize/issues)!
