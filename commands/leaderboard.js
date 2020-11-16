exports.run = (client, message, args) => {
  function numberWithCommas(x) {
      let parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  function removeFromArray (array, item) {
    let index = array.indexOf(item);
    if (index !== -1) array.splice(index, 1);
  }

  function gexp_to_level(gexp) {
    return (((gexp-20000000)/3000000+15-1).toFixed(2));
  }

  function fetchPage(index, leaderboard_table) {
    let text =  "```js\n"+
                " Rank        Guild          Level  Members   Experience      Gap     \n"+
                "---------------------------------------------------------------------\n";
    for(i = (index)*10; i < (index+1)*10; i++) {
      let trow = leaderboard_table[i];
      let row = {};
      row.rank = trow.childNodes[0].childNodes[0].rawText;
      row.guild = trow.childNodes[1].childNodes[0].rawAttrs.slice(26).slice(0,-1);
      row.experience = trow.childNodes[2].childNodes[0].rawText;
      row.members = trow.childNodes[3].childNodes[0].rawText;

      let gexp = parseInt(row.experience.replace(/,/g, ''));
      let gap = -1;
      if (i > 0) {
        let nextGuildExp = parseInt(leaderboard_table[i-1].childNodes[2].childNodes[0].rawText.replace(/,/g, ''));
        gap = nextGuildExp-gexp;
      }
      let level = gexp_to_level(gexp);

      text += `[${row.rank.padStart(4, ' ')}] ${row.guild.padEnd(20, ' ')} ${level.toString().padEnd(6, ' ')} ${row.members.padStart(3, ' ')}/125 » ${row.experience.padStart(10, ' ')} +${gap==-1?"N/A".padStart(10, ' '):numberWithCommas(gap).padStart(10, ' ')}\n`;
    }
    text += "```";
    return text;
  }

  let ranklist = [];

  const https = require('https');
  const http_parse = require('node-html-parser');

  https.get('https://plancke.io/hypixel/leaderboards/raw.php?type=guild.experience', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', async () => {
      let index = 0;
      let leaderboard_table = http_parse.parse(JSON.parse(data).result).querySelector("tbody").childNodes;
      let text = "Page "+(index+1)+"/100\n"+fetchPage(index, leaderboard_table);
      let msg = await message.channel.send(text).catch(console.error);
      await msg.react("⏪");
      await msg.react("◀️");
      await msg.react("⛔");
      await msg.react("▶️");
      await msg.react("⏩");
      let collector = msg.createReactionCollector((reaction, user) => user.id === message.author.id && ["⏪","◀️","⛔","▶️","⏩"].includes(reaction.emoji.name), {time: 3600000})
      .on("collect", reaction => {
        const emoji = reaction.emoji.name;
        switch (emoji) {
          case "⏩":
          index = 100;
          break;
          case "▶️":
          index++;
          break;
          case "◀️":
          index--;
          break;
          case "⏪":
          index = 0;
          break;
          default:
          collector.stop();
        }
        if (index > 99) index--;
        if (index < 0) index++;
        text = "Page "+(index+1)+"/100\n"+fetchPage(index, leaderboard_table);
        msg.edit(text);
        reaction.users.remove(message.author.id);
      }).once("end", reason => {
        msg.reactions.removeAll();
      });
    });


  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}
