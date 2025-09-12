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

export function useRunTracker() {
  const [state, setState] = useState<'idle' | 'running' | 'paused' | 'ended' | 'stationary'>('idle');
  const [stats, setStats] = useState<RunStats>({
    distanceMeters: 0,
    elapsedMs: 0,
    currentSpeedKmh: 0,
    averageSpeedKmh: 0,
    gpsPoints: []
  });

  const watchIdRef = useRef<number | null>(null);
  const lastValidPositionRef = useRef<GPSPoint | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const calculateDistance = (point1: GPSPoint, point2: GPSPoint): number => {
    const R = 6371000; // Earth radius in meters
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const newPoint: GPSPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy
    };

    console.log(`GPS: lat=${newPoint.lat.toFixed(6)}, lng=${newPoint.lng.toFixed(6)}, accuracy=${newPoint.accuracy}m`);

    // First position - just store it
    if (!lastValidPositionRef.current) {
      lastValidPositionRef.current = newPoint;
      setStats(prev => ({
        ...prev,
        gpsPoints: [newPoint]
      }));
      console.log('Initial position set');
      return;
    }

    // Calculate distance from last position
    const distance = calculateDistance(lastValidPositionRef.current, newPoint);
    
    // FIXED: Accept movement if distance > 2 meters (not comparing to accuracy)
    if (distance > 2) {
      console.log(`Movement detected: ${distance.toFixed(2)}m`);
      
      setStats(prev => {
        const newDistance = prev.distanceMeters + distance;
        const timeDiff = (newPoint.timestamp - lastValidPositionRef.current!.timestamp) / 1000;
        const speedMs = timeDiff > 0 ? distance / timeDiff : 0;
        
        return {
          ...prev,
          distanceMeters: newDistance,
          currentSpeedKmh: speedMs * 3.6,
          gpsPoints: [...prev.gpsPoints, newPoint]
        };
      });
      
      lastValidPositionRef.current = newPoint;
    }
  }, []);

  const start = useCallback(() => {
    console.log('Starting GPS tracking...');
    setState('running');
    startTimeRef.current = Date.now();
    lastValidPositionRef.current = null;
    
    setStats({
      distanceMeters: 0,
      elapsedMs: 0,
      currentSpeedKmh: 0,
      averageSpeedKmh: 0,
      gpsPoints: []
    });

    if (!navigator.geolocation) {
      alert('GPS not supported on this device');
      return;
    }

    // Start watching position with mobile-optimized settings
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (error) => {
        console.error('GPS Error:', error);
        if (error.code === 1) {
          alert('Location permission denied. Enable in Settings.');
        } else if (error.code === 2) {
          alert('GPS signal lost. Move to open area.');
        } else {
          alert(`GPS Error: ${error.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000
      }
    );
  }, [handlePosition]);

  const pause = useCallback(() => {
    setState('paused');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    setState('running');
    // Restart watching
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        (error) => console.error('GPS Error:', error),
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000
        }
      );
    }
  }, [handlePosition]);

  const end = useCallback(() => {
    setState('ended');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    console.log(`Run ended. Total distance: ${stats.distanceMeters.toFixed(2)}m`);
  }, [stats.distanceMeters]);

  const discard = useCallback(() => {
    setState('idle');
    setStats({
      distanceMeters: 0,
      elapsedMs: 0,
      currentSpeedKmh: 0,
      averageSpeedKmh: 0,
      gpsPoints: []
    });
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const addDistance = useCallback((meters: number) => {
    setStats(prev => ({
      ...prev,
      distanceMeters: prev.distanceMeters + meters
    }));
    console.log(`Manually added ${meters}m`);
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    if (state === 'running') {
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

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
    discard,
    addDistance
  };
}