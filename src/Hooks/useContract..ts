import { useContract, useContractRead, useContractWrite } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../web3/contractConfig';
import { parseEther } from 'viem';

export function useFYTSContract() {
  const contract = useContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
  });

  // Submit validation (for users after run)
  const submitValidation = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'submitValidation',
  });

  // Admin: Approve validator
  const approveValidator = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'approveValidator',
  });

  // Admin: Approve validation
  const approveValidation = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'approveValidation',
  });

  // Get user's FYTS balance
  const getBalance = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
  });

  return {
    submitValidation,
    approveValidator,
    approveValidation,
    getBalance,
  };
}