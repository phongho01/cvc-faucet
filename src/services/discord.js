require('dotenv').config();

const { Routes, REST, Client, GatewayIntentBits, Events } = require('discord.js');
const { COMMANDS } = require('../constants');
const { faucet } = require('../utils/ethers');
const { getHelpEmbedded } = require('../utils/discord');
const { writeDiscordLogs } = require('../utils/logs');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const FAUCET_CHANNEL_ID = process.env.FAUCET_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const PERMISSION_ROLE = process.env.PERMISSION_ROLE;

const rest = new REST({ version: '10' }).setToken(TOKEN);

const bot = {
  start: async () => {
    try {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: COMMANDS });
    } catch (error) {
      console.error(error);
    }
  },
  login: async (redis) => {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
      ],
      partials: ['CHANNEL'],
    });

    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}!`);
    });

    // client.on(Events.MessageCreate, async (message) => {
    //   if (message.channelId == FAUCET_CHANNEL_ID || message.content.startsWith('/faucet')) {
    //     writeDiscordLogs(message);
    //   }
    //   if (message.content && !message.author.bot && message.channelId == FAUCET_CHANNEL_ID) {
    //     try {
    //       let splittedMessage = message.content.replace('\n', ' ').split(' ');
    //       if (splittedMessage.length == 2 && (splittedMessage[0] == '/faucet' || splittedMessage[0] == '!faucet')) {
    //         const author = message.author.id;
    //         const address = splittedMessage[1];
    //         const res = await faucet(author, address, redis);
    //         message.reply(res);
    //       }
    //     } catch (error) {
    //       console.log('error', error);
    //       message.reply('An error has been occurred');
    //     }
    //   }
    // });

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (!interaction.isChatInputCommand()) return;
        writeDiscordLogs(interaction);

        const hasRole = interaction?.member?.roles?.cache?.some((r) => r.name === PERMISSION_ROLE);
        if (interaction.channelId != FAUCET_CHANNEL_ID || !hasRole) {
          interaction.reply({
            content: `Please claim Developer role on <#${WELCOME_CHANNEL_ID}> channel and do this action on <#${FAUCET_CHANNEL_ID}> channel`,
            ephemeral: true,
          });
        }

        switch (interaction.commandName) {
          case 'faucet': {
            await interaction.deferReply();
            const author = interaction.user.id;
            const address = interaction.options.getString('address');
            const res = await faucet(author, address, redis);
            interaction.editReply(res);
            break;
          }
          case 'help': {
            const helpEmbedded = getHelpEmbedded();
            interaction.reply({ embeds: [helpEmbedded], ephemeral: true });
            break;
          }
          default:
            break;
        }
      } catch (error) {
        console.log('error', error);
        interaction.reply({ content: 'An error has been occurred', ephemeral: true });
      }
    });

    client.on(Events.GuildMemberAdd, async (member) => {
      const helpEmbedded = getHelpEmbedded();
      helpEmbedded.setTitle('Welcome to Server');
      client.users.cache.get(member.user.id).send({ embeds: [helpEmbedded] });
    });

    client.login(TOKEN);
  },
};

module.exports = bot;
