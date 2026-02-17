import { useState, useCallback } from 'react';

export function useScore() {
  const [score, setScore] = useState(0);
  const [totalBytesFreed, setTotalBytesFreed] = useState(0);

  const addPoints = useCallback((bytesFreed: number) => {
    const points = Math.floor(bytesFreed / (1024 * 1024));
    setScore((prev) => prev + points);
    setTotalBytesFreed((prev) => prev + bytesFreed);
    return points;
  }, []);

  return {
    score,
    totalBytesFreed,
    addPoints,
  };
}
