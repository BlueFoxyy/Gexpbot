exports.run = (client, message, args) => {
  if(!args || args.length < 1) {
    client.commands.keyArray().forEach(commandName => {
      // the path is relative to the *current folder*, so just ./filename.js
      delete require.cache[require.resolve(`./${commandName}.js`)];
      // We also need to delete and reload the command from the client.commands Enmap
      client.commands.delete(commandName);
    });
    delete require.cache[require.resolve("../config.json")];
    delete require.cache[require.resolve("../dbconfig.json")];
    fs = require('fs');
    fs.readdir("./commands/", (err, files) => {
      if (err) return console.error(err);
      files.forEach(file => {
        if (!file.endsWith(".js")) return;
        let props = require(`./${file}`);
        let commandName = file.split(".")[0];
        console.log(`Attempting to load command ${commandName}`);
        client.commands.set(commandName, props);
      });
    });
    const config = require('../configs/config.json');
    client.config = config;
    const dbconfig = require('../configs/dbconfig.json');
    client.dbconfig = dbconfig;
    client.apiconfig = require('../configs/apiconfig.json');
    client.cmdconfig = require('../configs/cmdconfig.json');
    message.reply(`All commands and configuration has been reloaded!`);
  } else {
    const commandName = args[0];
    // Check if the command exists and is valid
    if(!client.commands.has(commandName)) {
      return message.reply("That command does not exist");
    }
    // the path is relative to the *current folder*, so just ./filename.js
    delete require.cache[require.resolve(`./${commandName}.js`)];
    // We also need to delete and reload the command from the client.commands Enmap
    client.commands.delete(commandName);
    const props = require(`./${commandName}.js`);
    client.commands.set(commandName, props);
    message.reply(`The command ${commandName} has been reloaded`);
}
};
