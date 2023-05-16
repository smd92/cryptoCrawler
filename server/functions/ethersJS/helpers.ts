import { ethers } from "ethers";

export default async function getClosestBlock(
  timestamp: number,
  provider: any,
) {
  let minBlockNumber = 0
  let maxBlockNumber = await provider.getBlockNumber();
  let closestBlockNumber = Math.floor((maxBlockNumber + minBlockNumber) / 2)
  let closestBlock = await provider.getBlock(closestBlockNumber);
  let foundExactBlock = false

  while (minBlockNumber <= maxBlockNumber) {
    console.log(`checking blockNumber=${closestBlockNumber}...`)
    if (closestBlock.timestamp === timestamp) {
      foundExactBlock = true
      break;
    } else if (closestBlock.timestamp > timestamp) {
      maxBlockNumber = closestBlockNumber - 1
    } else {
      minBlockNumber = closestBlockNumber + 1
    }

    closestBlockNumber = Math.floor((maxBlockNumber + minBlockNumber) / 2)
    closestBlock = await provider.getBlock(closestBlockNumber);
  }

  const previousBlockNumber = closestBlockNumber - 1
  const previousBlock = await provider.getBlock(previousBlockNumber);
  const nextBlockNumber = closestBlockNumber + 1
  const nextBlock = await provider.getBlock(nextBlockNumber);

/*   if (foundExactBlock) {
    console.log(`found a block that exactly matches the timestamp=${timestamp}, closestBlockNumber=${closestBlockNumber}, blockTimestamp=${closestBlock.timestamp}`)
    console.log(`adjacent block timestamps: leftBlockTimestamp=${previousBlock.timestamp}, rightBlockTimestamp=${nextBlock.timestamp}`)
  } else {
    console.log(`did not find a block that exactly matches the timestamp=${timestamp}, potential closestBlockNumber=${closestBlockNumber}, blockTimestamp=${closestBlock.timestamp}`)
    console.log(`adjacent block timestamps: leftBlockTimestamp=${previousBlock.timestamp}, rightBlockTimestamp=${nextBlock.timestamp}`)
  } */
  return closestBlockNumber;
}

export const getBlockNumberFromNhoursAgo = async (
  hoursAgo: number,
  provider: any
) => {
  try {
    const nHoursAgo = Math.floor(Date.now() / 1000) - (hoursAgo * 60 * 60);
    const blockNumber =  getClosestBlock(nHoursAgo, provider);
    return blockNumber;
  } catch (err) {
    console.log("Error getting blocknumber from n hours ago");
  }
};
