const ParswapURL = 'https://apiv4.paraswap.io/v2';

const axios = require('axios').default;
const BigNumber = require('bignumber.js');
const Paraswap = require('./paraswap');
const dotenv = require('dotenv');
dotenv.config();

const { ethers } = require('ethers');
const BigNumber = require('bignumber.js');

const providerURLs = process.env.HTTP_PROVIDER_POLYGON;
const privatekey = process.env.PK_POLYGON;
const POLYGON_NETWORK_ID = 137;

const providers = 
     new ethers.providers.JsonRpcProvider(
      providerURLs)
      ;

const wallets = 
  new ethers.Wallet(
  privatekey,
  providers);

const Tokens = {
  DAI: {
    address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    decimals: 18,
  },
  USDT: {
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    decimals: 6,
  },
};

// Functions 
const paraswap = new Paraswap();

function normalise(amount, token) {
  return new BigNumber(amount).times(new BigNumber(10).pow(token.decimals));
}

function denormalise(amount, token) {
  return new BigNumber(amount).div(new BigNumber(10).pow(token.decimals));
}

// Pricing
const priceFirst = await paraswap.getPrice(
  Tokens['DAI'],
  Tokens['USDT'],
  srcAmountFirst.toFixed(0),
  POLYGON_NETWORK_ID,
);

// Transaction
async function executeTx(txRequest, network) {
  const tx = await this.wallets[network].sendTransaction(txRequest);
  return await tx.wait(); 
}


async function txRequestPolygon() = await Promise.all(
  buildTransaction(
    priceFirst.payload,
    Tokens['USDT'],
    Tokens['DAI'],
    srcAmount.toFixed(0),
    destAmount.toFixed(0),
    POLYGON_NETWORK_ID,
    wallets.address,
  ),
  );

console.log('Executing Arbitrage USDT --> DAI');
