exports.run = async (client, message, args) => {
  const MinecraftApi = require('minecraft-api');

  if (args.length < 2) {
    message.reply("Too few arguments.")
      .catch(console.error);
    message.channel.send("&help blacklist")
      .then((msg) => {
        msg.delete().catch(console.error);
      })
      .catch(console.error);
    return;
  }
  if (args.length > 1) {
    for (let i in args) {
      if (i > 2) args[2] += " "+args[i];
    }
  }
  if (!["add","remove"].includes(args[0])) {
    message.reply("Invalid operation.")
      .catch(console.error);
    message.channel.send("&help blacklist")
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

  let inList = await client.dbquery(`SELECT * FROM blacklist WHERE uuid = "${uuid}"`);
  console.log(inList);
  if (args[0] === "add") {
    if (!inList || !inList.length) {
      let insertRes = await client.dbquery(`INSERT INTO blacklist (uuid, reason) VALUES("${uuid}", "${args[2]?args[2]:""}")`);
      message.reply(`${(insertRes.affectedRows > 0 )?`Member \`${args[1]}\` added to blacklist${args[2]?` with reason \"${args[2]}\"`:""}.`:"An unexpected error happened!"}`)
        .catch(console.error);
    } else {
      message.reply(`Member is already blacklisted with reason \"${inList[0].reason}\"`)
        .catch(console.error);
    }
  } else if (args[0] === "remove") {
    if (!inList || !inList.length) {
      message.reply(`Member isn't blacklisted!`)
        .catch(console.error);
    } else {
      let removeRes = await client.dbquery(`DELETE FROM blacklist WHERE uuid = "${uuid}"`);
      message.reply(`${(removeRes.affectedRows > 0)?`Member \`${args[1]}\` removed from blacklist.`:"Can't find the specified member in the blacklist."}`)
        .catch(console.error);
    }
  }
}
