import { useState, useEffect, useRef, useCallback } from 'react';

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number;
}

interface RunStats {
  distanceMeters: number;
  elapsedMs: number;
  currentSpeedKmh: number;
  averageSpeedKmh: number;
  gpsPoints: GPSPoint[];
}

type RunState = 'idle' | 'running' | 'paused' | 'ended' | 'stationary';

export function useRunTracker() {
  const [state, setState] = useState<RunState>('idle');
  const [stats, setStats] = useState<RunStats>({
    distanceMeters: 0,
    elapsedMs: 0,
    currentSpeedKmh: 0,
    averageSpeedKmh: 0,
    gpsPoints: []
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const lastPositionRef = useRef<GPSPoint | null>(null);
  const stationaryCountRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  // Enhanced GPS options for mobile
  const gpsOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // Increased timeout for mobile
    maximumAge: 0
  };

  const calculateDistance = (point1: GPSPoint, point2: GPSPoint): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handlePosition = useCallback((position: GeolocationPosition) => {
    if (state !== 'running' && state !== 'stationary') return;

    const newPoint: GPSPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy
    };

    // Debug logging for mobile
    console.log('GPS Update:', {
      state: state,
      lat: newPoint.lat.toFixed(6),
      lng: newPoint.lng.toFixed(6),
      accuracy: newPoint.accuracy.toFixed(1)
    });

    // Skip if accuracy is too poor (>50 meters)
    if (newPoint.accuracy > 50) {
      console.log('GPS accuracy too poor, skipping point');
      return;
    }

    if (lastPositionRef.current) {
      const distance = calculateDistance(lastPositionRef.current, newPoint);
      const timeDiff = (newPoint.timestamp - lastPositionRef.current.timestamp) / 1000;
      
      console.log('Movement:', {
        distance: distance.toFixed(2) + 'm',
        timeDiff: timeDiff.toFixed(1) + 's'
      });
      
      // Movement detection threshold lowered for mobile
      if (distance > 2) { // Lowered from 5m to 2m for mobile
        const speedMs = distance / timeDiff;
        const speedKmh = speedMs * 3.6;
        
        // Filter out unrealistic speeds (>50 km/h for running)
        if (speedKmh < 50) {
          setState('running');
          stationaryCountRef.current = 0;
          
          setStats(prev => ({
            ...prev,
            distanceMeters: prev.distanceMeters + distance,
            currentSpeedKmh: speedKmh,
            gpsPoints: [...prev.gpsPoints, newPoint]
          }));
          
          lastPositionRef.current = newPoint;
        } else {
          console.log('Speed too high, likely GPS error:', speedKmh);
        }
      } else {
        // Stationary detection
        stationaryCountRef.current++;
        if (stationaryCountRef.current > 3 && state === 'running') {
          setState('stationary');
          console.log('User stationary');
        }
      }
    } else {
      // First position
      lastPositionRef.current = newPoint;
      setStats(prev => ({
        ...prev,
        gpsPoints: [newPoint]
      }));
      console.log('Initial GPS position set');
    }
  }, [state]);

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    console.error('GPS Error:', {
      code: error.code,
      message: error.message
    });
    
    // Provide user-friendly error messages
    let errorMessage = 'GPS error: ';
    switch(error.code) {
      case 1:
        errorMessage += 'Location permission denied. Please enable location services for this app.';
        break;
      case 2:
        errorMessage += 'Location unavailable. Please ensure GPS is enabled and try again outdoors.';
        break;
      case 3:
        errorMessage += 'Location timeout. Poor GPS signal, please try again.';
        break;
    }
    
    if (state === 'running' || state === 'stationary') {
      alert(errorMessage);
    }
  }, [state]);

  // Timer for elapsed time
  useEffect(() => {
    if (state === 'running' || state === 'stationary') {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTimeRef.current - pausedDurationRef.current;
        setStats(prev => ({
          ...prev,
          elapsedMs: elapsed,
          averageSpeedKmh: prev.distanceMeters > 0 
            ? (prev.distanceMeters / 1000) / (elapsed / 3600000)
            : 0
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state]);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      alert('GPS not supported by your browser');
      return;
    }

    setState('running');
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    lastPositionRef.current = null;
    stationaryCountRef.current = 0;
    
    setStats({
      distanceMeters: 0,
      elapsedMs: 0,
      currentSpeedKmh: 0,
      averageSpeedKmh: 0,
      gpsPoints: []
    });

    console.log('Starting GPS tracking...');
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handlePositionError,
      gpsOptions
    );

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      gpsOptions
    );
  }, [handlePosition, handlePositionError]);

  const pause = useCallback(() => {
    if (state === 'running' || state === 'stationary') {
      setState('paused');
      pauseStartRef.current = Date.now();
      
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
  }, [state]);

  const resume = useCallback(() => {
    if (state === 'paused') {
      setState('running');
      pausedDurationRef.current += Date.now() - pauseStartRef.current;
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handlePositionError,
        gpsOptions
      );
    }
  }, [state, handlePosition, handlePositionError]);

  const end = useCallback(() => {
    setState('ended');
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    console.log('Run ended:', {
      distance: stats.distanceMeters,
      duration: stats.elapsedMs,
      points: stats.gpsPoints.length
    });
  }, [stats]);

  const discard = useCallback(() => {
    setState('idle');
    setStats({
      distanceMeters: 0,
      elapsedMs: 0,
      currentSpeedKmh: 0,
      averageSpeedKmh: 0,
      gpsPoints: []
    });
    
    startTimeRef.current = 0;
    pausedDurationRef.current = 0;
    lastPositionRef.current = null;
  }, []);

  // Format stats for display
  const formattedStats = {
    distance: `${(stats.distanceMeters / 1000).toFixed(2)} km`,
    duration: new Date(stats.elapsedMs).toISOString().substr(11, 8),
    currentSpeed: `${stats.currentSpeedKmh.toFixed(1)} km/h`,
    averageSpeed: `${stats.averageSpeedKmh.toFixed(1)} km/h`,
    pace: stats.averageSpeedKmh > 0 
      ? `${(60 / stats.averageSpeedKmh).toFixed(1)} min/km`
      : '--:--'
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