const fs = require('fs');

const writeDiscordLogs = (interaction) => {
  const user = interaction.user;
  const roles = JSON.stringify(interaction.member.roles.cache.map((item) => item.name)) || '';
  const logsText = `[${new Date().toLocaleString()}] [INFO]: user=${user.username}#${user.discriminator}; channelId=${
    interaction.channelId
  }; guildId=${interaction.guildId}; guildName=${interaction.member.guild.name}; roles=${roles}`;
  fs.appendFileSync('logs/discord.log', `${logsText}\n`);
};

module.exports = {
  writeDiscordLogs,
};
