
// THIS PROGRAM IS COPYRIGHTED, CONTACT luc.ruffie@free.fr FOR INQUIRIES


// 


// LIBRAIRIES
const axios = require('axios').default;
const BN = require("bignumber.js");
const Paraswap = require('./paraswap');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

dotenv.config();


// CONSTANTES NETWORK
const API_URL = 'https://apiv4.paraswap.io/v2';
const referrer = 'crush it lets go'
const POLYGON_NETWORK_ID = 137;
const providerURLs = process.env.HTTP_PROVIDER_POLYGON;
const privatekey = process.env.PK_POLYGON;

// CONSTANTES USER
const USER_ADDRESS = process.env.USER_ADDRESS;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

// CONSTANTES BOT
const SLIPPAGE = 0.1;
const OFFSET = 0;
const REST_TIME = 20 * 1000; // seconds
const amount = 1;


// peut etre déplacer ça dans un autre fichier pour avoir une liste plus complète
const Tokens = {
  DAI: {
    address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    decimals: 18,
  },
  USDT: {
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    decimals: 6,
  },
  USDC: {
    address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    decimals: 6,
  },
};


// INIT INSTANCES
const providers = 
     new ethers.providers.JsonRpcProvider(
      providerURLs)
      ;

const wallet = 
  new ethers.Wallet(
  privatekey,
  providers);

//// MAIN FUNCTIONS

class ParaSwapper {
  constructor(network) {
    this.network = network;
  }

  // get price
  async getRoute(from, to, fromAmount) {
    console.log('Getting Route ...')
    try {
      const pricesURL = `${API_URL}/prices/?from=${from.address}&to=${to.address}&amount=${fromAmount}&fromDecimals=${from.decimals}&toDecimals=${to.decimals}&side=SELL&network=${this.network}`;

      const { data: { priceRoute } } = await axios.get(pricesURL, { headers: { 'X-Partner': referrer } });

      return priceRoute;
    }
    catch (error) {
      console.error(error)
    }
  }
  // prepare transaction data
  async buildSwap(from, to, srcAmount, minAmount, priceRoute) {
    try {

      const txURL = `${API_URL}/transactions/${this.network}`;
      console.log('Building Swap ...')

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

      // console.log(txURL,txConfig);
      const  data  = await axios.post(txURL, txConfig);
      return data;
    }
    catch (error) {
      // console.error(error);
      return error;
    }
  }
}

// send transaction in network
async function executeTx(txRequest, network, wallet) {
  // check for https://www.quicknode.com/guides/defi/how-to-stream-pending-transactions-with-ethers-js
  try { 
    const tx = await wallet.sendTransaction(txRequest);
    const receipt = await tx.wait();
    console.log(receipt);
    return receipt; 
  }
  catch (error) {
    console.log(error);
  }
}


class BOT {
  constructor(ParaSwapper, wallet) {
    this.PS = ParaSwapper;
    this.wallet = wallet;
  }

  // Tool functions 
  normalise(amount, token) {
    return new BN(amount).times(new BN(10).pow(token.decimals));
  }

  denormalise(amount, token) {
    return new BN(amount).div(new BN(10).pow(token.decimals));
  }



  // async swap(_srcAmount, from, to, network, wallet) {
  //   console.log('swap in coming')
  //   try {
  //     const srcAmount = new BN(_srcAmount).times(10 ** from.decimals).toFixed(0);
  //     console.log('amount : ')
  //     console.log(srcAmount)
  //     const ps = new ParaSwapper(network);

  //     const priceRoute = await ps.getRate(from, to, srcAmount);
  //     console.log(priceRoute)

  //     const minAmount = new BN(priceRoute.destAmount).times(1 - SLIPPAGE / 100).toFixed(0);
  //     console.log(minAmount)

  //     const transaction = await ps.buildSwap(from, to, srcAmount, minAmount, priceRoute);
      
  //     console.log('transaction', transaction.data.data);
  //     const txInfo = transaction.data;

  //     txInfo.gasLimit = new BN(txInfo.gas);
  //     delete txInfo.gas;    
  //     txInfo.gasPrice = new BN(txInfo.gasPrice);
  //     // delete txInfo.gasLimit;
  //     delete txInfo.value;


  //     console.log('transaction time boyyyyyy')
  //     console.log(txInfo)

  //     const execute = executeTx(txInfo, network, wallet)

  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  async run(){
    // Converted Amounts
    const srcAmount1 = this.normalise(amount,Tokens['USDC'],);
    const srcAmount2 = this.normalise(amount,Tokens['DAI'],);

    // Get Theroretical Target Prices 
    const Route1= await this.PS.getRoute(Tokens['USDC'],Tokens['DAI'],srcAmount1.toFixed(0));
    const Route2 = await this.PS.getRoute(Tokens['DAI'],Tokens['USDC'],srcAmount2.toFixed(0));
    // console.log(Route1)
    // console.log(Route2)

    // const dSrcAmountFirst = this.denormalise(srcAmountFirst,Tokens['USDC'],).toFixed(4);
    const DestAmount1 = this.denormalise(Route1.destAmount,Tokens['DAI'],).toFixed(4);
    const DestAmount2 = this.denormalise(Route2.destAmount,Tokens['USDC'],).toFixed(4);
    
    // Display Projected Swaps
    console.log(`FirstSwap USDC -> DAI srcAmount: ${amount} destAmount: ${DestAmount1}`);
    console.log(`SecondSwap DAI -> USDC srcAmount: ${amount} destAmount: ${DestAmount2}`);

    // MinAmounts Projected w/ SLIPPAGE
    const minAmount1 = new BN(Route1.destAmount).times(1 - SLIPPAGE / 100).toFixed(0);
    const minAmount2 = new BN(Route2.destAmount).times(1 - SLIPPAGE / 100).toFixed(0);

    // Boolean
    const threshAmount1 = this.denormalise(srcAmount1*(1+OFFSET/100),Tokens['USDC']);
    const threshAmount2 = this.denormalise(srcAmount2*(1+OFFSET/100),Tokens['DAI']);
    const LogMinAmount1 = this.denormalise(minAmount1,Tokens['DAI']);
    const LogMinAmount2 = this.denormalise(minAmount2,Tokens['USDC']);

    const isArb1 = threshAmount1 < LogMinAmount1;
    const isArb2 = threshAmount2 < LogMinAmount2;

    console.log(`Is Arbitrage USDC --> DAI: ${isArb1} with USDC = ${threshAmount1} and DAI = ${LogMinAmount1}`);
    console.log(`Is Arbitrage DAI --> USDC: ${isArb2} with DAI = ${threshAmount2} and USDC = ${LogMinAmount2}`);


    
    /// First Case
    if (isArb1) {
      try {
        const transaction = await this.PS.buildSwap(Tokens["USDC"], Tokens["DAI"], srcAmount1, minAmount1, Route1);
        
        if (transaction.status != 200) {
          throw transaction; 
        } else {
            const txInfo = transaction.data;

            // txInfo.gasLimit = new BN(txInfo.gas);
            // txInfo.gasPrice = new BN(txInfo.gasPrice);
            delete txInfo.gas;    
            delete txInfo.gasPrice;
            delete txInfo.value;
            console.log('Tx info')
            console.log(txInfo)
            
            console.log('Transaction In Coming !')
            // console.log(this.wallet)
            const execute = executeTx(txInfo, this.network, this.wallet)
          }
        }
      catch(error) {
        console.log('Error Detected during Building Transaction process')
        console.log(error.response.data)
      }
    }
    /// Second Case
    if (isArb2) {
      try {
        const transaction = await this.PS.buildSwap(Tokens["DAI"], Tokens["USDC"], srcAmount2, minAmount2, Route2);
        
        if (transaction.status != 200) {
          throw transaction; 
        } else {
            const txInfo = transaction.data;

            // txInfo.gasLimit = new BN(txInfo.gas);
            // txInfo.gasPrice = new BN(txInfo.gasPrice);
            delete txInfo.gas;    
            delete txInfo.gasPrice;
            delete txInfo.value;
            console.log('Tx info');
            console.log(txInfo);
            
            console.log('Transaction In Coming !');
            // console.log(this.wallet)
            const execute = executeTx(txInfo, this.network, this.wallet)
          }
        }
      catch(error) {
        console.log('Error Detected during Building Transaction process');
        console.log(error.response.data);
      }
    }

  }

  async rebalance() {
    // TODO: complete me
  }

// Heart Beat Machine
  async alive() {
    try {
      await this.run();
      await new Promise(resolve => {setTimeout(() => resolve(), REST_TIME)});
    } catch (e) {
      console.error(`Error_BOT_alive:`, e);
    }
    return await this.alive();
  }
}



// swap(
//   1,
//   t('DAI', networks.POLYGON),
//   t('USDT', networks.POLYGON),
//   networks.POLYGON,
// );

// swap(
//   10,
//   Tokens.USDT,
//   Tokens.DAI,
//   137,
//   wallet,
// );


async function main(wallet) {
  
  const paraswap = new ParaSwapper(POLYGON_NETWORK_ID);
  const bot = new BOT(paraswap, wallet); // add token paramters
  // Let the bot make some money ;) 

  await bot.alive();
}

main(wallet);