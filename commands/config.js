exports.run = async (client, message, args) => {
  const Discord = require("discord.js");
  const fs = require("fs");
  const flat = require("flat");

  for (let i in args)
    args[i] = args[i].toLowerCase();

  let flatten = flat(client.defaultSettings);
  for (let key in flatten) {
    if (!client.settings.has(message.guild.id, key)) {
      client.settings.set(message.guild.id, undefined, key);
    }
  }

  if (args.length < 2) {
    message.channel.send("Insufficient arguments")
      .then(() => {
        message.channel.send(client.settings.get(message.guild.id).prefix+"help config")
          .then((msg) => {
            msg.delete();
          });
      });
    return;
  }

  if (!Object.keys(client.settings.get(message.guild.id)).includes(args[0])) {
    message.channel.send(`The \`category\` must be one of \`${JSON.stringify(Object.keys(client.settings.get(message.guild.id)))}\``);
    return;
  }

  if (args[0] === "prefix") {
    client.settings.set(message.guild.id, args[1], "prefix");
    message.channel.send(`Prefix is set to \`${args[1]}\``);
  } else if (args[0] === "tiers") {
    if (!["add", "remove"].includes(args[1])) {
      message.channel.send(`The options for \`${args[1]}\` can only be \`["add", "remove"]\``);
      return;
    } else if (args.length < 3 || (args.length < 4 && args[1] === "add")) {
      message.channel.send("Insufficient argument")
        .then(() => {
          message.channel.send(client.settings.get(message.guild.id).prefix+"help config").then(msg => {msg.delete()});
        });
      return;
    }
    if (args[1] === "add") {
      if (client.settings.has(message.guild.id, `${args[0]}.${args[2]}`)) {
        message.channel.send("That role is occupied");
        return;
      }
      args[3] = parseInt(args[3]);
      client.settings.set(message.guild.id, args[3], `${args[0]}.${args[2]}`);
      message.channel.send(`Tier added with ${args[3]} gexp amount`);
    } else {
      if (!client.settings.has(message.guild.id, `${args[0]}.${args[2]}`)) {
        message.channel.send("That role isn't in the tiers");
        return;
      }
      client.settings.delete(message.guild.id, `${args[0]}.${args[2]}`);
      message.channel.send("Tier removed");
    }
  } else {
    if (!Object.keys(client.settings.get(message.guild.id, args[0])).includes(args[1])) {
      message.channel.send(`The \`type\` for \`${args[0]}\` must be one of \`${JSON.stringify(Object.keys(client.settings.get(message.guild.id, args[0])))}\``);
      return;
    }
    client.settings.set(message.guild.id, args[2], `${args[0]}.${args[1]}`);
    message.channel.send(`\`${args[0]}.${args[1]}\` is set to ${args[0]==="channels"?`<#${args[2]}>`:`<@${args[2]}>`}`);
  }

  console.log(client.settings.get(message.guild.id));

  fs.writeFile(`./guildData/${message.guild.id}.json`, JSON.stringify(client.settings.get(message.guild.id)), err => {
    if (err)
      console.error(err);
  });
}
