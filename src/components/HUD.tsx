import { formatBytes } from '../lib/format';
import './HUD.css';

interface HUDProps {
  deletedCount: number;
  deletedBytes: number;
}

export function HUD({ deletedCount, deletedBytes }: HUDProps) {
  // Only show HUD when at least 1 file has been deleted
  if (deletedCount === 0) {
    return null;
  }

  return (
    <div className="hud">
      <div className="hud-stats">
        <span className="hud-label">Files deleted:</span>
        <span className="hud-value">{deletedCount}</span>
        <span className="hud-separator">|</span>
        <span className="hud-label">Freed:</span>
        <span className="hud-value">{formatBytes(deletedBytes)}</span>
      </div>
    </div>
  );
}
