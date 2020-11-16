exports.run = async (client, message, args) => {
    const owner = await client.users.fetch(client.config.ownerID);
    const Discord = require('discord.js');

    let description = "";

    embed = new Discord.MessageEmbed().setTitle("Commands");

    if (!args || args.length === 0)
      for (let module_name in client.config.modules) {
        let mod = client.config.modules[module_name];
        let text = "";
        for (let i in mod) {
          text += `\`${mod[i]}\` `;
        }
        embed.addField(module_name, `${text}`, true);
      }
    else {
      if (!Object.keys(client.config.commands).includes(args[0]) && !Object.keys(client.config.modules).includes(args[0])) {
        embed .setTitle("Error")
              .setDescription("Sorry but that command/module doesn't exist.");
      } else if (Object.keys(client.config.modules).includes(args[0])) {
        let mod = client.config.modules[args[0]];
        let text = "";
        for (let i in mod) {
          text += `\`${mod[i]}\` `;
        }
        embed.addField(`${args[0]}`, `${text}`);
      } else {
        let arguments = "";
        for (let arg of client.config.commands[args[0]].arguments) {
          arguments += " "+arg;
        }
        embed.addField(`\`${args[0]}${arguments}\``, client.config.commands[args[0]].description);
        for (let alt of client.config.commands[args[0]].alternatives) {

          let alt_arguments = "";
          for (let i in alt.arguments) {
            alt_arguments += " "+alt.arguments[i];
          }
          embed.addField(`\`${args[0]}${alt_arguments}\``, alt.description);
        }
        let permissions = "";
        for (let perm of client.config.commands[args[0]].permissions) {
           permissions += `\`${perm}\` `;
        }
        embed.addField("Required permissions:", permissions?permissions:"none");
      }
    }
    embed.setColor("RANDOM")
      .setTimestamp()
      .setAuthor(message.author.username+"#"+message.author.discriminator, message.author.avatarURL())
      .setFooter("Made by "+owner.username+"#"+owner.discriminator, owner.avatarURL());
    message.channel.send(embed).catch(console.error);
}
