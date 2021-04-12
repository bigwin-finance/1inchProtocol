var Web3 = require('web3');
const BigNumber = require('bignumber.js');

const oneSplitDexes = [
    "Uniswap",
    "Kyber",
    "Bancor",
    "Oasis",
    "Curve Compound",
    "Curve USDT",
    "Curve Y",
    "Curve Binance",
    "Curve Synthetix",
    "Uniswap Compound",
    "Uniswap CHAI",
    "Uniswap Aave",
    "Mooniswap",
    "Uniswap V2",
    "Uniswap V2 ETH",
    "Uniswap V2 DAI",
    "Uniswap V2 USDC",
    "Curve Pax",
    "Curve renBTC",
    "Curve tBTC",
    "Dforce XSwap",
    "Shell",
    "mStable mUSD",
    "Curve sBTC",
    "Balancer 1",
    "Balancer 2",
    "Balancer 3",
    "Kyber 1",
    "Kyber 2",
    "Kyber 3",
    "Kyber 4"
]

const oneSplitABI = require('../contracts/artifacts/IOneSplit.json');
const onesplitAddress = "0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E"; // 1plit contract address on Main net

const erc20ABI = require('../contracts/artifacts/ERC20.json');
const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"; // DAI ERC20 contract address on Main net

// TODO: 需要改成你本地的钱包公钥
const fromAddress = "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC";

const fromToken = daiAddress;
const fromTokenDecimals = 18;

const toToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // ETH
const toTokenDecimals = 18;

const amountToExchange = 1;

const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

const onesplitContract = new web3.eth.Contract(oneSplitABI.abi, onesplitAddress);
const daiToken = new web3.eth.Contract(erc20ABI, fromToken);


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitTransaction(txHash) {
    let tx = null;
    while (tx == null) {
        tx = await web3.eth.getTransactionReceipt(txHash);
        await sleep(2000);
    }
    console.log("Transaction " + txHash + " was mined.");
    return (tx.status);
}


async function getQuote(fromToken, toToken, amount, callback) {
    let quote = null;
    try {
        quote = await onesplitContract.methods.getExpectedReturn(toToken, fromToken, amount, 100, 0).call({fromAddress:fromAddress});
        console.log(quote)
    } catch (error) {
        console.log('Impossible to get the quote', error)
    }
    console.log("Trade From: " + fromToken)
    console.log("Trade To: " + toToken);
    console.log("Trade Amount: " + amountToExchange);
    console.log(new BigNumber(quote.returnAmount).shiftedBy(-fromTokenDecimals).toString());
    console.log("Using Dexes:");
    for (let index = 0; index < quote.distribution.length; index++) {
        console.log(oneSplitDexes[index] + ": " + quote.distribution[index] + "%");
    }
    callback(quote);
}


function approveToken(tokenInstance, receiver, amount, callback) {
    tokenInstance.methods.approve(receiver, amount).send({ from: fromAddress }, async function(error, txHash) {
        if (error) {
            console.log("ERC20 could not be approved", error);
            return;
        }
        console.log("ERC20 token approved to " + receiver);
        const status = await waitTransaction(txHash);
        if (!status) {
            console.log("Approval transaction failed.");
            return;
        }
        callback();
    })
}


let amountWithDecimals = new BigNumber(amountToExchange).shiftedBy(fromTokenDecimals).toString()

// TODO: 现在没有跑通此流程
getQuote(fromToken, toToken, amountWithDecimals, function(quote) {
    approveToken(daiToken, onesplitAddress, amountWithDecimals, async function() {
    //     // We get the balance before the swap just for logging purpose
    //     let ethBalanceBefore = await web3.eth.getBalance(fromAddress);
    //     let daiBalanceBefore = await daiToken.methods.balanceOf(fromAddress).call();
    //     onesplitContract.methods.swap(fromToken, toToken, amountWithDecimals, quote.returnAmount, quote.distribution, 0).send({ from: fromAddress, gas: 8000000 }, async function(error, txHash) {
    //         if (error) {
    //             console.log("Could not complete the swap", error);
    //             return;
    //         }
    //         const status = await waitTransaction(txHash);
    //         // We check the final balances after the swap for logging purpose
    //         let ethBalanceAfter = await web3.eth.getBalance(fromAddress);
    //         let daiBalanceAfter = await daiToken.methods.balanceOf(fromAddress).call();
    //         console.log("Final balances:")
    //         console.log("Change in ETH balance", new BigNumber(ethBalanceAfter).minus(ethBalanceBefore).shiftedBy(-fromTokenDecimals).toFixed(2));
    //         console.log("Change in DAI balance", new BigNumber(daiBalanceAfter).minus(daiBalanceBefore).shiftedBy(-fromTokenDecimals).toFixed(2));
    //     });
    });
});
