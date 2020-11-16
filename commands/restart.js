exports.run = (client, message, args) => {
  message.channel.send('Restarting...')
  .then(msg => client.destroy())
  .then(() => client.login(client.config.token));
  message.channel.send('Done!');
}
