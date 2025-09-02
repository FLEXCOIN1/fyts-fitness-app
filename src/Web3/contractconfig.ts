export const CONTRACT_ADDRESS = "0x..."; // Add your deployed contract address here
export const CONTRACT_ABI = [...]; // Add the ABI from Remix here

// Contract functions we'll use
export const CONTRACT_FUNCTIONS = {
  // User functions
  submitValidation: "submitValidation",
  balanceOf: "balanceOf",
  
  // Admin functions
  approveValidator: "approveValidator",
  approveValidation: "approveValidation",
  getPendingValidations: "getPendingValidations",
};