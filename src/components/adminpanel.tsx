import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useFYTSContract } from '../hooks/useContract';

export function AdminPanel() {
  const { address } = useAccount();
  const { approveValidator, approveValidation } = useFYTSContract();
  const [validatorAddress, setValidatorAddress] = useState('');
  const [validationId, setValidationId] = useState('');
  
  // Only show for contract owner (you)
  const OWNER_ADDRESS = "0x..."; // Your address
  if (address !== OWNER_ADDRESS) return null;
  
  const handleApproveValidator = async () => {
    try {
      await approveValidator.write({ args: [validatorAddress] });
      alert('Validator approved!');
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const handleApproveValidation = async () => {
    try {
      await approveValidation.write({ args: [validationId] });
      alert('Validation approved!');
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <div className="admin-panel">
      <h3>Admin Functions</h3>
      
      <div>
        <input 
          type="text" 
          placeholder="Validator address"
          value={validatorAddress}
          onChange={(e) => setValidatorAddress(e.target.value)}
        />
        <button onClick={handleApproveValidator}>
          Approve Validator
        </button>
      </div>
      
      <div>
        <input 
          type="text" 
          placeholder="Validation ID"
          value={validationId}
          onChange={(e) => setValidationId(e.target.value)}
        />
        <button onClick={handleApproveValidation}>
          Approve Validation
        </button>
      </div>
    </div>
  );
}