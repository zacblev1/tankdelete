import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface Explosion {
  id: number;
  position: THREE.Vector3;
  color: string;
  scale: number;
  spawnTime: number;
}

export function useExplosionPool() {
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const nextIdRef = useRef(0);

  const spawn = (position: THREE.Vector3, color: string, scale: number) => {
    const explosion: Explosion = {
      id: nextIdRef.current++,
      position: position.clone(),
      color,
      scale,
      spawnTime: performance.now(),
    };

    setExplosions((prev) => [...prev, explosion]);
  };

  const despawn = (id: number) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setExplosions([]);
    };
  }, []);

  return {
    explosions,
    spawn,
    despawn,
  };
}
