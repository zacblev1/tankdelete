import { formatBytes } from '../lib/format';
import { ScoreCounter } from './HUD/ScoreCounter';
import './HUD.css';

interface HUDProps {
  deletedCount: number;
  deletedBytes: number;
  score: number;
}

export function HUD({ deletedCount, deletedBytes, score }: HUDProps) {
  // Show HUD when score > 0 OR deletedCount > 0
  if (deletedCount === 0 && score === 0) {
    return null;
  }

  return (
    <>
      <ScoreCounter targetScore={score} />
      <div className="hud">
        <div className="hud-stats">
          <span className="hud-label">Files deleted:</span>
          <span className="hud-value">{deletedCount}</span>
          <span className="hud-separator">|</span>
          <span className="hud-label">Freed:</span>
          <span className="hud-value">{formatBytes(deletedBytes)}</span>
        </div>
      </div>
    </>
  );
}
