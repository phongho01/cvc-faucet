require('dotenv').config();

const { Routes, REST, Client, GatewayIntentBits, Events } = require('discord.js');
const { COMMANDS } = require('../constants');
const { faucet } = require('../utils/ethers');
const { getHelpEmbedded, sendCaptcha } = require('../utils/discord');
const { writeDiscordLogs } = require('../utils/logs');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const FAUCET_CHANNEL_ID = process.env.FAUCET_CHANNEL_ID;

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
    //         // const author = message.author.id;
    //         // const address = splittedMessage[1];
    //         // const res = await faucet(author, address, redis);
    //         // message.reply(res);
    //         // sendCaptcha(message, redis)
    //         console.log('hehe');
    //         const helpEmbedded = getHelpEmbedded();
    //         message.edit({ embeds: [helpEmbedded] });

    //       }
    //     } catch (error) {
    //       console.log('error', error);
    //       message.reply('An error has been occurred');
    //     }
    //   }
    // });

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        const hasRole = true; //interaction.member.roles.cache.some((r) => r.name === 'crosser');
        if (interaction.channelId != FAUCET_CHANNEL_ID || !hasRole) return;
        writeDiscordLogs(interaction);

        if (interaction.isModalSubmit()) {
          if (interaction.customId !== 'capModal') return;

          const answer = interaction.fields.getTextInputValue('captchaInput');
          const info = await redis.get(answer);
          if (info) {
            const { author, address } = JSON.parse(info);
            await interaction.deferReply();
            const res = await faucet(author, address, redis);
            await redis.del(answer);
            interaction.editReply(res);
          } else {
            interaction.reply({ content: 'Captcha is invalid or expired', ephemeral: true });
          }
        } else if (interaction.isChatInputCommand()) {
          switch (interaction.commandName) {
            case 'faucet': {
              sendCaptcha(interaction, redis);
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
