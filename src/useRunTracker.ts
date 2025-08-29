import { useState, useRef, useEffect } from 'react';

export type GPSSample = {
  lat: number;
  lon: number;
  t: number;
};

export type RunState = 'idle' | 'running' | 'paused' | 'ended' | 'stationary';

export type RunStats = {
  distanceMeters: number;
  elapsedMs: number;
  avgPace: number;
  samples: GPSSample[];
};

// Calculate distance between two GPS points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
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

// Format time as MM:SS
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Format distance as X.XX km or XXX m
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

// Calculate pace as min/km
function calculatePace(distanceMeters: number, elapsedMs: number): string {
  if (distanceMeters < 100 || elapsedMs < 30000) return "--:--";
  
  const distanceKm = distanceMeters / 1000;
  const elapsedMinutes = elapsedMs / 60000;
  const paceMinutesPerKm = elapsedMinutes / distanceKm;
  
  const minutes = Math.floor(paceMinutesPerKm);
  const seconds = Math.round((paceMinutesPerKm - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useRunTracker() {
  const [state, setState] = useState<RunState>('idle');
  const [stats, setStats] = useState<RunStats>({
    distanceMeters: 0,
    elapsedMs: 0,
    avgPace: 0,
    samples: []
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  
  // GPS filtering variables
  const lastValidLocationRef = useRef<GPSSample | null>(null);
  const lastMovementTimeRef = useRef<number>(0);
  const DISTANCE_THRESHOLD = 7; // 7 meters minimum movement
  const STATIONARY_TIMEOUT = 60000; // 60 seconds without movement = stationary
  const STATIONARY_THRESHOLD = 15; // 15 meters needed to resume from stationary

  // Update elapsed time every second when running
  useEffect(() => {
    if (state === 'running' || state === 'stationary') {
      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setStats(prev => ({ ...prev, elapsedMs: elapsed }));
        
        // Check for stationary timeout
        if (state === 'running' && lastMovementTimeRef.current > 0) {
          const timeSinceLastMovement = Date.now() - lastMovementTimeRef.current;
          if (timeSinceLastMovement > STATIONARY_TIMEOUT) {
            console.log('Detected stationary - switching to stationary mode');
            setState('stationary');
          }
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
    const currentLocation: GPSSample = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      t: Date.now()
    };

    console.log('GPS update:', currentLocation.lat, currentLocation.lon);

    if (lastValidLocationRef.current === null) {
      // First location point - just record it
      lastValidLocationRef.current = currentLocation;
      lastMovementTimeRef.current = Date.now();
      setStats(prev => ({
        ...prev,
        samples: [currentLocation]
      }));
      return;
    }

    // Calculate distance from last valid location
    const distance = calculateDistance(
      lastValidLocationRef.current.lat,
      lastValidLocationRef.current.lon,
      currentLocation.lat,
      currentLocation.lon
    );

    console.log(`Distance from last valid location: ${distance.toFixed(1)}m`);

    // Determine threshold based on current state
    const threshold = state === 'stationary' ? STATIONARY_THRESHOLD : DISTANCE_THRESHOLD;

    // Filter out GPS drift
    if (distance > threshold) {
      console.log(`Valid movement detected (${distance.toFixed(1)}m > ${threshold}m)`);
      
      // Valid movement - update distance and location
      setStats(prev => ({
        ...prev,
        distanceMeters: prev.distanceMeters + distance,
        samples: [...prev.samples, currentLocation]
      }));

      lastValidLocationRef.current = currentLocation;
      lastMovementTimeRef.current = Date.now();

      // Resume from stationary if needed
      if (state === 'stationary') {
        console.log('Resuming from stationary mode');
        setState('running');
      }
    } else {
      console.log(`GPS drift filtered out (${distance.toFixed(1)}m < ${threshold}m)`);
    }
  };

  const start = async () => {
    setState('running');
    startTimeRef.current = Date.now();
    lastMovementTimeRef.current = Date.now();
    console.log('GPS tracking started with filtering!');
    
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onLocationUpdate,
        (error) => console.error('GPS Error:', error),
        { 
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        }
      );
    }
  };

  const pause = () => {
    setState('paused');
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const resume = () => {
    setState('running');
    lastMovementTimeRef.current = Date.now();
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
    setStats({ distanceMeters: 0, elapsedMs: 0, avgPace: 0, samples: [] });
    startTimeRef.current = 0;
    lastValidLocationRef.current = null;
    lastMovementTimeRef.current = 0;
  };

  // Format stats for display
  const formattedStats = {
    distance: formatDistance(stats.distanceMeters),
    duration: formatTime(stats.elapsedMs),
    pace: calculatePace(stats.distanceMeters, stats.elapsedMs)
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