const { Web3 } = require('web3');
const path = require('path');
const { debug, error } = require('../utils/logger');

let web3;
let crashContract;
let defaultAccount;
let isInitialized = false;

const initializeBlockchain = async () => {
  try {
    web3 = new Web3(process.env.ETH_PROVIDER);
    const contractABI = require('../../blockchain/build/contracts/CrashMetadataStorage.json').abi;
    
    await web3.eth.net.isListening();
    debug('Successfully connected to Ethereum network');

    const networkId = await web3.eth.net.getId();
    debug('Connected to network ID:', networkId);

    const accounts = await web3.eth.getAccounts();
    defaultAccount = accounts[0];
    
    const balance = await web3.eth.getBalance(accounts[0]);
    debug('First account balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');

    crashContract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);

    const code = await web3.eth.getCode(process.env.CONTRACT_ADDRESS);
    if (code === '0x' || code === '0x0') {
      throw new Error('No contract found at address: ' + process.env.CONTRACT_ADDRESS);
    }

    // Test contract
    await crashContract.methods.getTotalMetadataCount().call();
    isInitialized = true;
    debug('Blockchain initialized successfully');
  } catch (err) {
    error('Blockchain initialization error:', err);
    throw err;
  }
};

const getWeb3 = () => {
  if (!web3) throw new Error('Web3 not initialized');
  return web3;
};

const getCrashContract = () => {
  if (!crashContract) throw new Error('Contract not initialized');
  return crashContract;
};

const getDefaultAccount = () => {
  if (!defaultAccount) throw new Error('Default account not set');
  return defaultAccount;
};

const isBlockchainInitialized = () => isInitialized;

module.exports = {
  initializeBlockchain,
  getWeb3,
  getCrashContract,
  getDefaultAccount,
  isBlockchainInitialized
};