// Mock Allocation System for FYTS Fitness
// This is a test system - replace with actual smart contract integration for production

interface ValidationResult {
  validated: boolean;
  userAllocation: number;
  protocolFee: number;
  transactionHash: string;
}

class MockAllocationSystem {
  // Owner address for future protocol fee distribution
  // private readonly OWNER_ADDRESS = '0xCc1Bb5FE5cF57EEEE54792445586D3379E287d47';
  private readonly BASE_RATE = 0.001; // 0.001 FYTS per meter
  private readonly PROTOCOL_FEE_RATE = 0.05; // 5% to owner
  
  async submitValidation(
    userAddress: string,
    distanceMeters: number,
    durationMs: number
  ): Promise<ValidationResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate base allocation
    const baseAllocation = distanceMeters * this.BASE_RATE;
    
    // Apply bonuses
    const speedBonus = this.calculateSpeedBonus(distanceMeters, durationMs);
    const distanceBonus = this.calculateDistanceBonus(distanceMeters);
    
    const totalAllocation = baseAllocation * (1 + speedBonus + distanceBonus);
    
    // Calculate protocol fee
    const protocolFee = totalAllocation * this.PROTOCOL_FEE_RATE;
    const userAllocation = totalAllocation - protocolFee;
    
    // Generate mock transaction hash
    const txHash = '0x' + this.generateHash(userAddress + Date.now());
    
    // Log allocation details
    console.log('Validation Complete:', {
      distance: distanceMeters,
      duration: durationMs,
      userAllocation,
      protocolFee,
      txHash
    });
    
    return {
      validated: true,
      userAllocation,
      protocolFee,
      transactionHash: txHash
    };
  }
  
  private calculateSpeedBonus(distanceMeters: number, durationMs: number): number {
    const kmh = (distanceMeters / 1000) / (durationMs / 3600000);
    if (kmh > 12) return 0.2; // 20% bonus for fast pace
    if (kmh > 8) return 0.1;  // 10% bonus for moderate pace
    return 0;
  }
  
  private calculateDistanceBonus(distanceMeters: number): number {
    if (distanceMeters > 10000) return 0.3; // 30% bonus for 10km+
    if (distanceMeters > 5000) return 0.15; // 15% bonus for 5km+
    if (distanceMeters > 2000) return 0.05; // 5% bonus for 2km+
    return 0;
  }
  
  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

export const allocationSystem = new MockAllocationSystem();