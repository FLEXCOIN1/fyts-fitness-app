import { useState, useRef, useEffect } from 'react';

export type GPSSample = {
  lat: number;
  lon: number;
  accuracy: number;
  t: number;
  speed?: number;
};

export type RunState = 'idle' | 'running' | 'paused' | 'ended' | 'stationary';

export type RunStats = {
  distanceMeters: number;
  elapsedMs: number;
  avgPace: number;
  samples: GPSSample[];
  filteredSamples: GPSSample[];
};

// Professional Kalman Filter optimized for smartphone GPS
class GPSKalmanFilter {
  private lat: number = 0;
  private lon: number = 0;
  private variance: number = -1;
  private readonly minAccuracy: number = 2; // 2 meters minimum (realistic for phones)
  private readonly Q: number = 1; // Reduced process noise for walking speeds
  private lastTimeStamp: number = 0;

  public process(lat: number, lon: number, accuracy: number, timeStampMs: number): GPSSample {
    if (accuracy < this.minAccuracy) accuracy = this.minAccuracy;
    
    if (this.variance < 0) {
      this.lat = lat;
      this.lon = lon;
      this.variance = accuracy * accuracy;
    } else {
      const timeInc = (timeStampMs - this.lastTimeStamp) / 1000.0;
      
      if (timeInc > 0) {
        this.variance += timeInc * this.Q * this.Q;
      }
      
      const K = this.variance / (this.variance + accuracy * accuracy);
      this.lat += K * (lat - this.lat);
      this.lon += K * (lon - this.lon);
      this.variance = (1 - K) * this.variance;
    }
    
    this.lastTimeStamp = timeStampMs;
    
    return {
      lat: this.lat,
      lon: this.lon,
      accuracy: Math.sqrt(this.variance),
      t: timeStampMs
    };
  }
}

// Movement analyzer optimized for smartphone GPS accuracy
class MovementAnalyzer {
  private history: GPSSample[] = [];
  private readonly maxHistory = 8; // Reduced for faster response
  private readonly SPEED_THRESHOLD = 0.3; // Lower threshold (1.08 km/h)
  private readonly ACCURACY_THRESHOLD = 50; // More realistic for phones (was 20m)
  private readonly MAX_REASONABLE_SPEED = 20; // Higher for brief GPS errors
  private readonly MIN_TIME_DIFF = 0.8; // Slightly longer intervals
  private readonly GPS_DRIFT_RADIUS = 8; // Ignore movements within 8m radius when stationary
  
  public addSample(sample: GPSSample): boolean {
    // Filter 1: Reject extremely poor accuracy readings
    if (sample.accuracy > this.ACCURACY_THRESHOLD) {
      console.log(`REJECTED: Poor accuracy ${sample.accuracy.toFixed(1)}m (threshold: ${this.ACCURACY_THRESHOLD}m)`);
      return false;
    }
    
    if (this.history.length > 0) {
      const lastSample = this.history[this.history.length - 1];
      const timeDiff = (sample.t - lastSample.t) / 1000;
      
      // Filter 2: Minimum time between readings
      if (timeDiff < this.MIN_TIME_DIFF) {
        console.log(`REJECTED: Too frequent (${timeDiff.toFixed(1)}s < ${this.MIN_TIME_DIFF}s)`);
        return false;
      }
      
      const distance = this.calculateDistance(lastSample.lat, lastSample.lon, sample.lat, sample.lon);
      const speed = distance / timeDiff;
      
      // Filter 3: Impossible speed detection (more lenient)
      if (speed > this.MAX_REASONABLE_SPEED) {
        console.log(`REJECTED: Impossible speed ${speed.toFixed(1)}m/s (${(speed * 3.6).toFixed(1)} km/h)`);
        return false;
      }
      
      // Filter 4: Advanced GPS bounce detection - more sophisticated
      if (this.history.length >= 3) {
        if (this.isGPSBounce(sample)) {
          console.log(`REJECTED: GPS bounce pattern detected`);
          return false;
        }
      }
    }
    
    this.history.push(sample);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    console.log(`ACCEPTED: GPS reading (${sample.accuracy.toFixed(1)}m accuracy)`);
    return true;
  }
  
  // Sophisticated GPS bounce detection
  private isGPSBounce(sample: GPSSample): boolean {
    const len = this.history.length;
    if (len < 3) return false;
    
    const current = sample;
    const last = this.history[len - 1];
    const prevPrev = this.history[len - 2];
    const prevPrevPrev = this.history[len - 3] || null;
    
    // Calculate distances in the chain
    const distLastToCurrent = this.calculateDistance(last.lat, last.lon, current.lat, current.lon);
    const distPrevPrevToCurrent = this.calculateDistance(prevPrev.lat, prevPrev.lon, current.lat, current.lon);
    const distPrevPrevToLast = this.calculateDistance(prevPrev.lat, prevPrev.lon, last.lat, last.lon);
    
    // Pattern 1: Oscillation detection - current point closer to older point than recent point
    if (distPrevPrevToCurrent < distLastToCurrent && 
        distLastToCurrent > 15 && 
        distPrevPrevToCurrent < 10) {
      return true;
    }
    
    // Pattern 2: Triangle pattern detection for small movements
    if (distLastToCurrent < 5 && distPrevPrevToLast < 5 && distPrevPrevToCurrent < 5) {
      // All points very close - likely stationary drift
      return true;
    }
    
    // Pattern 3: Sharp direction changes with small distances
    if (prevPrevPrev) {
      const totalDistance = distPrevPrevToLast + distLastToCurrent;
      const directDistance = this.calculateDistance(prevPrev.lat, prevPrev.lon, current.lat, current.lon);
      
      // If we traveled in a zigzag when we could have gone direct
      if (totalDistance > directDistance * 2 && directDistance < 12) {
        return true;
      }
    }
    
    return false;
  }
  
  public isMoving(): boolean {
    if (this.history.length < 3) return false;
    
    // Method 1: Velocity-based analysis (primary)
    const velocities: number[] = [];
    for (let i = 1; i < this.history.length; i++) {
      const prev = this.history[i - 1];
      const curr = this.history[i];
      const distance = this.calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
      const timeDiff = (curr.t - prev.t) / 1000;
      
      if (timeDiff > 0) {
        velocities.push(distance / timeDiff);
      }
    }
    
    if (velocities.length === 0) return false;
    
    // Use 75th percentile instead of median for more responsive detection
    velocities.sort((a, b) => a - b);
    const percentile75 = velocities[Math.floor(velocities.length * 0.75)];
    const velocityMoving = percentile75 > this.SPEED_THRESHOLD;
    
    // Method 2: Displacement analysis (secondary confirmation)
    const firstPoint = this.history[0];
    const lastPoint = this.history[this.history.length - 1];
    const totalDisplacement = this.calculateDistance(
      firstPoint.lat, firstPoint.lon,
      lastPoint.lat, lastPoint.lon
    );
    const timeSpan = (lastPoint.t - firstPoint.t) / 1000;
    const displacementBased = totalDisplacement > this.GPS_DRIFT_RADIUS && timeSpan > 3;
    
    // Combine both methods - more lenient for actual movement
    const isMoving = velocityMoving || displacementBased;
    
    console.log(`Movement analysis:
      - 75th percentile velocity: ${percentile75.toFixed(2)}m/s
      - Total displacement: ${totalDisplacement.toFixed(1)}m over ${timeSpan.toFixed(1)}s
      - Velocity-based moving: ${velocityMoving}
      - Displacement-based moving: ${displacementBased}
      - Final decision: ${isMoving ? 'MOVING' : 'STATIONARY'}`);
    
    return isMoving;
  }
  
  public getCurrentSpeed(): number {
    if (this.history.length < 2) return 0;
    
    // Use more data points for smoother speed calculation
    const recent = this.history.slice(-4); // Last 4 points
    const velocities: number[] = [];
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      const distance = this.calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
      const timeDiff = (curr.t - prev.t) / 1000;
      
      if (timeDiff > 0) {
        velocities.push(distance / timeDiff);
      }
    }
    
    if (velocities.length === 0) return 0;
    
    // Use median of recent velocities for stability
    velocities.sort((a, b) => a - b);
    return velocities[Math.floor(velocities.length / 2)];
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  const miles = meters * 0.000621371;
  if (miles >= 1) {
    return `${miles.toFixed(2)} mi`;
  }
  const feet = meters * 3.28084;
  return `${Math.round(feet)} ft`;
}

function formatPace(distanceMeters: number, elapsedMs: number): string {
  if (distanceMeters < 50 || elapsedMs < 20000) return "--:--";
  
  const distanceMiles = distanceMeters * 0.000621371;
  const elapsedMinutes = elapsedMs / 60000;
  const paceMinutesPerMile = elapsedMinutes / distanceMiles;
  
  const minutes = Math.floor(paceMinutesPerMile);
  const seconds = Math.round((paceMinutesPerMile - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatSpeed(metersPerSecond: number): string {
  const mph = metersPerSecond * 2.23694;
  return `${mph.toFixed(1)} mph`;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export function useRunTracker() {
  const [state, setState] = useState<RunState>('idle');
  const [stats, setStats] = useState<RunStats>({
    distanceMeters: 0,
    elapsedMs: 0,
    avgPace: 0,
    samples: [],
    filteredSamples: []
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  
  const kalmanFilterRef = useRef<GPSKalmanFilter>(new GPSKalmanFilter());
  const movementAnalyzerRef = useRef<MovementAnalyzer>(new MovementAnalyzer());
  const lastValidPositionRef = useRef<GPSSample | null>(null);
  const stationaryCheckTimeRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(0);
  
  const STATIONARY_TIMEOUT = 45000; // 45 seconds - longer for smartphone GPS

  useEffect(() => {
    if (state === 'running' || state === 'stationary') {
      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const currentSpeed = movementAnalyzerRef.current.getCurrentSpeed();
        currentSpeedRef.current = currentSpeed;
        
        setStats(prev => ({ ...prev, elapsedMs: elapsed }));
        
        if (state === 'running' && !movementAnalyzerRef.current.isMoving()) {
          if (stationaryCheckTimeRef.current === 0) {
            stationaryCheckTimeRef.current = Date.now();
            console.log('Starting stationary timer...');
          } else if (Date.now() - stationaryCheckTimeRef.current > STATIONARY_TIMEOUT) {
            console.log('Transitioning to stationary mode after 45s');
            setState('stationary');
          }
        } else if (state === 'stationary' && movementAnalyzerRef.current.isMoving()) {
          console.log('Movement detected - resuming active tracking');
          setState('running');
          stationaryCheckTimeRef.current = 0;
        } else if (state === 'running' && movementAnalyzerRef.current.isMoving()) {
          stationaryCheckTimeRef.current = 0; // Reset timer
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  const onLocationUpdate = (position: GeolocationPosition) => {
    const rawSample: GPSSample = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy || 10,
      t: Date.now(),
      speed: position.coords.speed || undefined
    };

    console.log(`Raw GPS: ${rawSample.lat.toFixed(6)}, ${rawSample.lon.toFixed(6)}, accuracy: ${rawSample.accuracy.toFixed(1)}m`);

    const filteredSample = kalmanFilterRef.current.process(
      rawSample.lat,
      rawSample.lon,
      rawSample.accuracy,
      rawSample.t
    );

    console.log(`Kalman filtered: ${filteredSample.lat.toFixed(6)}, ${filteredSample.lon.toFixed(6)}`);

    const validSample = movementAnalyzerRef.current.addSample(filteredSample);
    if (!validSample) return;

    let addedDistance = 0;
    if (lastValidPositionRef.current && movementAnalyzerRef.current.isMoving()) {
      const distance = calculateDistance(
        lastValidPositionRef.current.lat,
        lastValidPositionRef.current.lon,
        filteredSample.lat,
        filteredSample.lon
      );
      
      // More lenient distance accumulation threshold
      if (distance > 1.5) { // Reduced from 2m to 1.5m
        addedDistance = distance;
        console.log(`✅ Distance added: ${distance.toFixed(1)}m (total: ${(stats.distanceMeters + distance).toFixed(1)}m)`);
      } else {
        console.log(`⏸️ Distance too small: ${distance.toFixed(1)}m (threshold: 1.5m)`);
      }
    } else if (!movementAnalyzerRef.current.isMoving()) {
      console.log(`🛑 No distance added - not moving`);
    } else {
      console.log(`📍 First position logged`);
    }

    lastValidPositionRef.current = filteredSample;

    setStats(prev => ({
      ...prev,
      samples: [...prev.samples, rawSample],
      filteredSamples: [...prev.filteredSamples, filteredSample],
      distanceMeters: prev.distanceMeters + addedDistance
    }));
  };

  const start = async () => {
    setState('running');
    startTimeRef.current = Date.now();
    stationaryCheckTimeRef.current = 0;
    console.log('🏃 Professional GPS tracking started - optimized for smartphone hardware!');
    
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onLocationUpdate,
        (error) => console.error('GPS Error:', error),
        { 
          enableHighAccuracy: true,
          timeout: 15000, // Longer timeout for phones
          maximumAge: 2000 // Slightly older readings OK
        }
      );
    }
  };

  const pause = () => {
    setState('paused');
    stationaryCheckTimeRef.current = 0;
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const resume = () => {
    setState('running');
    stationaryCheckTimeRef.current = 0;
    start();
  };

  const end = () => {
    setState('ended');
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const discard = () => {
    setState('idle');
    setStats({ 
      distanceMeters: 0, 
      elapsedMs: 0, 
      avgPace: 0, 
      samples: [],
      filteredSamples: []
    });
    startTimeRef.current = 0;
    lastValidPositionRef.current = null;
    stationaryCheckTimeRef.current = 0;
    
    kalmanFilterRef.current = new GPSKalmanFilter();
    movementAnalyzerRef.current = new MovementAnalyzer();
  };

  const formattedStats = {
    distance: formatDistance(stats.distanceMeters),
    duration: formatTime(stats.elapsedMs),
    pace: formatPace(stats.distanceMeters, stats.elapsedMs),
    currentSpeed: formatSpeed(currentSpeedRef.current)
  };

  return { 
    state, 
    stats, 
    formattedStats,
    start, 
    pause, 
    resume,
    end, 
    discard 
  };
}