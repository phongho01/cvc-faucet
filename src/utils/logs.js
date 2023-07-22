const fs = require('fs');

const writeDiscordLogs = (interaction) => {
  const user = interaction.user;
  const logsText = `[${new Date().toLocaleString()}] [INFO]: user=${user.username}#${user.discriminator} 
  channelId=${interaction.channelId} 
  guildId=${interaction.guildId}
  guildName=${interaction.member.guild.name}
  roles=${interaction.member.roles.cache.toString()}
  `;
  fs.appendFileSync('logs/discord.log', `${logsText}\n`);
};

module.exports = {
  writeDiscordLogs,
};
