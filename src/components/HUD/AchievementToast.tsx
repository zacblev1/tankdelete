import { Achievement } from '../../lib/achievements';
import './AchievementToast.css';

interface AchievementToastProps {
  achievement: Achievement;
  visible: boolean;
}

export function AchievementToast({ achievement, visible }: AchievementToastProps) {
  return (
    <div className={`achievement-toast ${visible ? 'visible' : ''}`}>
      <div className="achievement-icon">🏆</div>
      <div className="achievement-text">
        <div className="achievement-label">ACHIEVEMENT UNLOCKED</div>
        <div className="achievement-name">{achievement.name}</div>
      </div>
    </div>
  );
}
