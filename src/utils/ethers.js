require('dotenv').config();
const { ethers } = require('ethers');
const { sendMessage } = require('./telegram');
const { diffTime } = require('./time');

const RPC_URL = process.env.KURA_RPC_URL;
const EXPLORER_URL = process.env.KURA_EXPLORER;
const CURRENCY_SYMBOL = process.env.KURA_SYMBOL;

const isAddress = (address) => {
  return ethers.utils.isAddress(address);
};

const getBalance = async (account) => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  return provider.getBalance(account);
};

const sendTransaction = async (to) => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.ACCOUNT_PRIVATE_KEY, provider);

  return wallet.sendTransaction({
    to: to,
    value: ethers.utils.parseEther(`${process.env.FAUCET_AMOUNT}`),
  });
};

const formatBalance = (balance) => {
  return Number(ethers.utils.formatUnits(balance.toString(), 18)).toFixed(2);
};

const faucet = async (author, address, redis) => {
  let res = `<@${author}>, an error has been occurred. Please try again later.`;

  const remainingBalance = await getBalance(process.env.ACCOUNT_ADDRESS);
  const times = remainingBalance.div(ethers.utils.parseEther(`${process.env.FAUCET_AMOUNT}`));
  if (times.lte(10)) {
    const text = `Remaining balance of account ${process.env.ACCOUNT_ADDRESS} is just enough to faucet some times (${formatBalance(
      remainingBalance
    )} ${CURRENCY_SYMBOL}). Please deposit more.`;
    sendMessage(text);
  }

  if (remainingBalance.lte(ethers.utils.parseEther(`${process.env.FAUCET_AMOUNT}`))) {
    res = `<@${author}>, sorry, remaining balance is not enough to faucet.`;
    const text = `Remaining balance of account ${process.env.ACCOUNT_ADDRESS} is not enough to faucet. Please deposit to continue.`;
    sendMessage(text);
  } else if (!address || !isAddress(address)) {
    res = `<@${author}>, invalid address wallet.`;
  } else if ((await redis.get(author)) || (await redis.get(address))) {
    const diff = diffTime(Date.now(), +((await redis.get(author)) || (await redis.get(address))) + process.env.TIME_PER_FAUCET * 1000);
    res = `<@${author}>, you can only make one request per 6 hours. Please try again in ${diff}.`;
  } else {
    const redisOptions = {
      EX: process.env.TIME_PER_FAUCET,
      NX: true,
    };
    const tx = await sendTransaction(address);
    res = `<@${author}>, ${process.env.FAUCET_AMOUNT} ${CURRENCY_SYMBOL} are heading to your wallet.`;
    redis.set(author, Date.now(), redisOptions);
    redis.set(address, Date.now(), redisOptions);
  }

  return res;
};

module.exports = {
  sendTransaction,
  getBalance,
  isAddress,
  faucet,
  formatBalance
};
