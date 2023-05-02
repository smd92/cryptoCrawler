import axios from "axios";
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
    const a = await getABI("0x1F98431c8aD98523631AE4a59f267346ea31F984");
    const factoryABI = JSON.parse(a.result);
    // Arbitrum RPC endpoint
    const ARBITRUM_NODE_URL = "https://arb1.arbitrum.io/rpc";

    // Token Factory address on Arbitrum
    const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

    const web3 = new Web3(ARBITRUM_NODE_URL);
    const factoryContract = new web3.eth.Contract(factoryABI, UNISWAP_FACTORY_ADDRESS);

/*     factoryContract.methods._blockTimestamp().call((error: any, result: any) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Balance:", result);
      }
    }); */

    console.log(factoryContract)
  } catch (err: any) {
    console.log(err.message);
  }
};
