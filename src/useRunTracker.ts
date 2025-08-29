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

// Professional Kalman Filter for GPS
class GPSKalmanFilter {
  private lat: number = 0;
  private lon: number = 0;
  private variance: number = -1;
  private readonly minAccuracy: number = 1;
  private readonly Q: number = 3;
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

// Movement analyzer with bad data filtering
class MovementAnalyzer {
  private history: GPSSample[] = [];
  private readonly maxHistory = 10;
  private readonly SPEED_THRESHOLD = 0.5;
  private readonly ACCURACY_THRESHOLD = 20;
  private readonly MAX_REASONABLE_SPEED = 15;
  private readonly MIN_TIME_DIFF = 0.5;
  
  public addSample(sample: GPSSample): boolean {
    if (sample.accuracy > this.ACCURACY_THRESHOLD) {
      console.log(`REJECTED: Poor accuracy ${sample.accuracy.toFixed(1)}m`);
      return false;
    }
    
    if (this.history.length > 0) {
      const lastSample = this.history[this.history.length - 1];
      const timeDiff = (sample.t - lastSample.t) / 1000;
      
      if (timeDiff < this.MIN_TIME_DIFF) {
        console.log(`REJECTED: Too frequent (${timeDiff.toFixed(1)}s)`);
        return false;
      }
      
      const distance = this.calculateDistance(lastSample.lat, lastSample.lon, sample.lat, sample.lon);
      const speed = distance / timeDiff;
      
      if (speed > this.MAX_REASONABLE_SPEED) {
        console.log(`REJECTED: Impossible speed ${speed.toFixed(1)}m/s (${(speed * 3.6).toFixed(1)} km/h)`);
        return false;
      }
      
      if (this.history.length >= 3) {
        const prevPrev = this.history[this.history.length - 2];
        const distanceToPrevPrev = this.calculateDistance(prevPrev.lat, prevPrev.lon, sample.lat, sample.lon);
        const distanceToLast = distance;
        
        if (distanceToPrevPrev < distanceToLast && distanceToLast < 10 && distanceToPrevPrev < 8) {
          console.log(`REJECTED: GPS bounce detected`);
          return false;
        }
      }
    }
    
    this.history.push(sample);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    console.log(`ACCEPTED: GPS reading with accuracy ${sample.accuracy.toFixed(1)}m`);
    return true;
  }
  
  public isMoving(): boolean {
    if (this.history.length < 3) return false;
    
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
    
    velocities.sort((a, b) => a - b);
    const medianVelocity = velocities[Math.floor(velocities.length / 2)];
    
    const isMoving = medianVelocity > this.SPEED_THRESHOLD;
    console.log(`Movement analysis - Median velocity: ${medianVelocity.toFixed(2)}m/s, Moving: ${isMoving}`);
    
    return isMoving;
  }
  
  public getCurrentSpeed(): number {
    if (this.history.length < 2) return 0;
    
    const recent = this.history.slice(-3);
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
    
    return velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
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
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatPace(distanceMeters: number, elapsedMs: number): string {
  if (distanceMeters < 100 || elapsedMs < 30000) return "--:--";
  
  const distanceKm = distanceMeters / 1000;
  const elapsedMinutes = elapsedMs / 60000;
  const paceMinutesPerKm = elapsedMinutes / distanceKm;
  
  const minutes = Math.floor(paceMinutesPerKm);
  const seconds = Math.round((paceMinutesPerKm - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatSpeed(metersPerSecond: number): string {
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
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
  
  const STATIONARY_TIMEOUT = 30000;

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
          } else if (Date.now() - stationaryCheckTimeRef.current > STATIONARY_TIMEOUT) {
            console.log('Transitioning to stationary mode');
            setState('stationary');
          }
        } else if (state === 'stationary' && movementAnalyzerRef.current.isMoving()) {
          console.log('Movement detected - resuming tracking');
          setState('running');
          stationaryCheckTimeRef.current = 0;
        } else if (state === 'running' && movementAnalyzerRef.current.isMoving()) {
          stationaryCheckTimeRef.current = 0;
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

    console.log(`Filtered GPS: ${filteredSample.lat.toFixed(6)}, ${filteredSample.lon.toFixed(6)}, accuracy: ${filteredSample.accuracy.toFixed(1)}m`);

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
      
      if (distance > 2) {
        addedDistance = distance;
        console.log(`Distance added: ${distance.toFixed(1)}m`);
      }
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
    console.log('Professional GPS tracking started with Kalman filtering and bad data rejection!');
    
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onLocationUpdate,
        (error) => console.error('GPS Error:', error),
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
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