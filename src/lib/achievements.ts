export interface Achievement {
  id: string;
  name: string;
  threshold: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'derezzer',
    name: 'Derezzer',
    threshold: 100 * 1024 * 1024, // 100MB
  },
  {
    id: 'grid-cleaner',
    name: 'Grid Cleaner',
    threshold: 1024 * 1024 * 1024, // 1GB
  },
  {
    id: 'system-purge',
    name: 'System Purge',
    threshold: 10 * 1024 * 1024 * 1024, // 10GB
  },
];
