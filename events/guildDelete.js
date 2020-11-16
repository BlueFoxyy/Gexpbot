module.exports = (client, guild) => {
  client.settings.delete(guild.id);
  client.queue.delete(guild.id);
}
