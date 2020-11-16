exports.run = async (client, message, args) => {
  const fs = require("fs");

  let voiceChannel = message.member.voiceChannel;
  if (!voiceChannel) return message.channel.send("You need to be in a voice channel to play music!");
  if (client.queue.get(message.guild.id).connection) return message.channel.send("I'm already being used in another voice channel!");
  const permissions = voiceChannel.permissionsFor(client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.channel.send('Insufficient permissions to join and speak in your voice channel!');
  }
  let connection = await voiceChannel.join();
  client.queue.set(message.guild.id, connection, "connection");
  client.queue.set(message.guild.id, voiceChannel, "voiceChannel");
  message.channel.send(`Joined \`${voiceChannel.name}\`.`).catch(console.error);
}
