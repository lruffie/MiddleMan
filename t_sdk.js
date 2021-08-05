
const { ParaSwap } = require('paraswap');
const paraSwap = new ParaSwap();



const tokens = async () => {
    const tok = await paraSwap.getTokens(); 
    console.log(tok)
    return tok;
}


// tokens()

const srcToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'; // ETH
const destToken = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'; // DAI
const srcAmount = '1000000000000000000'; //The source amount multiplied by its decimals: 10 ** 18 here


const priceRoute = async () => {
    const OptimalRates = await paraSwap.getRate(
        srcToken,
        destToken,
        srcAmount,
        );
        console.log(OptimalRates)
    }

priceRoute()