const COMMANDS = [
  {
    name: 'faucet',
    description: 'Request 0.5 XRC!',
    options: [
      {
        name: 'address',
        type: 3,
        require: true,
        description: 'Address of account will be received XRC',
      },
    ],
  },
  {
    name: 'help',
    description: 'Do /help for the commands list & support',
  },
];

module.exports = {
    COMMANDS
}