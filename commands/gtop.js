exports.run = async (client, message, args) => {
  const Discord = require('discord.js');
  const axios = require('axios');

  let loop = true;

  let embed = new Discord.MessageEmbed();
  async function axiosFetch(url) {
    return axios.get(url).then(response => {
      // returning the data here allows the caller to get it through another .then(...)
      return response.data;
    });
  }

  function numberWithCommas(x) {
    if (!x || x === undefined) return "0";
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  async function fetchPage(index, gexpArray) {
    let text = "```\n";
    for (let i = (index - 1) * 10; i < ((index * 10 > gexpArray.length) ? gexpArray.length : index * 10); i++) {
      text += `${gexpArray[i].name.padEnd(16, " ")} » ${numberWithCommas(gexpArray[i].gexp)}\n`;
    }
    text += "```";
    return text;
  }

  if (args[0]) args[0] = args[0].toLowerCase();
  let owner = await client.users.cache.get("480364364038406149");

  let guild = await client.Hypixel_client.getGuild(client.config.hypixelGuildID);
  if (!guild) {
    embed.setDescription(`Failed to fetch data from https://api.hypixel.net/`)
    .setTitle("Error");
    msg.edit(embed);
    return;
  }

  let total = 0;
  let gexpArray = [];
  embed
    .setDescription(`Fetching members data...`)
    .setColor("GREEN")
    .setAuthor(message.author.tag, message.author.avatarURL())
    .setTitle("Loading")
    .setTimestamp()
    .setFooter("Made by " + owner.tag, owner.avatarURL());
  let msg = await message.channel.send(embed).catch(console.error);
  const sk1erData = await axiosFetch("https://api.sk1er.club/guild/name/" + guild.name);
  let uuid_ign = new Map();
  if (!sk1erData || !sk1erData.success) {
    embed.setDescription(`Failed to fetch data from https://api.sk1er.club/`)
    .setTitle("Error");
    msg.edit(embed);
    return;
  }
  for (let i = 0; i < sk1erData.guild.members.length; i++) {
    let member = sk1erData.guild.members[i];
    uuid_ign.set(member.uuid, member.name);
  }
  for (let i = 0; i < guild.members.length; i++) {
    let member = guild.members[i];
    total = 0;
    if (args[0] === "weekly" || args[0] === "week" || args[0] === "w" || args[0] === "total")
      for (let expHistoryDate in member.expHistory)
        total += member.expHistory[expHistoryDate];
    else
      total = member.expHistory[Object.keys(member.expHistory)[0]];
    let name = uuid_ign.get(member.uuid);
    let tObj = {
      name: name,
      gexp: total
    };
    gexpArray.push(tObj);
  }
  gexpArray.sort((a, b) => {
    return b.gexp - a.gexp
  });
  let index = 1;
  for (let i = index; i <= index+1; i++) {
    text = await fetchPage(i, gexpArray);
    embed.addField(`#${(i-1)*10+1} ~ #${(i*10>gexpArray.length)?gexpArray.length:i*10}`, text, true);
  }
  embed.description = "";
  embed.title = " [" + guild.tag + "] " + guild.name;
  msg.edit(embed);
  await msg.react("⏪");
  await msg.react("◀️");
  await msg.react("⛔");
  await msg.react("▶️");
  await msg.react("⏩");
  let collector = msg.createReactionCollector((reaction, user) => user.id === message.author.id && ["⏪", "◀️", "⛔", "▶️", "⏩"].includes(reaction.emoji.name), {
      time: 600000
    })
    .on("collect", async (reaction) => {
      const emoji = reaction.emoji.name;
      switch (emoji) {
        case "⏩":
          index = Math.ceil(gexpArray.length / 10)-1;
          break;
        case "▶️":
          index += 2;
          break;
        case "◀️":
          index -= 2;
          break;
        case "⏪":
          index = 0;
          break;
        default:
          collector.stop();
      }
      if (index * 10 - gexpArray.length > 20) index = Math.ceil(gexpArray.length / 10)-1;
      if (index < 1) index = 1;
      embed.fields = [];
      for (let i = index; i < index+2; i++) {
        text = await fetchPage(i, gexpArray);
        embed.addField(`#${(i-1)*10+1} ~ #${(i*10>gexpArray.length)?gexpArray.length:i*10}`, text, true);
      }
      msg.edit(embed);
      reaction.users.remove(message.author.id);
    }).once("end", () => {
      msg.reactions.removeAll();
      embed.setColor("GREY");
      msg.edit(embed);
    });
}
