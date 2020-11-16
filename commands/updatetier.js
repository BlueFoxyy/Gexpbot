exports.run = async (client, message, args) => {
  const Enmap = require("enmap");
  const axios = require("axios");
  const MinecraftApi = require('minecraft-api');

  async function axiosFetch(url) {
    try {
      let response = await axios.get(url);
      return response;
    } catch(e) {
      throw e;
    }
  }
  function removeFromArray (array, item) {
    let index = array.indexOf(item);
    if (index !== -1) array.splice(index, 1);
    return index;
  }
  function arrTotal(arr) {
    let tot = 0;
    for (let i in arr)
      tot += arr[i];
    return tot;
  }
  function getTier( gexp, tiers ) {
    for ( let tier in tiers ) {
      // comparison of current gexp
      if ( gexp >= tiers[tier] )
        return tier;
    }
  }

  message.channel.send("Updating tiers...");

  const Hypixel_client = client.Hypixel_client;

  let guild = await Hypixel_client.getGuild(client.config.hypixelGuildID);
  if (!guild) {
    console.error(error);
    return;
  }
  guild.members.sort((a,b) => {
    return arrTotal(b.expHistory)-arrTotal(a.expHistory);
  });
  let member_list = [];
  for (let i in guild.members) {
    guild.members[i].place = i;
    member_list.push(guild.members[i].uuid);
  }

  const discord_guild = message.guild;

  let result = await client.dbquery(`SELECT * FROM bluetoes_dev.members`);

  uuid_discord = new Enmap();
  for ( let row of result ) {
    let member = discord_guild.members.cache.get(row.discord_id);
    if( !member ) continue;
    uuid_discord.set(row.uuid, row.discord_id);
    if ( !member_list.includes(row.uuid) ) {
      let removeRoles = [client.settings.get(discord_guild.id).roles.member];
      for (let tier in client.settings.get(discord_guild.id).roles.tiers) {
        if (member.roles.cache.keyArray().includes(tier))
          removeRoles.push(tier);
      }
      await member.roles.remove(removeRoles);
      await member.roles.add(client.settings.get(discord_guild.id).roles.guest);
    } else if (!member.roles.cache.keyArray().includes(client.settings.get(discord_guild.id).roles.member)) {
      await member.roles.add(client.settings.get(discord_guild.id).roles.member);
      await member.roles.remove(client.settings.get(discord_guild.id).roles.guest);
    }
  }

  let uuid_ign = new Map();
  let sk1erData;
  try {
    sk1erData = await axiosFetch("https://api.sk1er.club/guild/name/"+guild.name);
  } catch(e) {
    console.error(e);
  }
  if (!sk1erData)
    message.channel.send("An error occured while fetching data from https://api.sk1er.club/\nDiscord nicknames wouldn't be updated in this run.");
  else
    for (let i = 0; i < sk1erData.guild.members.length; i++) {
      let member = sk1erData.guild.members[i];
      let name = await MinecraftApi.nameForUuid(member.uuid);
      uuid_ign.set(member.uuid, name);
    }

  let updatedMembersText = "";

  for (let member of guild.members) {

    if(!uuid_discord.keyArray().includes(member.uuid))
      continue;

    let weekly = arrTotal(member.expHistory);

    const discord_member = discord_guild.members.cache.get(uuid_discord.get(member.uuid));
    if (!discord_member) continue;

    if (uuid_ign.size != 0)
      if (uuid_ign.get(member.uuid) != discord_member.nickname)
        try {
          await discord_member.setNickname(uuid_ign.get(member.uuid));
        } catch(e) {}

    let oldTier;

    const tiers = client.settings.get(discord_guild.id).tiers;
    let memberRoles = discord_member.roles.cache.keyArray();
    for (let tier in tiers)
      if ( removeFromArray(memberRoles, tier) != -1 ) {
        oldTier = tier;
      }

    let newTier = getTier(weekly, tiers);
    memberRoles.push(newTier);
    if (removeFromArray(memberRoles, client.settings.get(discord_guild.id).roles.topEarner) != -1) {
      try {
        await discord_member.roles.remove(client.settings.get(discord_guild.id).roles.topEarner);
      } catch(e) {
        console.error(e);
      }
    }
    if (member.place < 3) {
      memberRoles.push(client.settings.get(discord_guild.id).roles.topEarner);
      try {
        await discord_member.roles.add(client.settings.get(discord_guild.id).roles.topEarner);
      } catch(e) {
        console.error(e);
      }
    }
    else if (newTier === oldTier)
      continue;

    try {
      if (oldTier)
        await discord_member.roles.add(oldTier);
      await discord_member.roles.add(newTier);
    } catch(e) {
      console.error(e);
    }
    console.log(`${discord_member.nickname?discord_member.nickname.padEnd(16, " "):discord_member.user.username.padEnd(16, " ")} | ${discord_guild.roles.cache.get(oldTier)?discord_guild.roles.cache.get(oldTier).name:"Not set"} => ${discord_guild.roles.cache.get(newTier).name}${member.place<=3?"[GEXP GOD]":""}`);

//  await discord_member.roles.set(memberRoles)
//    .catch(console.error);
  }

  console.log("Tiers are all set!")
  message.reply("Tiers has been updated!");
}
