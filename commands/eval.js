exports.run = async (client, message, args) => {
  try {
    eval(message.content.substr(client.settings.get(message.guild.id).prefix.length+5, message.content.length-6));
  } catch (e) {
    console.error(e);
    message.channel.send("Error!").catch(console.error);
  }
}
