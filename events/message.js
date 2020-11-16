module.exports = (client, message) => {
  // Ignore all bots
  if (message.author.bot && message.author.id != client.user.id) return;

  // Ignore private messages
  if (!message.guild && message.author.id != client.user.id) {
    message.channel.send("Sorry but I only work in servers!")
      .catch(console.error);
    return;
  }
  if (!message.guild)
    return;

  // Ignore messages not starting with the prefix (in guild settings)
  if (!message.content.startsWith(client.settings.get(message.guild.id).prefix)) return;

  /*
  if (message.channel.id !== client.settings.get(message.guild.id).channels.botland && !member.hasPermission("ADMINISTRATOR")) {
    message.reply('Please do not send commands here, use <#'+client.settings.get(message.guild.id).channels.botland+'> instead.').catch(console.error);
    message.delete().catch(console.error);
    return;
  }
 */
  // Our standard argument/command name definition.
  const args = message.content.slice(client.settings.get(message.guild.id).prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Grab the command data from the client.commands Enmap
  const cmd = client.commands.get(command);

  // If that command doesn't exist, silently exit and do nothing
  if (!cmd) {
    message.channel.send(`Command \`${command}\` doesn't exist!`);
    return;
  }

  // Check if the user has the required permissions
  let pass = true;

  // LOCK DOWN
  member = message.member;

  /***
  if ( !member.hasPermission("ADMINISTRATOR") ) {
    message.channel.send("This bot is currently on lock down.\nDue to <@480364364038406149>'s mental issues.\nHe will be fixing this bot soon <3.")
    return;
  }
  ***/

  for (const perm of eval(`client.cmdconfig.commands.${command}`).permissions)  {
    if (perm === "OWNER") {
      if (message.author.id != client.config.ownerID) {
        message.channel.send("You're not my master why are you ordering me?");
        pass = false;
      }
    } else if(perm === "GUILD_OWNER") {
      if (message.author.id != client.config.guildOwnerID) {
        message.channel.send(`Only ${client.users.cache.get(client.config.guildOwnerID).username} can use this command!`);
        pass = false;
      }
    } else if(message.author.id != client.config.ownerID) {
      if(!member.hasPermission(perm)) {
        message.reply(`You need \`${perm}\` in order to perform this command!`);
        pass = false;
      }
    }
  }
  if (!pass) return;

  for (let i in args) {
    args[i] = args[i].replace(/[\\<>@#&!]/g, "");
  }

  // Run the command
  console.log('------------------------------------------');
  console.log(`"${message.author.username}#${message.author.discriminator} <${message.author.id}>" invoked command "${command}"`);
  console.log(`Arguments: [${args}]`);
  cmd.run(client, message, args);
};
