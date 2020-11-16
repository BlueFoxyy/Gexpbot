exports.run = async (client, message, args) => {
  const MinecraftApi = require('minecraft-api');
  const Discord = require('discord.js');
  const moment = require("moment")

  async function fetchPage(index, list) {
    let text =  "```\n";
        text += "        Username                Queued Date            \n";
        text += "-------------------------------------------------------\n";
    for (let i = (index-1)*10; i < ((index*10>list.length)?list.length:index*10); i++) {
      text += `${(i+1).toString().padStart(3, " ")}. ${list[i].name.padEnd(16, " ")} ${moment.utc(list[i].date)}\n`;
    }
    text += "```";
    return text;
  }

  const owner = client.users.cache.get(client.config.ownerID);

  if (args.length < 2 && args[0] != "list") {
    message.reply("Too few arguments.")
      .catch(console.error);
    message.channel.send("&help ginvite")
      .then((msg) => {
        msg.delete().catch(console.error);
      })
      .catch(console.error);
    return;
  }
  if (!["add","remove","list"].includes(args[0])) {
    message.reply("Invalid operation.")
      .catch(console.error);
    message.channel.send("&help ginvite")
      .then((msg) => {
        msg.delete().catch(console.error);
      })
      .catch(console.error);
    return;
  }

  const uuid = await MinecraftApi.uuidForName(args[1]);
  if (!uuid) {
    message.reply("Can't find the corresponding uuid for the input username.")
      .catch(console.error);
    return;
  }

  let inList = await client.dbquery(`SELECT * FROM invitequeue WHERE uuid = "${uuid}"`);
  if (args[0] === "add") {
    if (!inList || !inList.length) {
      let insertRes = await client.dbquery(`INSERT INTO invitequeue (uuid) VALUES("${uuid}")`);
      message.reply(`${(insertRes.affectedRows > 0 )?`Member \`${args[1]}\` added to invitation queue.`:"An unexpected error happened!"}`)
        .catch(console.error);
    } else {
      message.reply(`Member is already in invitation queue!`)
        .catch(console.error);
    }
  } else if (args[0] === "remove") {
    if (!inList || !inList.length) {
      message.reply(`Member isn't in invitation queue!`)
        .catch(console.error);
    } else {
      let removeRes = await client.dbquery(`DELETE FROM invitequeue WHERE uuid = "${uuid}"`);
      message.reply(`${(removeRes.affectedRows > 0)?`Member \`${args[1]}\` removed from invite queue.`:"Can't find the specified member in the invite queue."}`)
        .catch(console.error);
    }
  } else if (args[0] === "list") {
    let queue = await client.dbquery("SELECT * FROM invitequeue");
    let index = 1;
    let embed = new Discord.MessageEmbed();
    embed
    .setDescription(`Fetching users data...`)
    .setColor("GREEN")
    .setAuthor(message.author.username+"#"+message.author.discriminator, message.author.avatarURL())
    .setTitle("Loading")
    .setTimestamp()
    .setFooter("Made by "+owner.username+"#"+owner.discriminator, owner.avatarURL());
    let msg = await message.channel.send(embed);
    for (let i in queue) {
      queue[i].name = await MinecraftApi.nameForUuid(queue[i].uuid);
    }
    queue.sort((a,b) => {return a.date-b.date;});
    let text = await fetchPage(index, queue);
    embed
    .setDescription(text)
    .setTitle("");
    msg.edit(embed);
    await msg.react("⏪");
    await msg.react("◀️");
    await msg.react("⛔");
    await msg.react("▶️");
    await msg.react("⏩");
    let collector = msg.createReactionCollector((reaction, user) => user.id === message.author.id && ["⏪","◀️","⛔","▶️","⏩"].includes(reaction.emoji.name), {time: 3600000})
    .on("collect", async (reaction) => {
      const emoji = reaction.emoji.name;
      switch (emoji) {
        case "⏩":
        index = Math.ceil(queue.length/10);
        break;
        case "▶️":
        index++;
        break;
        case "◀️":
        index--;
        break;
        case "⏪":
        index = 0;
        break;
        default:
        collector.stop();
      }
      if (index*10-queue.length>10) index--;
      if (index < 1) index++;
      text = await fetchPage(index,queue);
      embed.setDescription(text);
      msg.edit(embed);
      reaction.users.remove(message.author.id);
    }).once("end", reason => {
      msg.reactions.removeAll();
      embed.setColor("GREY");
      msg.edit(embed);
    });
  }
}
