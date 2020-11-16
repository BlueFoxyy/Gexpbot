module.exports = (client, oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel;
  let oldUserChannel = oldMember.voiceChannel;

  let logChannel = client.channels.cache.get(client.config.logChannelID);

}
