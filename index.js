process.title = "GexpBot"

const Discord = require("discord.js");
const Enmap = require("enmap");
const fs = require("fs");
const mysql = require("mysql");
const Hypixel = require("hypixel");
const axios = require("axios");
const MinecraftApi = require("minecraft-api");

const client = new Discord.Client();
client.config = require("./configs/config.json");
client.cmdconfig = require("./configs/cmdconfig.json")
dbconfig = require(`./configs/dbconfig.json`);
client.dbconnection = mysql.createPool({
  host     : dbconfig.host,
  user     : dbconfig.user,
  password : dbconfig.password,
  database : dbconfig.database
});
client.dbquery = async (sql) => {
  let p = new Promise((resolve, reject) => {
    client.dbconnection.query(sql, (error, results, fields) => {
      if (error) reject(error);
      resolve(results);
    });
  });
  let res = await p;
  return res;
}
client.axiosFetch = async (url) => {
  let response = await axios.get(url);
  return response;
}
fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
  });
});

client.commands = new Enmap();

fs.readdir("./commands/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    if (!file.endsWith(".js")) return;
    let props = require(`./commands/${file}`);
    let commandName = file.split(".")[0];
    console.log(`Attempting to load command ${commandName}`);
    client.commands.set(commandName, props);
  });
});

client.settings = new Enmap();

const defaultSettings = {
  prefix: "&",
  tiers: {},
  roles: {
    topearner: undefined,
    member: undefined,
    guest: undefined,
    unverified: undefined
  },
  permissions: {
    verify: undefined,
    invite: undefined,
    blacklist: undefined,
    updatetier: undefined
  },
  channels: {
    autopost: undefined,
    botland: undefined
  }
}
client.defaultSettings = defaultSettings;

client.queue = new Enmap();
// Creating the contract for our queue
queueConstruct = {
  voiceChannel: null,
  connection: null,
  songs: [],
  volume: 5,
  playing: true,
  loop: 0
};

client.queueConstruct = queueConstruct;

client.Hypixel_client = new Hypixel({ key: client.config.apiKeys.hypixel });

// update tier every hour
function removeFromArray (array, item) {
  let index = array.indexOf(item);
  if (index !== -1) array.splice(index, 1);
  return index;
}
function arrTotal(arr) {
  let tot = 0;
  for (i in arr)
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
let schedule = require('node-schedule');
schedule.scheduleJob('0 */1 * * *', async () => {
  const owner = client.users.cache.get(client.config.ownerID);
  console.log("-----------------------");
  console.log("Schedule \"UpdateTier\" (1 hour)");

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

  const discord_guild = client.guilds.cache.get(client.config.guildID);

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


  let updatedMembersText = "";

  for (let member of guild.members) {

    if(!uuid_discord.keyArray().includes(member.uuid))
      continue;

    let weekly = arrTotal(member.expHistory);

    const discord_member = discord_guild.members.cache.get(uuid_discord.get(member.uuid));
    if (!discord_member) continue;

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
        await discord_member.roles.remove(oldTier);
      await discord_member.roles.add(newTier);
    } catch(e) {
      console.error(e);
    }
    console.log(`${discord_member.nickname?discord_member.nickname.padEnd(16, " "):discord_member.user.username.padEnd(16, " ")} | ${discord_guild.roles.cache.get(oldTier)?discord_guild.roles.cache.get(oldTier).name:"Not set"} => ${discord_guild.roles.cache.get(newTier).name}${member.place<=3?"[GEXP GOD]":""}`);

//  await discord_member.roles.set(memberRoles)
//    .catch(console.error);
  }

  console.log("Tiers are all set!")
});

let gexp_record = [];

function numberWithCommas(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function gexp_to_level(gexp) {
  return (((gexp-20000000)/3000000+15-1).toFixed(2));
}

// check gexp rank every hour
schedule.scheduleJob('0 */1 * * *', async () => {

  console.log("-----------------------");
  console.log("Schedule \"Leaderboard\" (1 hour)");

  let leaderboard_table = await client.axiosFetch('https://api.slothpixel.me/api/leaderboards/guild_level');
  leaderboard_table = leaderboard_table.data;
  const date = new Date();
  let text =  `Auto-post (${date.getUTCHours()}:00:00  G.M.T.)\n`+
              "```js\n"+
              "Rank        Guild         Level  Members   Experience     INCR.       Gap   \n"+
              "----------------------------------------------------------------------------\n";
  let guilds = [];
  let line = "";
  let lines = [];
  let pos_rec;
  let nextGuildExp = 0;
  for (let i = 0; i < 20; i++) {
    let guildID = await client.Hypixel_client.findGuildByName(leaderboard_table[i].name);
    let guild = await client.Hypixel_client.getGuild(guildID);
    guilds.push(guild);
  }
  guilds.sort((a, b) => {return b.exp - a.exp;});
  for (let rank = 0; rank < 20; rank++) {
    let diff = 0;
    let guild = guilds[rank];
    diff = guild.exp - gexp_record[rank];
    if(!gexp_record[rank]) diff = 0;
    gexp_record[rank] = guild.exp;

    let level = gexp_to_level(gexp_record[rank]);

    line = `[${(rank+1).toString().padStart(2, ' ')}] ${guild.name.padEnd(20, ' ')} ${level.toString().padEnd(6, '0')} ${guild.members.length.toString().padStart(3, ' ')}/125 » ${numberWithCommas(guild.exp).padStart(10, ' ')} +${numberWithCommas(diff).padEnd(9, " ")} ${rank==0?"N/A".padStart(10, ' '):numberWithCommas(guilds[rank-1].exp-guild.exp).padStart(10, ' ')}\n`;
    lines.push(line);
    if (guild._id == client.config.hypixelGuildID)
      pos_rec = (rank>=2?rank-2:(rank>=1?rank-1:rank));
  }

  for (let i = 0; i < 5; i++) {
    text += lines[pos_rec+i];
  }

  text += "```";
  const channel = client.channels.cache.get(client.settings.get(client.config.guildID).channels.autopost);
  if(channel)
    channel.send(text)
      .catch(console.error);
});

/*schedule.scheduleJob('* 3 * * 0', function () {
  client.users.fetch(client.config.ownerID)
  .then(owner => {
    let kickedMembersText = "";
    console.log("-----------------------");
    console.log("Schedule \"KickWave\" (Every Saturday 9 p.m. GMT)");

    let discord_guild = client.guilds.cache.get(client.config.guildID);

    const Hypixel_client = client.Hypixel_client;

    Hypixel_client.getGuild("5a16eb970cf2c642769b0b68",async (error, guild) => {
      client.dbconnection.query(`SELECT * FROM bluetoes_dev.members`, function (error, results, fields) {
        if(error) throw error;
        uuid_discord = new Enmap();
        results.forEach(row => {
          uuid_discord.set(row.uuid, row.discord_id);
        });

        guild.members.forEach(async function(member) {

            if(!uuid_discord.keyArray().includes(member.uuid)) return;
            let joined = member.joined;

            let joinedElapse = Date.now() - joined;
            if(joinedElapse < 604800000) return;

            let discord_guild = client.guilds.cache.get('588769495644897298');

            let discord_member = discord_guild.members.get(uuid_discord.get(member.uuid));

            let roles = Array.from(discord_member.roles.cache);
            let roleID = discord_member.roles.cache.keyArray();

            console.log("Scanning for member "+discord_member.nickname);
            console.log(roleID);

            if (roleID.includes(client.settings.get(client.config.guildID).tiers.tier4) && !roleID.includes('588770913420443683')) {
              discord_member.roles.remove(['337266897458429956','625592330648289301','626350262969434113'], 'Kick wave')
                .catch(console.error);
              discord_member.roles.add('621380146976522290', 'Kick wave')
                .catch(console.error);
              console.log(`Member "${discord_member.nickname}#${discord_member.user.discriminator} <${discord_member.id}>" has been kicked!`);
              kickedMembersText += `<@${discord_member.id}>\n`;
            }
        });
      });
    });
    if(kickedMembersText === "") kickedMembersText = "**None**";
    embed = new Discord.MessageEmbed()
      .setAuthor("Schedule | KickWave (* 3 * * 0) Sunday 3:00 A.M. GMT+8")
      .setColor("GREEN")
      .addField("Kicked Members", kickedMembersText)
      .setFooter("Made by "+owner.username, owner.avatarURL());
    client.logChannel.send(embed)
      .catch(console.error);
  })
  .catch(console.error);
});*/

// update gexp record
async function updateGexpRecord(i) {
  const moment = require("moment");
  let p = new Promise((resolve, reject) => {
    client.dbconnection.query("SELECT * FROM information_schema.columns WHERE table_name = 'gexp_record'", async function(error, result, fields) {
      let columns = [];
      for (let row of result) columns.push(row.COLUMN_NAME);
      const date = moment().subtract(i, 'day').format("YYYY-MM-DD");
      if (!columns.includes(date)) {
        client.dbconnection.query(`ALTER TABLE \`gexp_record\` ADD \`${date}\` INT NULL`, function (error, result, fields) {
          if (error) console.log(error);
        });
      }
      const guild = await client.Hypixel_client.getGuild("5a16eb970cf2c642769b0b68");
      for (let member of guild.members) {
        let promise = new Promise((resolve, reject) => {
          client.dbconnection.query(`SELECT * FROM gexp_record WHERE uuid = "${member.uuid}"`, async (error, result, fields) => {
            if (!result.length)
            await client.dbconnection.query(`INSERT INTO gexp_record (uuid) VALUES ('${member.uuid}')`)
            await client.dbconnection.query(`UPDATE gexp_record SET \`${date}\` = ${member.expHistory[date]} WHERE \`uuid\` = "${member.uuid}"`);
            resolve(member.uuid);
          });
        });
        let uuid = await promise;
      }
      resolve(date);
    });
  });
    const date = await p;
    console.log(`${date} set!`);
}
schedule.scheduleJob('0 12 * * *', async () => {

  console.log("-----------------------");
  console.log("Schedule \"gexp record\" (Every day at 22:00)");

  for (let i = 1; i <= 6; i++) await updateGexpRecord(i);

  let result = await client.dbquery(`SELECT * FROM bluetoes_dev.members`);

  uuid_discord = new Enmap();
  for ( let row of result ) {
    let member = discord_guild.members.cache.get(row.discord_id);
    if( !member ) continue;
    uuid_discord.set(row.uuid, row.discord_id);
  }

  let uuid_ign = new Map();
  let sk1erData;
  try {
    sk1erData = await client.axiosFetch("https://api.sk1er.club/guild/name/"+guild.name);
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
  for (let member of guild.members) {

    if(!uuid_discord.keyArray().includes(member.uuid))
      continue;

    let weekly = arrTotal(member.expHistory);

    const discord_member = discord_guild.members.cache.get(uuid_discord.get(member.uuid));
    if (!discord_member) continue;

    if (uuid_ign.has(member.uuid) && uuid_ign.get(member.uuid) != discord_member.nickname)
        try {
          await discord_member.setNickname(uuid_ign.get(member.uuid));
        } catch(e) {}
  }
});

schedule.scheduleJob("0 0 * * *", async() => {
  let gexpHistory = await client.dbquery("SELECT * FROM gexp_record");
  for (let row of gexpHistory) {
    let score = 0;
    let uuid = row.uuid;
    let upd = false;
    for (let date in row) {
      if (date=="uuid") continue;
      if (row[date] != null) upd = true;
      if (upd) {
        if (row[date] != null) score++;
        else                   score--;
      }
    }
    try {
      await client.dbquery(`UPDATE members SET score = ${score} WHERE uuid = "${uuid}"`);
    } catch(e) {
      console.error(e);
    }
  }
});

client.login(client.config.token);
