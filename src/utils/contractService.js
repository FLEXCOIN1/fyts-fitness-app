import { ethers } from 'ethers';
import FYTSContract from '../contracts/FYTSFitnessToken.json';

const CONTRACT_ADDRESS = '0x2955128a2ef2c7038381a5F56bcC21A91889595B';

export class FYTSService {
  constructor(provider) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      FYTSContract.abi,
      provider.getSigner()
    );
  }

  async submitValidation(distance, duration, proofURI) {
    const tx = await this.contract.submitValidation(distance, duration, proofURI);
    return await tx.wait();
  }

  async getBalance(address) {
    const balance = await this.contract.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }
}