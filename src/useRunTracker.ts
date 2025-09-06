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

  // Add debug state for troubleshooting
  const [gpsDebug, setGpsDebug] = useState({
    lastLat: 0,
    lastLng: 0,
    updateCount: 0,
    lastAccuracy: 0
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const lastValidPositionRef = useRef<GPSPoint | null>(null);
  const allPositionsRef = useRef<GPSPoint[]>([]);
  const timerRef = useRef<number | null>(null);

  // More aggressive GPS options for mobile
  const gpsOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0
  };

  // Simplified distance calculation that works better for short distances
  const calculateDistance = (point1: GPSPoint, point2: GPSPoint): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const lat1Rad = point1.lat * Math.PI / 180;
    const lat2Rad = point2.lat * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Add minimum distance threshold to avoid floating point errors
    return distance < 0.5 ? 0 : distance;
  };

  const handlePosition = useCallback((position: GeolocationPosition) => {
    if (state !== 'running' && state !== 'stationary') return;

    const newPoint: GPSPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy
    };

    // Update debug info
    setGpsDebug(prev => ({
      lastLat: newPoint.lat,
      lastLng: newPoint.lng,
      updateCount: prev.updateCount + 1,
      lastAccuracy: newPoint.accuracy
    }));

    // Store all positions for analysis
    allPositionsRef.current.push(newPoint);

    // Log everything for debugging
    console.log('GPS Position:', {
      lat: newPoint.lat.toFixed(8),
      lng: newPoint.lng.toFixed(8),
      accuracy: newPoint.accuracy.toFixed(1),
      updateNumber: allPositionsRef.current.length
    });

    // Very lenient accuracy filter for mobile (100m)
    if (newPoint.accuracy > 100) {
      console.log('Accuracy too poor, but still processing:', newPoint.accuracy);
    }

    // Process movement
    if (lastValidPositionRef.current) {
      const distance = calculateDistance(lastValidPositionRef.current, newPoint);
      const timeDiff = (newPoint.timestamp - lastValidPositionRef.current.timestamp) / 1000;
      
      console.log('Movement calculation:', {
        distance: distance.toFixed(2) + 'm',
        timeDiff: timeDiff.toFixed(1) + 's',
        threshold: '1m'
      });
      
      // Very low threshold for mobile testing - 1 meter
      if (distance >= 1) {
        const speedMs = distance / timeDiff;
        const speedKmh = speedMs * 3.6;
        
        // Accept any reasonable speed (walking to running)
        if (speedKmh < 60) {
          console.log('Valid movement detected!', {
            distance: distance.toFixed(2),
            totalDistance: (stats.distanceMeters + distance).toFixed(2)
          });
          
          setState('running');
          
          setStats(prev => ({
            ...prev,
            distanceMeters: prev.distanceMeters + distance,
            currentSpeedKmh: speedKmh,
            gpsPoints: [...prev.gpsPoints, newPoint]
          }));
          
          lastValidPositionRef.current = newPoint;
        }
      } else if (distance > 0) {
        // Even tiny movements count
        console.log('Micro movement:', distance.toFixed(4) + 'm');
      }
    } else {
      // First position
      lastValidPositionRef.current = newPoint;
      setStats(prev => ({
        ...prev,
        gpsPoints: [newPoint]
      }));
      console.log('Initial position set');
    }

    // Show debug info on screen
    if (window.location.search.includes('debug')) {
      alert(`GPS: ${newPoint.lat.toFixed(6)}, ${newPoint.lng.toFixed(6)}\nAccuracy: ${newPoint.accuracy}m\nTotal distance: ${stats.distanceMeters.toFixed(2)}m`);
    }
  }, [state, stats.distanceMeters]);

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    console.error('GPS Error Details:', error);
    
    let message = '';
    switch(error.code) {
      case 1:
        message = 'Location permission denied. Please enable in phone settings.';
        break;
      case 2:
        message = 'GPS signal lost. Try moving outdoors with clear sky view.';
        break;
      case 3:
        message = 'GPS timeout. Poor signal.';
        break;
    }
    
    if (state === 'running' || state === 'stationary') {
      // Don't alert repeatedly - just log
      console.error(message);
    }
  }, [state]);

  // Add fallback movement simulation for testing
  const simulateMovement = useCallback(() => {
    if (state !== 'running') return;
    
    // Add 5 meters every update for testing
    setStats(prev => ({
      ...prev,
      distanceMeters: prev.distanceMeters + 5,
      currentSpeedKmh: 5.0
    }));
    
    console.log('Simulated 5m movement added');
  }, [state]);

  // Timer
  useEffect(() => {
    if (state === 'running' || state === 'stationary') {
      timerRef.current = window.setInterval(() => {
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
      alert('GPS not supported');
      return;
    }

    // Reset everything
    setState('running');
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    lastValidPositionRef.current = null;
    allPositionsRef.current = [];
    
    setStats({
      distanceMeters: 0,
      elapsedMs: 0,
      currentSpeedKmh: 0,
      averageSpeedKmh: 0,
      gpsPoints: []
    });

    console.log('Starting GPS tracking with aggressive settings...');
    
    // Get initial position first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Got initial position');
        handlePosition(position);
      },
      (error) => {
        console.error('Initial position error:', error);
        // Continue anyway
      },
      gpsOptions
    );

    // Start watching
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      gpsOptions
    );

    // Add debug mode: hold for 3 seconds to activate
    let debugTimer: any;
    const activateDebug = () => {
      debugTimer = setTimeout(() => {
        if (confirm('Activate GPS debug mode?')) {
          // Simulate movement for testing
          const simInterval = setInterval(() => {
            if (state !== 'running') {
              clearInterval(simInterval);
              return;
            }
            simulateMovement();
          }, 2000);
        }
      }, 3000);
    };

    window.addEventListener('touchstart', activateDebug);
    window.addEventListener('touchend', () => clearTimeout(debugTimer));
  }, [handlePosition, handlePositionError, simulateMovement, state]);

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
    
    // Log final stats
    console.log('Run completed:', {
      distance: stats.distanceMeters,
      duration: stats.elapsedMs,
      points: stats.gpsPoints.length,
      allPositions: allPositionsRef.current.length
    });

    // If no movement detected, show debug info
    if (stats.distanceMeters < 10) {
      console.log('Low distance detected. GPS positions received:', allPositionsRef.current);
    }
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
    lastValidPositionRef.current = null;
    allPositionsRef.current = [];
  }, []);

  const formattedStats = {
    distance: `${(stats.distanceMeters / 1000).toFixed(2)} km`,
    duration: new Date(stats.elapsedMs).toISOString().substr(11, 8),
    currentSpeed: `${stats.currentSpeedKmh.toFixed(1)} km/h`,
    averageSpeed: `${stats.averageSpeedKmh.toFixed(1)} km/h`,
    pace: stats.averageSpeedKmh > 0 
      ? `${(60 / stats.averageSpeedKmh).toFixed(1)} min/km`
      : '--:--',
    // Add debug info
    gpsUpdates: gpsDebug.updateCount
  };

  return {
    state,
    stats,
    formattedStats,
    start,
    pause,
    resume,
    end,
    discard,
    gpsDebug // Export debug info
  };
}