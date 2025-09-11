import { useState, useEffect, useRef, useCallback } from 'react';

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
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

  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const lastPositionRef = useRef<GPSPoint | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const stationaryCountRef = useRef<number>(0);

  const calculateDistance = (point1: GPSPoint, point2: GPSPoint): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * 
              Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const pollGPS = useCallback(() => {
    if (state !== 'running' && state !== 'stationary') return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPoint: GPSPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        };

        console.log('GPS Position:', {
          lat: newPoint.lat.toFixed(6),
          lng: newPoint.lng.toFixed(6),
          accuracy: position.coords.accuracy
        });

        if (lastPositionRef.current) {
          const distance = calculateDistance(lastPositionRef.current, newPoint);
          const timeDiff = (newPoint.timestamp - lastPositionRef.current.timestamp) / 1000;
          
          // Very low threshold for mobile
          if (distance > 0.5) {
            const speedKmh = (distance / timeDiff) * 3.6;
            
            if (speedKmh < 60) { // Reasonable speed check
              stationaryCountRef.current = 0;
              setState('running');
              
              setStats(prev => ({
                ...prev,
                distanceMeters: prev.distanceMeters + distance,
                currentSpeedKmh: speedKmh,
                gpsPoints: [...prev.gpsPoints, newPoint]
              }));
              
              console.log(`Movement: ${distance.toFixed(2)}m, Total: ${(stats.distanceMeters + distance).toFixed(2)}m`);
            }
          } else {
            stationaryCountRef.current++;
            if (stationaryCountRef.current > 3) {
              setState('stationary');
            }
          }
        }
        
        lastPositionRef.current = newPoint;
      },
      (error) => {
        console.error('GPS Error:', error.message);
      },
      {
        enableHighAccuracy: false, // Better for mobile
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [state, stats.distanceMeters]);

  // Timer for elapsed time
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const start = useCallback(() => {
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
    
    // Initial position
    pollGPS();
    
    // Poll every 2 seconds (more reliable on mobile)
    pollIntervalRef.current = window.setInterval(pollGPS, 2000);
  }, [pollGPS]);

  const pause = useCallback(() => {
    setState('paused');
    pauseStartRef.current = Date.now();
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    setState('running');
    pausedDurationRef.current += Date.now() - pauseStartRef.current;
    pollIntervalRef.current = window.setInterval(pollGPS, 2000);
  }, [pollGPS]);

  const end = useCallback(() => {
    setState('ended');
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    console.log('Run completed:', {
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

  // Manual distance add for debugging
  const addDistance = useCallback((meters: number) => {
    setStats(prev => ({
      ...prev,
      distanceMeters: prev.distanceMeters + meters
    }));
    console.log(`Manually added ${meters}m, new total: ${stats.distanceMeters + meters}m`);
  }, [stats.distanceMeters]);

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