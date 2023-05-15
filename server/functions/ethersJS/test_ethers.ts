import { ethers } from "ethers";
import { constants } from "../../constants.ts";
import { getABI } from "../web3/test_web3.ts";
import { get } from "http";

export const ethersTestFn = async () => {
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
      const price0CumulativeLast = await pairContract.price0CumulativeLast();
      const price1CumulativeLast = await pairContract.price1CumulativeLast();
      const reserves = await pairContract.getReserves();
      /*const decimals = await pairContract.decimals();
      const kLast = await pairContract.kLast();
      const totalSupply = await pairContract.totalSupply(); */
      pairsWithBasicData.push({
        pa,
        abi,
        factory,
        token0,
        token1,
        price0CumulativeLast,
        price1CumulativeLast,
        reserves,
        //decimals,
        //kLast,
        //totalSupply,
      });
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

    //get token decimals
      const mappedDecimals = [];
      for (let i = 0; i < wethPairs.length; i++) {
        let token;
        if (wethPairs[i].token0 === wethIdMainnet) token = wethPairs[i].token1;
        if (wethPairs[i].token1 === wethIdMainnet) token = wethPairs[i].token0;
        //get token contract abi
      }
    //map price
    //price0 = (amount1 * 10^decimals0) / (amount0 * 10^decimals1)
    //price1 = (amount0 * 10^decimals0) / (amount1 * 10^decimals1)

  } catch (err: any) {
    console.log(err.message);
  }
};
