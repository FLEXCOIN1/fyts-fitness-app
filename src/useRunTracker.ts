import { useState, useRef } from 'react';

export type GPSSample = {
  lat: number;
  lon: number;
  t: number;
};

export type RunState = 'idle' | 'running' | 'paused' | 'ended';

export type RunStats = {
  distanceMeters: number;
  elapsedMs: number;
  samples: GPSSample[];
};

export function useRunTracker() {
  const [state, setState] = useState<RunState>('idle');
  const [stats, setStats] = useState<RunStats>({
    distanceMeters: 0,
    elapsedMs: 0,
    samples: []
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = async () => {
    setState('running');
    startTimeRef.current = Date.now();
    console.log('GPS tracking started!');
    
    // Start GPS tracking
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          console.log('GPS position:', position.coords.latitude, position.coords.longitude);
          const sample: GPSSample = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            t: Date.now()
          };
          setStats(prev => ({
            ...prev,
            samples: [...prev.samples, sample],
            elapsedMs: Date.now() - startTimeRef.current,
            distanceMeters: prev.samples.length * 10 // Simple fake distance for testing
          }));
        },
        (error) => console.error('GPS Error:', error),
        { enableHighAccuracy: true }
      );
    }
  };

  const pause = () => {
    setState('paused');
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
  };

  const end = () => {
    setState('ended');
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
  };

  const discard = () => {
    setState('idle');
    setStats({ distanceMeters: 0, elapsedMs: 0, samples: [] });
  };

  return { state, stats, start, pause, end, discard };
}