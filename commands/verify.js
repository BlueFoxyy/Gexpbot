exports.run = (client, message, args) => {
  const Discord = require("discord.js");
  const MinecraftApi = require('minecraft-api');

  if (args.length < 1) {
    message.reply("Too few arguments.")
      .then(msg => {
        msg.delete({timeout: 3000})
          .catch(console.error);
      })
      .catch(console.error);
    message.delete({timeout: 3000})
      .catch(console.error);
    message.channel.send("&help verify")
      .then((msg) => {
        msg.delete().catch(console.error);
      })
      .catch(console.error);
    return;
  }

  MinecraftApi.uuidForName(args[0])
    .then(async (uuid) => {
      let player = await client.Hypixel_client.getPlayer(uuid);
      if (player.socialMedia.links.DISCORD != message.author.tag) {
        let embed = new Discord.MessageEmbed()
        .setTitle("Your Discord does not match with that Hypixel Account!")
        .addField("Discord", message.author.tag)
        .addField("Hypixel", player.socialMedia.links.DISCORD==""?"*Unlinked*":player.socialMedia.links.DISCORD)
        .setImage("https://i.imgur.com/8ILZ3LX.gif")
        .setColor("GREEN")
        .setTimestamp()
        message.channel.send(embed);
        return;
      }
      let ign = await MinecraftApi.nameForUuid(uuid);
      message.guild.members.fetch(message.author.id)
        .then(async (member) => {
          await member.setNickname(ign, "Verification")
            .catch(console.error);
          await member.roles.remove(client.settings.get(message.guild.id).roles.unverified)
            .catch(console.error);
          let memberGuildID = await client.Hypixel_client.findGuildByPlayer(uuid);

          if (memberGuildID === client.config.hypixelGuildID) {
            await member.roles.add(client.settings.get(message.guild.id).roles.member, "Verification - Members")
              .catch(console.error);
          } else {
            await member.roles.add(client.settings.get(message.guild.id).roles.guest, "Verification - Guests")
              .catch(console.error);
          }

          const verifyLog = new Discord.MessageEmbed()
          .setAuthor(message.author.tag, message.author.avatarURL())
          .setTitle('User verified')
          .addField('User', `<@${message.author.id}>`)
          .addField('Ign', `\`${ign}\``)
          .setTimestamp();

          client.channels.fetch(client.config.verifyLogChannelID)
          .then(chnl => { chnl.send(verifyLog).catch(console.error); })

          console.log("Member info updated!");
          client.dbconnection.query(`DELETE FROM bluetoes_dev.members WHERE discord_id = "${message.author.id}"`, function (error, result, fields) {});
          client.dbconnection.query(`SELECT * FROM bluetoes_dev.members WHERE uuid = "${uuid}"`, function (error, result, fields) {
          if (!result || !result.length)
          client.dbconnection.query(`INSERT INTO bluetoes_dev.members (
                               discord_id , uuid
                             ) VALUES (
                               '${message.author.id}', '${uuid}'
                             )`, function (error, results, fields) {});
          });

          message.reply("You have been verified successfully as "+`\`${ign}\``)
            .then(msg => {
              msg.delete({timeout: 3000})
                .catch(console.error);
            })
            .catch(console.error);
          message.delete({timeout: 3000})
            .catch(console.error);
        })
        .catch(err => {
          console.error(err);
          message.reply("An unexpected error happened!")
            .then(msg => {
              msg.delete({timeout: 3000})
                .catch(console.error);
            })
            .catch(console.error);
          message.delete(3025)
            .catch(console.error);
        });
    })
    .catch(err => {
      message.reply("Can't find the corresponding uuid for the input username")
        .then(msg => {
          msg.delete({timeout: 3000})
            .catch(console.error);
        })
        .catch(console.error);
      message.delete({timeout: 3000})
        .catch(console.error);
      console.error(err);
      return;
    })
}
