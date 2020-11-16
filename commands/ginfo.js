exports.run = async (client, message, args) => {
  let guildName = "";
  for (let arg of args)
    guildName += arg;
  const guildID = client.Hypixel_client.findGuildByName(guildName);
}
