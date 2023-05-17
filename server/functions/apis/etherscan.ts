import axios from "axios";

export const getABI = async (ca: string) => {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${ca}&apikey=${process.env.API_KEY_ETHERSCAN}`
    );
    return response;
  } catch (err: any) {
    console.log(
      `error at apis/etherscan.js: error getting ABI for contract adress ${ca}: ${err.message}`
    );
  }
};
