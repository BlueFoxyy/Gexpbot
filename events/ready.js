module.exports = async (client) => {
  const fs = require("fs");
  client.logChannel = await client.channels.fetch(client.config.logChannelID);
  for (let guildID of client.guilds.cache.keyArray()) {
    let settings;
    try {
      settings = require(client.config.base_dir+"/guildData/"+guildID+".json");
    } catch(e) {}
    if (!settings)
      settings = client.defaultSettings;
    client.settings.ensure(guildID, settings);
    client.queue.set(guildID, client.queueConstruct);
    client.guilds.cache.get(guildID).members.cache.get(client.user.id).setNickname(`[${client.settings.get(guildID).prefix}] ${client.user.username}`)
      .catch(console.error);
  }
  console.log(`Ready to serve in ${client.channels.cache.size} channels on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users.`);
}
