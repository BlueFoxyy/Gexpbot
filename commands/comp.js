exports.run = async (client, message, args) => {
  const axios = require('axios');
  const Discord = require('discord.js');
  const minecraftApi = require('minecraft-api');

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  async function axiosFetch(url) {
    return axios.get(url).then(response => {
      // returning the data here allows the caller to get it through another .then(...)
      return response.data;
    });
  }

  function numberWithCommas(x) {
      let parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  function fetchPage(index, gexpArray) {
    let text =  "```\n";
    for (let i = (index-1)*10; i < ((index*10>gexpArray.length)?gexpArray.length:index*10); i++) {
      text += `${(i+1).toString().padStart(3, " ")}. ${gexpArray[i].name.padEnd(16, " ")} » ${numberWithCommas(gexpArray[i].monthly)}\n`;
    }
    text += "```";
    return text;
  }

  let embed = new Discord.MessageEmbed();
  const owner = await client.users.cache.get(client.config.ownerID);

  embed
  .setDescription(`Fetching members data...`)
  .setColor("GREEN")
  .setAuthor(message.author.username+"#"+message.author.discriminator, message.author.avatarURL())
  .setTitle("Loading")
  .setTimestamp()
  .setFooter("Made by "+owner.username+"#"+owner.discriminator, owner.avatarURL());

  let msg = await message.channel.send(embed).catch(console.error);

  let guild = await client.Hypixel_client.getGuild(client.config.hypixelGuildID);
  let player_list = new Map();
  for ( let member of guild.members )
    player_list.set( member.uuid, member.expHistory[Object.keys(member.expHistory)[0]] );

  let gexpRecord = [];
  let today = new Date();
  today.setHours( today.getHours() + 2 );
  let month = today.getMonth()+1;
  today.setHours( today.getHours() + 2 );
  today.setDate( today.getDate()-1 );
  let fetchData = new Promise( (resolve, reject) => {
    client.dbconnection.query(`SELECT * FROM gexp_record WHERE 1`, (error, result, fields) => {
      if (error) {
        msg.edit("Failed to load data from database!");
        return;
      }
      for ( let row of result ) {
        if (![...player_list.keys()].includes(row.uuid)) continue;
        let monthly = 0;
        for ( let key of Object.keys(row).reverse() ) {
          let tmonth = key.substr(5, 2)
          if (tmonth != month) break;
          monthly += row[key];
        }
        gexpRecord.push( {uuid: row.uuid, monthly: monthly} );
      }
      resolve();
    });
  });
  await fetchData;

  let sk1erData = await axiosFetch("https://api.sk1er.club/guild/name/"+guild.name);
  if (!sk1erData.guild) {
    embed.setDescription("An error occured while fetching data from https://api.sk1er.club/");
    msg.edit(embed);
    return;
  }
  let uuid_ign = new Map();
  for (let i = 0; i < sk1erData.guild.members.length; i++) {
    let member = sk1erData.guild.members[i];
    uuid_ign.set(member.uuid, member.name);
  }

  for ( let index in gexpRecord ) {
    if ( ![...player_list.keys()].includes(gexpRecord[index].uuid) ) {
      gexpRecord.splice(index, 1);
      continue;
    }
    gexpRecord[index].monthly += player_list.get(gexpRecord[index].uuid);
    gexpRecord[index].name = uuid_ign.get(gexpRecord[index].uuid);
    if (!gexpRecord[index].name) {
      let names = await minecraftApi.nameHistoryForUuid(gexpRecord[index].uuid);
      gexpRecord[index].name = names[Object.keys(names)[Object.keys(names).length-1]];
    }
  }
  gexpRecord.sort((a,b)=>{return b.monthly-a.monthly});

  for ( let index = 1; index < gexpRecord.length; index++ ) {
    if ( gexpRecord[index].uuid === gexpRecord[index-1].uuid ) {
      gexpRecord.splice(index, 1);
      index--;
    }
  }

  let index = 1;
  let text = await fetchPage(index, gexpRecord);
  embed.setDescription(text)
  .setTitle(monthNames[today.getMonth()] + " G-Exp Competition")
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
      index = Math.ceil(gexpRecord.length/10);
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
    if (index*10-gexpRecord.length>10) index--;
    if (index < 1) index++;
    text = await fetchPage(index,gexpRecord);
    embed.setDescription(text);
    msg.edit(embed);
    reaction.users.remove(message.author.id);
  }).once("end", reason => {
    msg.reactions.removeAll();
    embed.setColor("GREY");
    msg.edit(embed);
  });
}
