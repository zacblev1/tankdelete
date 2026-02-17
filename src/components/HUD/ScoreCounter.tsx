import { useEffect, useRef, useState } from 'react';
import './ScoreCounter.css';

interface ScoreCounterProps {
  targetScore: number;
}

export function ScoreCounter({ targetScore }: ScoreCounterProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startScoreRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    // Cancel any ongoing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const diff = Math.abs(targetScore - displayScore);
    if (diff === 0) return;

    // Calculate duration: 2ms per point, max 1 second
    const duration = Math.min(diff * 2, 1000);

    startScoreRef.current = displayScore;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - progress)^3
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startScoreRef.current + (targetScore - startScoreRef.current) * eased;
      setDisplayScore(Math.round(current));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetScore, displayScore]);

  return (
    <div className="score-counter">
      <div className="score-label">SCORE</div>
      <div className="score-value">{displayScore.toLocaleString()}</div>
    </div>
  );
}
