import { ethers } from "ethers";
import { constants } from "../../constants.ts";
import { getABI } from "../web3/test_web3.ts";
import { getBlockNumberFromNhoursAgo } from "./helpers.ts";

export const getListingsMainnet = async () => {
  try {
    //create provider
    const provider = ethers.getDefaultProvider(
      "https://ethereum.publicnode.com"
    );

    //get uniswap v2 factory ABI
    const factoryAbiRaw = await getABI(constants.uniswap.v2.factoryId);
    const factoryABI = JSON.parse(factoryAbiRaw.result);
    const uniswapFactory = new ethers.Contract(
      constants.uniswap.v2.factoryId,
      factoryABI,
      provider
    );

    //get addresses of latest pairs
    const allPairsLength = await uniswapFactory.allPairsLength();
    const startPoint = Number(allPairsLength) - 1;
    const endPoint = Number(allPairsLength) - 10;

    const pairAddresses = [];
    for (let i = startPoint; i > endPoint; i--) {
      const pa = await uniswapFactory.allPairs(i);
      pairAddresses.push(pa);
      console.log(`getting pa #${i + 1} from factory`);
    }

    //get ABIs of latest pairs
    const latestPairsAbis = [];
    for (let i = 0; i < pairAddresses.length; i++) {
      const pa = pairAddresses[i];
      const response = await getABI(pa);
      if (response.status === "1" && response.result) {
        const abi = JSON.parse(response.result);
        latestPairsAbis.push({
          pa,
          abi,
        });
      } else {
        console.log(`Could not fetch ABI of pair ${pa} from etherscan`);
      }
      console.log(`fetching latest pairs ABIs ${i + 1} of ${pairAddresses.length} done`);
    }

    //get basic pair data from each pair abi (including erc20): https://docs.uniswap.org/contracts/v2/reference/smart-contracts/pair
    const pairsWithBasicData = [];
    for (let i = 0; i < latestPairsAbis.length; i++) {
      const pa = latestPairsAbis[i].pa;
      const abi = latestPairsAbis[i].abi;
      const pairContract = new ethers.Contract(pa, abi, provider);
      const factory = await pairContract.factory();
      const token0 = await pairContract.token0();
      const token1 = await pairContract.token1();
      const reserves = await pairContract.getReserves();
      const totalSupply = await pairContract.totalSupply();
      pairsWithBasicData.push({
        pa,
        abi,
        factory,
        token0,
        token1,
        reserves,
        totalSupply,
      });
      console.log(`mapping basic pair data ${i + 1} of ${latestPairsAbis.length} done`);
    }

    //get uniswap v2 Router02 ABI
    const routerAbiRaw = await getABI(constants.uniswap.v2.router02id);
    const routerAbi = JSON.parse(routerAbiRaw.result);
    const uniswapRouter02 = new ethers.Contract(
      constants.uniswap.v2.router02id,
      routerAbi,
      provider
    );

    //get WETH id mainnet
    const wethIdMainnet = await uniswapRouter02.WETH();

    //filter WETH pairs
    const wethPairs = pairsWithBasicData.filter(
      (pair) => pair.token0 === wethIdMainnet || pair.token1 === wethIdMainnet
    );

    //get rid of bad data
    const filteredByData = wethPairs.filter(
      (pair) =>
        pair.reserves.length === 3 &&
        pair.reserves[0] > 0 &&
        pair.reserves[1] > 0 &&
        Number(pair.totalSupply > 0)
    );

    //determine then non-weth token of the pair and map shitcoin object to pair
    const mappedShitcoin = filteredByData.map((pair: any) => {
      if (pair.token0 === wethIdMainnet) {
        pair.shitcoin = { ca: pair.token1, isToken0: false };
        pair.shitcoinReserve = Number(pair.reserves[1]);
        pair.wethReserve = Number(pair.reserves[0]);
      } else if (pair.token1 === wethIdMainnet) {
        pair.shitcoin = { ca: pair.token0, isToken0: true };
        pair.shitcoinReserve = Number(pair.reserves[0]);
        pair.wethReserve = Number(pair.reserves[1]);
      }
      return pair;
    });

    //get token decimals of shitcoin
    const mappedDecimals = [];
    for (let i = 0; i < mappedShitcoin.length; i++) {
      const pair = mappedShitcoin[i];
      //get token contract abi
      const response = await getABI(pair.shitcoin.ca);
      if (response.status === "1" && response.result) {
        const abi = JSON.parse(response.result);
        const tokenContract = new ethers.Contract(
          pair.shitcoin.ca,
          abi,
          provider
        );
        const shitcoinDecimals = await tokenContract.decimals();
        pair.shitcoin.decimals = Number(shitcoinDecimals);

        mappedDecimals.push(pair);
      } else {
        console.log(
          `Could not fetch ABI of token ${pair.shitcoin.ca} from etherscan`
        );
      }
      console.log(`fetching shitcoin ABIs ${i + 1} of ${mappedShitcoin.length} done`);
    }

    //get price of weth in usd
    const priceWethUsd = 1800;

    //map price and liquidity in usd to shitcoin
    const mappedPrice = mappedDecimals.map((pair: any) => {
      const wethReserveAdjusted = pair.wethReserve / 10 ** 18; // 18 = weth decimals
      const shitcoinReserveAdjusted =
        pair.shitcoinReserve / 10 ** pair.shitcoin.decimals;

      const shitcoinPrice = 1 / (wethReserveAdjusted / shitcoinReserveAdjusted);

      const shitcoinPriceUsd = priceWethUsd / shitcoinPrice;

      pair.wethReserveAdjusted = wethReserveAdjusted;
      pair.shitcoinReserveAdjusted = shitcoinReserveAdjusted;
      pair.shitcoin.priceUsd = shitcoinPriceUsd;

      return pair;
    });

    const mappedLiq = mappedPrice.map((pair: any) => {
      const wethLiq = pair.wethReserveAdjusted * priceWethUsd;
      const shitcoinLiq = pair.shitcoinReserveAdjusted * pair.shitcoin.priceUsd;
      pair.totalLiqUsd = wethLiq + shitcoinLiq;
      return pair;
    });

    //filter by liquidity
    const filteredByLiq = mappedLiq.filter((pair) => pair.totalLiqUsd >= 5000);
    console.log(`filtered ${filteredByLiq.length} pairs by liquidity`);

    //map volume
    const mappedVolume = [];
    const blockNumber = await getBlockNumberFromNhoursAgo(24, provider);
    for (let i = 0; i < filteredByLiq.length; i++) {
      const pair = filteredByLiq[i];

      const pairContract = new ethers.Contract(pair.pa, pair.abi, provider);

      const eventFragment = pairContract.interface.getEvent("Swap");
      if (eventFragment) {
        const filter = {
          address: pair.pa,
          topics: [eventFragment.topicHash],
          fromBlock: blockNumber,
        };

        const events = await provider.getLogs(filter);
        console.log({
          pa: pair.pa,
          eventsLength: events.length,
          token0: pair.token0,
          token1: pair.token1,
        });
      } else {
        console.log(
          `something is wrong with the event fragment of pair ${pair.pa}`
        );
      }
    }
  } catch (err: any) {
    console.log(err.message);
  }
};