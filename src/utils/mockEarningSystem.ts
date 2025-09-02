// utils/mockEarningSystem.ts
// This simulates the earning system for testing before deploying real contracts

interface EarningData {
  user: string;
  distance: number;
  duration: number;
  timestamp: number;
  earnings: number;
  validated: boolean;
}

class MockEarningSystem {
  private earnings: Map<string, EarningData[]> = new Map();
  private ownerAddress: string = '0xCc1Bb5FE5cF57EEEE54792445586D3379E287d47'; // YOUR address - receives protocol fees
  private protocolFeePercent: number = 5; // 5% protocol fee to owner
  
  // Earning rates (can be adjusted for testing)
  private rates = {
    baseRatePerMeter: 0.001,  // 0.001 tokens per meter
    bonusMultiplier: {
      longRun: 1.5,     // 50% bonus for runs > 5km
      consistency: 1.2,  // 20% bonus for daily streaks
      speed: 1.3,       // 30% bonus for fast pace
    },
    maxDailyEarning: 100, // Maximum tokens per day
  };

  constructor(ownerAddress?: string) {
    if (ownerAddress) {
      this.ownerAddress = ownerAddress;
    }
  }

  // Calculate earnings based on run data
  calculateEarnings(distance: number, duration: number, userAddress: string): number {
    // Base earning
    let earning = distance * this.rates.baseRatePerMeter;
    
    // Apply bonuses
    if (distance > 5000) { // Long run bonus (> 5km)
      earning *= this.rates.bonusMultiplier.longRun;
    }
    
    const speed = distance / (duration / 1000); // meters per second
    if (speed > 2.5) { // Fast pace bonus (> 2.5 m/s = 9 km/h)
      earning *= this.rates.bonusMultiplier.speed;
    }
    
    // Check daily limit
    const todayEarnings = this.getTodayEarnings(userAddress);
    if (todayEarnings + earning > this.rates.maxDailyEarning) {
      earning = Math.max(0, this.rates.maxDailyEarning - todayEarnings);
    }
    
    return Number(earning.toFixed(4));
  }

  // Submit and validate a run
  async submitRun(
    userAddress: string, 
    distance: number, 
    duration: number
  ): Promise<{
    userEarning: number;
    ownerEarning: number;
    transactionHash: string;
    validated: boolean;
  }> {
    // Simulate validation logic
    const isValid = this.validateRun(distance, duration);
    
    if (!isValid) {
      return {
        userEarning: 0,
        ownerEarning: 0,
        transactionHash: '0x' + '0'.repeat(64),
        validated: false,
      };
    }
    
    // Calculate earnings
    const totalEarning = this.calculateEarnings(distance, duration, userAddress);
    const ownerEarning = totalEarning * (this.protocolFeePercent / 100);
    const userEarning = totalEarning - ownerEarning;
    
    // Store earning data
    const earningData: EarningData = {
      user: userAddress,
      distance,
      duration,
      timestamp: Date.now(),
      earnings: userEarning,
      validated: true,
    };
    
    if (!this.earnings.has(userAddress)) {
      this.earnings.set(userAddress, []);
    }
    this.earnings.get(userAddress)!.push(earningData);
    
    // Store owner earnings
    if (!this.earnings.has(this.ownerAddress)) {
      this.earnings.set(this.ownerAddress, []);
    }
    this.earnings.get(this.ownerAddress)!.push({
      ...earningData,
      earnings: ownerEarning,
      user: this.ownerAddress,
    });
    
    // Generate mock transaction hash
    const mockTxHash = '0x' + Buffer.from(
      `${userAddress}-${distance}-${duration}-${Date.now()}`
    ).toString('hex').slice(0, 64);
    
    console.log('📊 Run Validated and Earnings Calculated:');
    console.log(`   User: ${userAddress}`);
    console.log(`   Distance: ${distance}m`);
    console.log(`   Duration: ${(duration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`   User Earning: ${userEarning.toFixed(4)} FYTS`);
    console.log(`   Protocol Fee (Owner): ${ownerEarning.toFixed(4)} FYTS`);
    console.log(`   Mock TX: ${mockTxHash}`);
    
    return {
      userEarning,
      ownerEarning,
      transactionHash: mockTxHash,
      validated: true,
    };
  }

  // Validation logic
  private validateRun(distance: number, duration: number): boolean {
    // Basic validation rules
    const minDistance = 10; // Minimum 10 meters
    const maxSpeed = 12; // Maximum 12 m/s (43.2 km/h - world record pace)
    const minSpeed = 0.5; // Minimum 0.5 m/s (1.8 km/h - slow walk)
    
    if (distance < minDistance) {
      console.log('❌ Validation failed: Distance too short');
      return false;
    }
    
    const speed = distance / (duration / 1000);
    if (speed > maxSpeed) {
      console.log('❌ Validation failed: Speed impossibly high');
      return false;
    }
    
    if (speed < minSpeed) {
      console.log('❌ Validation failed: Speed too slow');
      return false;
    }
    
    return true;
  }

  // Get today's earnings for a user
  private getTodayEarnings(userAddress: string): number {
    const userEarnings = this.earnings.get(userAddress) || [];
    const todayStart = new Date().setHours(0, 0, 0, 0);
    
    return userEarnings
      .filter(e => e.timestamp >= todayStart)
      .reduce((sum, e) => sum + e.earnings, 0);
  }

  // Get user statistics
  getUserStats(userAddress: string): {
    totalEarnings: number;
    totalDistance: number;
    totalRuns: number;
    todayEarnings: number;
  } {
    const userEarnings = this.earnings.get(userAddress) || [];
    
    return {
      totalEarnings: userEarnings.reduce((sum, e) => sum + e.earnings, 0),
      totalDistance: userEarnings.reduce((sum, e) => sum + e.distance, 0),
      totalRuns: userEarnings.length,
      todayEarnings: this.getTodayEarnings(userAddress),
    };
  }

  // Get owner earnings
  getOwnerEarnings(): {
    totalProtocolFees: number;
    todayFees: number;
    totalValidatedRuns: number;
  } {
    const ownerEarnings = this.earnings.get(this.ownerAddress) || [];
    const todayStart = new Date().setHours(0, 0, 0, 0);
    
    // Count all validated runs across all users
    let totalRuns = 0;
    this.earnings.forEach((runs, user) => {
      if (user !== this.ownerAddress) {
        totalRuns += runs.filter(r => r.validated).length;
      }
    });
    
    return {
      totalProtocolFees: ownerEarnings.reduce((sum, e) => sum + e.earnings, 0),
      todayFees: ownerEarnings
        .filter(e => e.timestamp >= todayStart)
        .reduce((sum, e) => sum + e.earnings, 0),
      totalValidatedRuns: totalRuns,
    };
  }
}

// Export singleton instance
export const earningSystem = new MockEarningSystem();