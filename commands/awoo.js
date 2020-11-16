exports.run = async (client, message, args) => {
  const entity = client.users.cache.get(args[0]) || client.users.cache.get(client.config.ownerID);
  let dmMsg = await entity.send("You have been summoned, here's the portal:\n" + message.url);
  let msg = await message.channel.send(`Attempting to summon a${(['a','e','i','o','u'].includes(entity.username[0].toLowerCase()))?'n':''} **${entity.username}**...`);
  if (!msg) {
    msg.edit(`<@${message.author.id}> Failed to summon a${(['a','e','i','o','u'].includes(entity.username[0].toLowerCase()))?'n':''} **${entity.username}**.`);
    return;
  }
  let summoned = false;

  const collector = message.channel.createMessageCollector(m => (m.author.id === entity.id), { time: 300000 });
  collector.on('collect', m => {
    msg.edit(`<@${message.author.id}> A${(['a','e','i','o','u'].includes(entity.username[0].toLowerCase()))?'n':''} **${entity.username}** has been summoned.`);
    summoned = true;
    message.channel.send(`<@${message.author.id}>`)
    .then(sent => {
      sent.delete();
    });
    collector.stop();
  });
  collector.on('end', (c) => {
    if (summoned) return;
    msg.edit(`<@${message.author.id}> Failed to summon a${(['a','e','i','o','u'].includes(entity.username[0].toLowerCase()))?'n':''} **${entity.username}**.`);
    dmMsg.edit(`Summon time limit has expired.`);
  });
}
