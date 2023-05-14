import { ethers } from "ethers";
import { constants } from "../../constants.ts";
import { getABI } from "../web3/test_web3.ts";

export const ethersTestFn = async () => {
  try {
    const abiData = await getABI(constants.uniswap.v2.factoryId);
    const factoryABI = JSON.parse(abiData.result);
    const uniswapFactory = new ethers.Contract(
      constants.uniswap.v2.factoryId,
      factoryABI,
      ethers.getDefaultProvider("https://ethereum.publicnode.com")
    );

    const allPairsLength = await uniswapFactory.allPairsLength();
    const startPoint = Number(allPairsLength) - 1;
    const endPoint = Number(allPairsLength) - 10;

    const pairAddresses = [];
    for (let i = startPoint; i > endPoint; i--) {
      const pa = await uniswapFactory.allPairs(i);
      pairAddresses.push(pa);
      console.log(`getting pa #${i + 1}`);
    }
    console.log(pairAddresses[0]);
    console.log(pairAddresses[8]);
  } catch (err: any) {
    console.log(err.message);
  }
};
