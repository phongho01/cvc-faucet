require('dotenv').config();

const {
  AttachmentBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} = require('discord.js');
const { CaptchaGenerator } = require('captcha-canvas');
const randomstring = require('randomstring');
const { COMMANDS } = require('../constants');

const CAPTCHA_TTL = process.env.CAPTCHA_TTL;

const getHelpEmbedded = () => {
  const helpEmbedded = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('Command List')
    .setDescription('List available commands in this channel');

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

const sendCaptcha = async (interaction, redis) => {
  // const captchaText = randomstring.generate(5);
  let captchaText = '';
  do {
    captchaText = randomstring.generate(5);
  } while (await redis.get(captchaText));

  const captcha = new CaptchaGenerator()
    .setDimension(150, 450)
    .setCaptcha({ text: captchaText, size: 60, color: 'deeppink' })
    .setDecoy({ opacity: 0.5 })
    .setTrace({ color: 'deeppink' });
  const buffer = captcha.generateSync();

  const attachment = new AttachmentBuilder(buffer, { name: 'captcha.png' });

  const showCaptchaBtn = new ButtonBuilder()
    .setCustomId('showCaptchaBtn')
    .setLabel('Submit captcha')
    .setStyle(ButtonStyle.Primary);

  const showCaptchaBtnRow = new ActionRowBuilder().addComponents(showCaptchaBtn);

  const captchaInput = new TextInputBuilder()
    .setCustomId('captchaInput')
    .setLabel('Your captcha answer')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(5);

  const capModal = new ModalBuilder().setCustomId('capModal').setTitle('Submit captcha answer');
  capModal.addComponents(new ActionRowBuilder().addComponents(captchaInput));

  const embed = new EmbedBuilder()
    .setTitle('Solve the captcha to verify that you are not a bot')
    .setDescription(`Captcha is available in ${CAPTCHA_TTL / 60} minutes.`)
    .setColor(`fdaf17`)
    .setTimestamp(Date.now())
    .setImage('attachment://captcha.png');

  const redisOptions = {
    EX: process.env.TIME_PER_FAUCET,
    NX: true,
  };
  const author = interaction.user.id;
  const address = interaction.options.getString('address');

  redis.set(captchaText, JSON.stringify({ author, address }), redisOptions);

  const msg = await interaction.reply({
    embeds: [embed],
    files: [attachment],
    components: [showCaptchaBtnRow],
    ephemeral: true,
  });

  const collector = msg.createMessageComponentCollector();

  collector.on('collect', async (i) => {
    if (i.customId === 'showCaptchaBtn') {
      i.showModal(capModal);
    }
  });
};

module.exports = { getHelpEmbedded, sendCaptcha };
