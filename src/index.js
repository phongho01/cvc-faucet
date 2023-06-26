require('dotenv').config();
const { createClient } = require('redis');
const discordBot = require('./services/discord');
const telegramBot = require('./services/telegram');

const client = createClient();

// const client = createClient({
//   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
// });

discordBot.start().then(async () => {
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
  discordBot.login(client);
  telegramBot.start();
});
