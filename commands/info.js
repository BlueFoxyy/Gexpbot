exports.run = (client, message, args) => {
  const Discord = require("discord.js");

  if (!message.guild) {
    message.channel.send("Um... where's the server settings?...\nIn a server right?");
    return;
  }

  const guildConf = client.settings.get(message.guild.id);
  const owner = client.users.cache.get(client.config.ownerID);
  embed = new Discord.MessageEmbed()
  .setTitle("Current Settings")
  .addField("Prefix", `\`${guildConf.prefix}\``);
  for( let category in guildConf ) {
    if (category === "prefix") continue;
    let text = "", ch = false;
    if (category === "tiers") {
      for ( let type in guildConf[category] ) {
          text += `<@&${type}> [${guildConf[category][type]}]\n`;
      }
    } else {
      if (category === "channels") ch = true;
        for ( let type in guildConf[category] ) {
          text += `${ch===true?`<#${guildConf[category][type]}>`:`<@&${guildConf[category][type]}>`} [${type}]\n`;
      }
    }
    embed.addField(category, text);
  }

  embed
    .setDescription(`Use \`${guildConf.prefix}config\` to configure the bot settings`)
    .setColor("RANDOM")
    .setAuthor(message.author.username+"#"+message.author.discriminator, message.author.avatarURL())
    .setFooter("Made by "+owner.username+"#"+owner.discriminator, owner.avatarURL());
  message.channel.send(embed).catch(console.error);
}
