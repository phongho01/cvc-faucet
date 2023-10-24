require('dotenv').config();
const cron = require('node-cron');
const { sendTransaction, provider } = require('../utils/ethers');
const { sendMessage } = require('../utils/telegram');

const ONE_SECOND = 1000;

const healthCheckBySendTransaction = cron.schedule(
  '0 7 * * *',
  async () => {
    const tx = await sendTransaction(process.env.ACCOUNT_RECEIVE_XCR);
    setTimeout(async () => {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (!receipt) {
        const currentDate = new Date().toISOString().slice(0, 10);
        sendMessage(`[HEALTH CHECK] [${currentDate}]: Error when send transaction with hash: ${tx.hash}`);
      }
    }, 3 * 60 * ONE_SECOND);
  },
  {
    scheduled: false,
    timezone: 'Asia/Ho_Chi_Minh',
  }
);

module.exports = {
  healthCheckBySendTransaction,
};
