exports.run = async (client, message, args) => {
  const MinecraftApi = require('minecraft-api');

  if (args.length < 2) {
    message.reply("Too few arguments.")
      .catch(console.error);
    message.channel.send("&help whitelist")
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
    message.channel.send("&help whitelist")
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

  let inList = await client.dbquery(`SELECT * FROM whitelist WHERE uuid = "${uuid}"`);
  console.log(inList);
  if (args[0] === "add") {
    if (!inList || !inList.length) {
      let insertRes = await client.dbquery(`INSERT INTO whitelist (uuid) VALUES("${uuid}")`);
      message.reply(`${(insertRes.affectedRows > 0 )?`Member \`${args[1]}\` added to whitelist.`:"An unexpected error happened!"}`)
        .catch(console.error);
    } else {
      message.reply(`Member is already whitelisted!"`)
        .catch(console.error);
    }
  } else if (args[0] === "remove") {
    if (!inList || !inList.length) {
      message.reply(`Member isn't whitelisted!`)
        .catch(console.error);
    } else {
      let removeRes = await client.dbquery(`DELETE FROM whitelist WHERE uuid = "${uuid}"`);
      message.reply(`${(removeRes.affectedRows > 0)?`Member \`${args[1]}\` removed from whitelist.`:"Can't find the specified member in the whitelist."}`)
        .catch(console.error);
    }
  }
}
