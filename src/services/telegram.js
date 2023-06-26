require('dotenv').config();
const token = process.env.TELEGRAM_BOT_API_KEY;
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });
const { isAddress, getBalance, formatBalance } = require('../utils/ethers');

const telegramBot = {
  start() {
    console.log('Starting telegram bot...');
    bot.onText(/\/balance(.*)/, async (msg, match) => {
      const chatId = msg.chat.id;
      let res = '';

      let address = match[1].trim();

      if (!address || address === 'faucet') {
        address = process.env.ACCOUNT_ADDRESS;
      }

      if (!isAddress(address)) {
        res = 'Address is not valid';
      } else {
        const balance = await getBalance(address);
        res = `Balance of ${address}: ${formatBalance(balance)} ${process.env.KURA_SYMBOL}`;
      }

      bot.sendMessage(chatId, res);
    });
  },
};

module.exports = telegramBot;
