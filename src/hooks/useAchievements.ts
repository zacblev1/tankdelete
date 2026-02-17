import { useEffect, useState, createElement } from 'react';
import toast from 'react-hot-toast';
import { ACHIEVEMENTS, Achievement } from '../lib/achievements';
import { AchievementToast } from '../components/HUD/AchievementToast';

export function useAchievements(totalBytesFreed: number) {
  const [earned, setEarned] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newlyEarned: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (totalBytesFreed >= achievement.threshold && !earned.has(achievement.id)) {
        newlyEarned.push(achievement);
      }
    }

    if (newlyEarned.length === 0) return;

    // Queue multiple achievements with 2-second spacing
    newlyEarned.forEach((achievement, index) => {
      setTimeout(() => {
        toast.custom(
          (t) =>
            createElement(AchievementToast, {
              achievement: achievement,
              visible: t.visible,
            }),
          {
            duration: 4000,
            position: 'top-center',
          }
        );
      }, index * 2000);
    });

    // Update earned set
    setEarned((prev) => {
      const next = new Set(prev);
      newlyEarned.forEach((achievement) => next.add(achievement.id));
      return next;
    });
  }, [totalBytesFreed, earned]);

  return { earned };
}
