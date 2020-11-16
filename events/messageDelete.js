module.exports = async (client, message) => {
  if (message.author.bot)
    return;
  const Discord = require("discord.js");

  let logChannel = client.channels.cache.get(client.config.logChannelID);

  if (message.content)
    if (message.content.length > 1024) {
      message.content = message.content.slice(0, 1021);
      message.content += "...";
    }

  let embed = new Discord.MessageEmbed();
  embed .setTitle("Message deleted")
        .addField("Author", `<@${message.author.id}>`)
        .addField("Channel", `<#${message.channel.id}>`)
        .addField("Content", message.content?message.content:"*Embed message*")
        .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
        .setColor("RED");
  logChannel.send(embed).catch(console.error);
}
