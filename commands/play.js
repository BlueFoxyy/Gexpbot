exports.run = async (client, message, args) => {
  const { Util } = require('discord.js');
  const ytdl = require('ytdl-core');
  // modules required ^^^^
  

  //play.js command
  if (!message.author.voice.channel) return message.reply("Uhm Connect to a vc");

          //If bot is connected to a VC in the guild already.
          if(!args[0]) return message.reply(`Please input a URL.`);
          let validate = await ytdl.validateURL(args[0])
          if(!validate) {
                message.reply("do a real url!")
          }
          let info =  await ytdl.getInfo(args[0])
          let connection = await message.member.voice.channel.join();
          let dispatcher = await connection.play(ytdl(args[0], { filter: "audioonly" }));
          message.reply(`I am now playing : ${info.title}`)
}
