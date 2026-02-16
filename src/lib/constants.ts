// Gameplay tuning constants

// Tank movement
export const TANK_SPEED = 8; // units/second (instant movement per user decision)
export const TANK_ROTATION_SPEED = 2.5; // radians/second

// Projectile (for Plan 02)
export const PROJECTILE_SPEED = 25; // units/second
export const PROJECTILE_MAX_LIFETIME = 3.0; // seconds

// Camera
export const CAMERA_OFFSET = [0, 5, 8] as const; // [x, y, z] behind and above
export const CAMERA_LERP_SPEED = 6; // smoothing factor
export const CAMERA_LOOK_LERP_SPEED = 10; // look-at smoothing
export const TURRET_AIM_BLEND = 0.3; // camera shifts 30% toward turret aim direction
