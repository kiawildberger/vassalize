# Rubber

Control <sup>(hijack)</sup> a discord bot!

It can read/send messages and view attachments (videos soon!), which is all discord really does anyways.

### Upcoming features:
- beautifying the way messages are displayed
- videos
- minimizing to tray to keep the bot online
    - user can provide scripts for the bot

You can check src/app.js for a more frequently-updated todo list.

---

### Scripts

Vassalize provides a way for users to automate the processing of messages with user-provided scripts. A basic vassalize script file (.js) has a structure like shown:
```js
//&name <name>
//&desc <description>
exports.init = function(client) {
  // code here
}
exports.message = function(message) {
  // code here
}
```
The script can have as much or as little code as you need, but as long as the `&name` and `&desc`, and the`init` and `message` properties are present, vassalize will accept it as a script.
The `client` and `message` arguments to `init` and `message` respectively are straight from discord.js. Refer to the (documentation)[https://discord.js.org/#/docs/main/stable/general/welcome] for details.

To run the script, make sure the "Allow custom scripts to run" option is checked, import your file, and enable it. After reloading, it should run.

Custom scripts log messages to src/logfile instead of the system console allow for testing/debugging of scripts when not running with npm.

---

If you spot one of the many issues, feel free to report it on the [issue page](https://github.com/kiawildberger/vassalize/issues)!
