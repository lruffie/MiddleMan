const axios = require('axios').default;
const BigNumber = require('bignumber.js');

const ParswapURL = 'https://apiv4.paraswap.io/v2';

// https://developers.paraswap.network/
class Paraswap {
  constructor(apiURL = ParswapURL) {
    this.apiURL = apiURL;
    this.referrer = 'centraleLtothemoon';
  }

  async getPrice(from, to, fromAmount, network) {
    // TODO: Add error handling
    try {
      const pricesURL = `${this.apiURL}/prices/?from=${from.address}&to=${to.address}&amount=${fromAmount}&fromDecimals=${from.decimals}&toDecimals=${to.decimals}&side=SELL&network=${network}`;
      const { data: { priceRoute } } = await axios.get(pricesURL, { headers: { 'X-Partner': this.referrer } });

      return priceRoute;
    }
    catch (e) {
     console.error(`Paraswap unable to fetch price ${e.message}`);
    }
  }


  async buildTransaction(from, to, srcAmount, minAmount, priceRoute, network, address) {
    try {
      const requestURL = `${this.apiURL}/transactions/${network}`;
      console.log('swap building')
      const requestData = {
        priceRoute: priceRoute.priceRoute,
        srcToken: from.address,
        srcDecimals: from.decimals,
        destToken: to.address,
        destDecimals: to.decimals,
        srcAmount,
        destAmount: minAmount,
        userAddress: address,
        referrer : this.referrer,
      };

      // console.log(requestURL,requestData)

      const  data  = await axios.post(requestURL, requestData);

      return data;
        // from: data.from,
        // to: data.to,
        // data: data.data,
        // gasLimit: '0x' + new BigNumber(data.gas).toString(16),
        // value: '0x' + new BigNumber(data.value).toString(16)
      
    } catch (e) {
      console.error(
        `Paraswap unable to buildTransaction ${from.address} ${to.address} ${network} ${e.message}`,
      );
    }
  }
}

module.exports = Paraswap;
