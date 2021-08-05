const dotenv = require('dotenv');
dotenv.config();

const { ethers } = require('ethers');
const BigNumber = require('bignumber.js');
const Paraswap = require('./paraswap');
const axios = require('axios').default;

const REST_TIME = 10 * 1000; // 5 seconds
const POLYGON_NETWORK_ID = 137;
const slippage = 0.01;
const amount = 10;

const providerURLs = process.env.HTTP_PROVIDER_POLYGON;
const privatekey = process.env.PK_POLYGON;
const USER_ADDRESS = process.env.USER_ADDRESS;
const API_URL = 'https://apiv4.paraswap.io/v2';
const referrer = 'moonsafu'

// Any arbitary token can be used.
// We use ETH <> MATIC as they are native tokens
// and don't require any approval on their chains

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

class MonoChainAccumulator {
  constructor(ps, wallets) {
    this.ps = ps;
    this.wallets = wallets;
  }

  async alive() {
    try {
      await this.run();
    } catch (e) {
      console.error(`Error_MonoChainAccumulator_alive:`, e);
    }
    return await this.alive();
  }

  async buildSwap(from, to, srcAmount, minAmount, priceRoute) {
    try {
      const txURL = `${API_URL}/transactions/${POLYGON_NETWORK_ID}`;
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
  
  async  executeTx(txRequest, network, wallet) {
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

  async rebalance() {
    // TODO: complete me
  }

  normalise(amount, token) {
    return new BigNumber(amount).times(new BigNumber(10).pow(token.decimals));
  }

  denormalise(amount, token) {
    return new BigNumber(amount).div(new BigNumber(10).pow(token.decimals));
  }

  // Bot logic goes here
  async run() {
    const srcAmountFirst = this.normalise(amount,Tokens['USDT'],);

    // Get the best price for USDT -> DAI swap in POLYGON
    const getRateFirst = await this.ps.getPrice(Tokens['USDT'],Tokens['DAI'],srcAmountFirst.toFixed(0),POLYGON_NETWORK_ID,);
    console.log(getRateFirst)

    const priceFirst = {
      price : getRateFirst.bestRoute[0].destAmount,
      payload: getRateFirst,
    }
    // console.log(priceFirst)

    const dSrcAmountFirst = this.denormalise(
      srcAmountFirst,
      Tokens['USDT'],
    ).toFixed(4);

    const dDestAmountFirst = this.denormalise(
      priceFirst.price,
      Tokens['DAI'],
    ).toFixed(4);

    console.log(
      `FirstSwap USDT -> DAI Polygon srcAmount: ${dSrcAmountFirst} destAmount: ${dDestAmountFirst}`,
    );

    // Get the destAmount with slippage to get the srcAmount of the next swap
    const destAmountFirstSlippage = (new BigNumber(priceFirst.price).times(1 - slippage,));
    const dDestAmountFirstSlippage = this.denormalise(destAmountFirstSlippage,Tokens['DAI'],).toFixed(4);
    
    // Get the best price for DAI -> USDT swap in POLYGON
    const srcAmountSecond = this.normalise(
      amount,
      Tokens['DAI'],
    );

    const getRateSecond = await this.ps.getPrice(
      Tokens['DAI'],
      Tokens['USDT'],
      srcAmountSecond.toFixed(0),
      POLYGON_NETWORK_ID,
    );

    const priceSecond = {
      price : getRateSecond.bestRoute[0].destAmount,
      payload: getRateSecond,
    }
    // console.log(priceSecond)

    const dSrcAmountSecond = this.denormalise(
      srcAmountSecond,
      Tokens['DAI'],
    ).toFixed(4);

    const dDestAmountSecond = this.denormalise(
      priceSecond.price,
      Tokens['USDT'],
    ).toFixed(4);

    console.log(
      `SecondSwap DAI -> USDT Polygon srcAmount: ${dSrcAmountSecond} destAmount: ${dDestAmountSecond}`,
    );

    // Get the destAmount with slippage to check if have an arbitrage opportunity
    const destAmountSecondSlippage = (new BigNumber(priceSecond.price).times(
      1 - slippage,)
    );

    const dDestAmountSecondSlippage = this.denormalise(
      destAmountSecondSlippage,
      Tokens['USDT'],
    ).toFixed(4);
    

    // If the amount recieved in the second swap - slippage is greater than the src amount of the first swap 
    const isArbFirst = dSrcAmountFirst < dDestAmountFirstSlippage;
    console.log(`Is Arbitrage USDT --> DAI: ${isArbFirst} with usdt = ${dSrcAmountFirst} and dai = ${dDestAmountFirstSlippage}`);
    const isArbSecond = dSrcAmountSecond < dDestAmountSecondSlippage;
    console.log(`Is Arbitrage DAI --> USDT: ${isArbSecond} with dai = ${dSrcAmountSecond} and usdt = ${dDestAmountSecondSlippage}`);

    if (isArbFirst) {
      // Build transaction for the swap
      // console.log(priceFirst.payload)
      const txRequest = await this.buildSwap(
            Tokens['USDT'],
            Tokens['DAI'],
            srcAmountFirst.toFixed(0),
            destAmountFirstSlippage.toFixed(0),
            getRateFirst,
            137,
            this.wallets.address,
          );
      
      console.log('Executing Arbitrage USDT --> DAI');
      console.log(txRequest)
      
      // Execute the transaction 
      try {
      const txs = await this.executeTx(txRequest, POLYGON_NETWORK_ID);
      console.log(txs);
      }
      catch(err){
        console.error(err);
      }

      // Rebalance the portfolio if needed
      // await this.rebalance();
      
    } 

    // Consider swap the other way 
    
    else if (isArbSecond) {
      // Build transaction parallely for both the swaps
      try {
      const  txRequest = await this.ps.buildTransaction(
            priceFirst.payload,
            Tokens['DAI'],
            Tokens['USDT'],
            srcAmountFirst.toFixed(0),
            destAmountFirstSlippage.toFixed(0),
            USER_ADDRESS,
            this.wallets.address,
          );
      console.log('Executing Arbitrage DAI --> USDT');
      }
      catch(err){
        console.error(err);
      }

      // Execute the transaction 
      try {
        const txs = await this.executeTx(txRequest, POLYGON_NETWORK_ID);
        console.log(txs);
      }
      catch(err){
        console.error(err);
      }
      
      // Rebalance the portfolio if needed

      // await this.rebalance();
    } 

    else {
      // If there was no arbitrage take rest before trying
      await new Promise(resolve => {
        setTimeout(() => resolve(), REST_TIME);
      });
    }
  }
}

async function main() {
  const providers = 
     new ethers.providers.JsonRpcProvider(
      providerURLs)
      ;
  const wallets = 
    new ethers.Wallet(
    privatekey,
    providers,
    USER_ADDRESS);

  const paraswap = new Paraswap();
  const bot = new MonoChainAccumulator(paraswap, wallets);

  // Let the bot make some money ;) 

  await bot.alive();
}

main();
