import Web3 from "web3";

export const getABI = async (ca: string) => {
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${ca}&apikey=${process.env.API_KEY_ETHERSCAN}`
    );
    const data = await response.json();
    return data;
  } catch (err: any) {
    console.log(
      `error at apis/etherscan.js: error getting ABI for contract adress ${ca}: ${err.message}`
    );
  }
};

export const testFn = async () => {
  try {
    const a = await getABI("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"); //v2 factory mainnet
    const b = await getABI("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"); //v2 pair mainnet
    const factoryABI = JSON.parse(a.result);
    const pairABI = JSON.parse(b.result);

    const ARBITRUM_NODE_URL = "https://arb1.arbitrum.io/rpc";
    const UNISWAP_FACTORY_ADDRESS =
      "0x8Cf83b7cB0d9CCBd8f1aCb09011b18450141bDf1"; //v2 factory arbitrum
    const web3 = new Web3(ARBITRUM_NODE_URL);

    // Create a new instance of the Uniswap V2 Factory contract on Arbitrum network
    const uniswapFactory = new web3.eth.Contract(
      factoryABI,
      UNISWAP_FACTORY_ADDRESS
    );

    // Call the allPairsLength function on the factory contract to get the number of pairs
    const allPairsLength = await uniswapFactory.methods.allPairsLength().call();

    // Loop through the number of pairs and get the pair address
    for (let i = 0; i < allPairsLength; i++) {
      const pairAddress = await uniswapFactory.methods.allPairs(i).call();

      // Create a new instance of the Uniswap V2 Pair contract
      const pairContract = new web3.eth.Contract(pairABI, pairAddress);

      // Get the token0 and token1 addresses of the pair
      const [token0Address, token1Address] = await Promise.all([
        pairContract.methods.token0().call(),
        pairContract.methods.token1().call(),
      ]);

      // Check if the token0 and token1 addresses belong to Arbitrum network
      const token0 = await checkArbitrumNetwork(token0Address);
      const token1 = await checkArbitrumNetwork(token1Address);

      // If both tokens belong to Arbitrum network, log the pair data
      if (token0 && token1) {
        console.log("Pair Address: ", pairAddress);
        console.log("Token0 Address: ", token0Address);
        console.log("Token1 Address: ", token1Address);
      }
    }

    // Helper function to check if the given token address belongs to Arbitrum network
    async function checkArbitrumNetwork(tokenAddress: string) {
      const web3 = new Web3(ARBITRUM_NODE_URL);
      const code = await web3.eth.getCode(tokenAddress);
      return code.length > 2; // Arbitrum contract bytecode length is greater than 2
    }
  } catch (err: any) {
    console.log(`error at testFn: ${err.message}`);
  }
};
