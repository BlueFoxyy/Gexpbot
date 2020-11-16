exports.run = async (client, message, args) => {
  const owner = await client.users.cache.get(client.config.ownerID);
  const Hypixel = require('hypixel');
  const Discord = require('discord.js');
  const MinecraftApi = require('minecraft-api');
  const Hypixel_client = client.Hypixel_client;

  function numberWithCommas(x) {
      let parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }
  function arrTotal(arr) {
    let tot = 0;
    for (i in arr)
      tot += arr[i];
    return tot;
  }

  let uuid;
  let embed = new Discord.MessageEmbed()
  .setTitle("Loading")
  .setDescription("Fetching data...")
  .setColor("GREEN")
  .setTimestamp()
  .setFooter("Made by "+owner.username+"#"+owner.discriminator, owner.avatarURL());

  msg = await message.channel.send(embed);
  embed
  .setTitle("")
  .setDescription("");

  if (!args.length) {
    let prom = new Promise((resolve, reject) => {
      client.dbconnection.query(`SELECT * FROM bluetoes_dev.members WHERE discord_id = '${message.author.id}'`, (error, result, fields) => {
        if (!result[0]) {
          resolve(undefined);
          return;
        }
        resolve(result[0].uuid);
      });
    });
    uuid = await prom;
    console.log(uuid);
    if (!uuid) {
      embed
      .setTitle("Error")
      .setDescription("Sorry but you're not in the database.\nFor more info, please contact <@480364364038406149>");
      msg.edit(embed);
      return;
    }
  } else {
    try {
      uuid = await MinecraftApi.uuidForName(args[0]);
    } catch (e) {
      embed
      .setTitle("Error")
      .setDescription(`Can't find a player with the name \`${args[0]}\``);
      msg.edit(embed);
      return;
    }
    console.log(uuid);
  }

  console.log(uuid);

  let guildID;
  try {
    guildID = await client.Hypixel_client.findGuildByPlayer(uuid);
  } catch( error ) {
    console.error(error);
    embed
    .setTitle("Error")
    .setDescription("Something went wrong with hypixel api 😢");
    msg.edit(embed);
    return;
  }
  if (guildID == null) {
    if (!args[0]) {
      embed
      .setTitle("Error")
      .setDescription(`You have to join a guild first!`);
      msg.edit(embed);
      return;
    }
    embed
    .setTitle("Error")
    .setDescription(`Player \`${args[0]}\` isn't in any guild.`);
    msg.edit(embed);
    return;
  }

  const guild = await client.Hypixel_client.getGuild(guildID);

  if (!guild) {
    console.error(error);
    embed
    .setTitle("Error")
    .setDescription("Something went wrong with hypixel api while fetching guild data 😢");
    msg.edit(embed);
  }

    let monthlyGexpRecord = new Map(), lifetimeGexpRecord = new Map();
    let lifetimeDays = 0;
    let today = new Date();
    today.setHours( today.getHours() + 2 );
    let month = today.getMonth()+1;
    today.setHours( today.getHours() + 2 );
    today.setDate( today.getDate()-1 );
    let fetchData = new Promise( (resolve, reject) => {
      client.dbconnection.query(`SELECT * FROM gexp_record`, (error, result, fields) => {
        if (error) {
          msg.edit("Failed to load data from database!");
          return;
        }
        for ( let row of result ) {
          let monthly = 0;
          for ( let key of Object.keys(row).reverse() ) {
            let tmonth = key.substr(5, 2)
            if (tmonth != month) break;
            monthly += row[key];
          }
          monthlyGexpRecord.set(row.uuid, monthly);
        }
        for ( let row of result ) {
          let lifetime = 0;
          for ( let key of Object.keys(row).reverse() ) {
            if (key === 'uuid') continue;
            lifetime += row[key];
          }
          lifetimeGexpRecord.set(row.uuid, lifetime);
          lifetimeDays = Object.keys(row).length;
        }
        resolve();
      });
    });
    await fetchData;

    let dailyTotal, weeklyTotal, monthlyTotal, lifetimeTotal;
    let rank = "";
    let joined;
    let dailyPlace, weeklyPlace, monthlyPlace, lifetimePlace;
    guild.members.sort((a,b) => {
      return arrTotal(b.expHistory)-arrTotal(a.expHistory);
    });
    for (let i = 0; i < guild.members.length; i++) {
      if (guild.members[i].uuid === uuid) {
        weeklyPlace = i+1;
        break;
      }
    }

    guild.members.sort((a,b) => {
      return b.expHistory[Object.keys(b.expHistory)[0]]-a.expHistory[Object.keys(a.expHistory)[0]];
    });
    for (let i = 0; i < guild.members.length; i++) {
      if (guild.members[i].uuid === uuid) {
        dailyTotal = guild.members[i].expHistory[Object.keys(guild.members[i].expHistory)[0]];
        dailyPlace = i+1;
        break;
      }
    }

    if (guild._id === client.config.hypixelGuildID) {

      for (let member of guild.members) {
        member.monthly = monthlyGexpRecord.get(member.uuid) + member.expHistory[Object.keys(member.expHistory)[0]];
        member.lifetime = lifetimeGexpRecord.get(member.uuid) + member.expHistory[Object.keys(member.expHistory)[0]];
      }
      guild.members.sort((a,b) => {
        return b.monthly-a.monthly;
      });
      for (let i = 0; i < guild.members.length; i++) {
        if (guild.members[i].uuid === uuid) {
          monthlyPlace = i+1;
          break;
        }
      }
      guild.members.sort((a,b) => {
        return b.lifetime-a.lifetime;
      });
      for (let i = 0; i < guild.members.length; i++) {
        if (guild.members[i].uuid === uuid) {
          lifetimePlace = i+1;
          break;
        }
      }
    }


    let text =  "```\n";
    text += "Guild: "+guild.name+"\n";
    text += "----------------------\n";
    weeklyTotal = 0;
    for (let member of guild.members) {
      if (member.uuid != uuid) continue;
      rank = member.rank;
      joined = member.joined;
      quests = member.questParticipation || 0;
      monthlyTotal = member.monthly;
      lifetimeTotal = member.lifetime;
      break;
    }
    let months = ['Jan.','Feb.','Mar.','Apr.','May.','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'];
    let date = new Date(joined);
    let dateString = `${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()} ${months[date.getUTCMonth()]} ${date.getUTCDate()} ${date.getUTCFullYear()} G.M.T.`;
    text += `Joined: ${dateString}\n`;
    text += `Role:   ${rank}\n`;
    text += `Quests Contributed: ${quests}\n`;
    text += "```";
    embed.addField("General", text, true);

    text  = "```\n";
    for (let member of guild.members) {
      if (member.uuid != uuid) continue;
      for (expHistoryDate in member.expHistory) {
        text += `${expHistoryDate} => ${numberWithCommas(member.expHistory[expHistoryDate])}\n`;
        weeklyTotal += member.expHistory[expHistoryDate];
      }
    }
    text += "```";
    embed.addField("Weekly G-Exp Record", text, false);

    text  = "```\n";
    text += `Today:            ${numberWithCommas(dailyTotal)}\n`;
    text += "----------------------\n";
    text += `Weekly:           ${numberWithCommas(weeklyTotal)}\n`;
    text += `Weekly Average:   ${numberWithCommas(parseInt(weeklyTotal/7))}\n`;

    if (guild._id === client.config.hypixelGuildID) {
      function daysInYear (year) {
        return new Date(year, 0, 0).getDate();
      }
      text += "----------------------\n";
      text += `Monthly:          ${numberWithCommas(monthlyTotal)}\n`;
      text += `Monthly Average:  ${numberWithCommas(parseInt(monthlyTotal/today.getDate()))}\n`;
      text += "----------------------\n";
      text += `Lifetime:         ${numberWithCommas(lifetimeTotal)}\n`;
      text += `Lifetime Average: ${numberWithCommas(parseInt(lifetimeTotal/lifetimeDays))}\n`;
    }
    text += "```";
    embed.addField("Statistics", text, true);

    text  = "```\n";
    text += `Daily Rank:    #${dailyPlace}/${guild.members.length}\n`;
    text += `Weekly Rank:   #${weeklyPlace}/${guild.members.length}\n`;

    if (guild._id === client.config.hypixelGuildID) {
      text += `Monthly Rank:  #${monthlyPlace}/${guild.members.length}\n`;
      text += `Lifetime Rank: #${lifetimePlace}/${guild.members.length}\n`;
    }
    text += "```";
    embed.addField("Rank", text, true);

    let ign = args[0];
    msg.edit(embed).catch(console.error);
}
