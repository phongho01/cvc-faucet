require('dotenv').config();

const { EmbedBuilder } = require('discord.js');
const { COMMANDS } = require('../constants');
const FAUCET_CHANNEL_ID = process.env.FAUCET_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

const getHelpEmbedded = () => {
  const helpEmbedded = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('Command List')
    .setDescription(
      `You can claim Developer role on <#${WELCOME_CHANNEL_ID}> channel and use list available command on <#${FAUCET_CHANNEL_ID}> channel.`
    );

  COMMANDS.map((command) => {
    const fields = { name: `/${command.name}`, value: command.description };
    if (command.options) {
      command.options.map((options) => {
        fields.name += ` [${options.name}]`;
      });
    }
    helpEmbedded.addFields(fields);
  });

  return helpEmbedded;
};

module.exports = { getHelpEmbedded };
