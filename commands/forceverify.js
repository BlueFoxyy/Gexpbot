exports.run = (client, message, args) => {
  const Discord = require("discord.js");
  const MinecraftApi = require('minecraft-api');

  if (args.length < 2) {
    message.reply("Too few arguments.")
      .then(msg => {
        msg.delete({timeout: 3000})
          .catch(console.error);
      })
      .catch(console.error);
    message.delete({timeout: 3000})
      .catch(console.error);
    message.channel.send("&help forceverify")
      .then((msg) => {
        msg.delete().catch(console.error);
      })
      .catch(console.error);
    return;
  }

  MinecraftApi.uuidForName(args[1])
    .then((uuid) => {
      message.guild.members.fetch(args[0])
        .then(async (member) => {
          await member.setNickname(args[1], "Verification")
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
          .addField('User', `<@${args[0]}>`)
          .addField('Officer', `<@${message.author.id}>`)
          .setTimestamp();

          client.channels.fetch(client.config.verifyLogChannelID)
          .then(chnl => { chnl.send(verifyLog).catch(console.error); })

          console.log("Member info updated!");
          client.dbconnection.query(`DELETE FROM bluetoes_dev.members WHERE discord_id = "${args[0]}"`, function (error, result, fields) {});
          client.dbconnection.query(`SELECT * FROM bluetoes_dev.members WHERE uuid = "${uuid}"`, function (error, result, fields) {
          if (!result || !result.length)
          client.dbconnection.query(`INSERT INTO bluetoes_dev.members (
                               discord_id , uuid
                             ) VALUES (
                               '${args[0]}', '${uuid}'
                             )`, function (error, results, fields) {});
          });

          message.reply("The member has been verified!")
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
