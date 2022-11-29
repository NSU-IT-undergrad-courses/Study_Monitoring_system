require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.17",
    viaIR: true,
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1000
      },
    },
  },
};
