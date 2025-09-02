export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "distance", "type": "uint256"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"},
      {"internalType": "string", "name": "proofURI", "type": "string"}
    ],
    "name": "submitValidation",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];