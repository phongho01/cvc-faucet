require('dotenv').config();

const COMMANDS = [
  {
    name: 'faucet',
    description: `Request ${process.env.FAUCET_AMOUNT} ${process.env.KURA_SYMBOL}!`,
    options: [
      {
        name: 'address',
        type: 3,
        required: true,
        description: `Address of account will be received ${process.env.KURA_SYMBOL}`,
      },
    ],
  },
  {
    name: 'help',
    description: 'Do /help for the commands list & support',
  },
];

module.exports = {
  COMMANDS,
};
