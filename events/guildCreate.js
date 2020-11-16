module.exports  = (client, guild) => {
  client.settings.ensure(guild.id, client.defaultSettings);
  client.queue.ensure(guild.id, queueContruct);
}
