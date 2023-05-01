import Web3 from "web3";

const web3 = new Web3();

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
