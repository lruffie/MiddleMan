const API_URL = 'https://apiv4.paraswap.io/v2';

const axios = require('axios').default;
const BN = require("bignumber.js");
const Paraswap = require('./paraswap');
const dotenv = require('dotenv');

dotenv.config();

const referrer = 'crush it lets go'
const { ethers } = require('ethers');

const USER_ADDRESS = process.env.USER_ADDRESS;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const providerURLs = process.env.HTTP_PROVIDER_POLYGON;
const privatekey = process.env.PK_POLYGON;
const POLYGON_NETWORK_ID = 137;
const SLIPPAGE = 0.1;

const providers = 
     new ethers.providers.JsonRpcProvider(
      providerURLs)
      ;

const wallet = 
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

// // Functions 
// // const paraswap = new Paraswap();

// function normalise(amount, token) {
//   return new BigNumber(amount).times(new BigNumber(10).pow(token.decimals));
// }

// function denormalise(amount, token) {
//   return new BigNumber(amount).div(new BigNumber(10).pow(token.decimals));
// }


class ParaSwapper {
  constructor(network) {
    this.network = network;
  }

  async getRate(from, to, fromAmount) {
    try {
      const pricesURL = `${API_URL}/prices/?from=${from.address}&to=${to.address}&amount=${fromAmount}&fromDecimals=${from.decimals}&toDecimals=${to.decimals}&side=SELL&network=${this.network}`;

      const { data: { priceRoute } } = await axios.get(pricesURL, { headers: { 'X-Partner': referrer } });

      return priceRoute;
    }
    catch (error) {
      console.error(error)
    }
  }

  async buildSwap(from, to, srcAmount, minAmount, priceRoute) {
    try {
      const txURL = `${API_URL}/transactions/${this.network}`;
      console.log('swap building')
      const txConfig = {
        priceRoute,
        srcToken: from.address,
        srcDecimals: from.decimals,
        destToken: to.address,
        destDecimals: to.decimals,
        srcAmount,
        destAmount: minAmount,
        userAddress: USER_ADDRESS,
        referrer,
        // receiver: NULL_ADDRESS,
      };

      console.log(txURL,txConfig);
      const  data  = await axios.post(txURL, txConfig);

      return data;
    }
    catch (error) {
      console.error(error)
    }
  }
}

async function executeTx(txRequest, network, wallet) {
  try {
  console.log(wallet)
  console.log(network)
  const tx = await wallet.sendTransaction(txRequest);
    try { 
      console.log( await tx.wait())
      return tx; 
    }
    catch (error) {
      console.error(error)
      }
    }
  catch (error) {
    console.error(error)
  }
}

// function executeTx(txRequest, wallet) {
//     const tx =  wallet.sendTransaction(txRequest);
//     return  tx.wait(); }
      
async function swap(_srcAmount, from, to, network, wallet) {
  console.log('swap in coming')
  try {
    const srcAmount = new BN(_srcAmount).times(10 ** from.decimals).toFixed(0);
    console.log('amount : ')
    console.log(srcAmount)
    const ps = new ParaSwapper(network);

    const priceRoute = await ps.getRate(from, to, srcAmount);
    console.log(priceRoute)

    const minAmount = new BN(priceRoute.destAmount).times(1 - SLIPPAGE / 100).toFixed(0);
    console.log(minAmount)

    const transaction = await ps.buildSwap(from, to, srcAmount, minAmount, priceRoute);
    
    console.log('transaction', transaction.data.data);
    const txInfo = transaction.data;

    txInfo.gasLimit = new BN(txInfo.gas);
    delete txInfo.gas;    
    txInfo.gasPrice = new BN(txInfo.gasPrice);
    // delete txInfo.gasLimit;
    delete txInfo.value;


    console.log('transaction time boyyyyyy')
    console.log(txInfo)

    const execute = executeTx(txInfo, network, wallet)

  } catch (error) {
    console.error(error);
  }
}

/*
swap(
  1,
  t("ETH", networks.MAINNET),
  t("DAI", networks.MAINNET),
  networks.MAINNET
);
*/

// swap(
//   1,
//   t('DAI', networks.POLYGON),
//   t('USDT', networks.POLYGON),
//   networks.POLYGON,
// );

swap(
  10,
  Tokens.USDT,
  Tokens.DAI,
  137,
  wallet,
);


