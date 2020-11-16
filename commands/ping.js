exports.run = async (client, message, args) => {
   let msg = await message.channel.send("Checking ping...");
   msg.edit(`How dare you ping me <@${message.author.id}>\nIt took me **${(msg.createdTimestamp-message.createdTimestamp)}** milliseconds to respond!`);
}
