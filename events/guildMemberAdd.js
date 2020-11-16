module.exports = (client, member) => {
  if (member.user.bot)
    return;
  console.log(`New member joined! ${member.user.username}#${member.user.discriminator} <${member.id}>`);
  member.roles.add(client.settings.get(member.guild.id).roles.unverified)
    .catch(console.error);
}
