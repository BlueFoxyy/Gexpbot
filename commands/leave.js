exports.run = (client, message, args) => {
  let voiceChannel = message.member.voiceChannel;
  if (!client.queue.get(message.guild.id).connection) return message.channel.send("I must be in a voice channel before you can disconnect me?");
  if (client.queue.get(message.guild.id).connection.channel.id != voiceChannel.id) return message.channel.send("You need to be in the same channel with me in order to disconnect me.");
  message.channel.send(`Left \`${voiceChannel.name}\`.`).catch(console.error);
  voiceChannel.leave();
  client.queue.set(message.guild.id, null, "connection");
  client.queue.set(message.guild.id, [], "songs");
}
