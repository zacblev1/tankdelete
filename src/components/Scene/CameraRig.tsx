import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CAMERA_OFFSET,
  CAMERA_LERP_SPEED,
  CAMERA_LOOK_LERP_SPEED,
  TURRET_AIM_BLEND,
} from '../../lib/constants';

interface CameraRigProps {
  tankRef: React.RefObject<THREE.Group | null>;
}

export function CameraRig({ tankRef }: CameraRigProps) {
  const { camera } = useThree();

  // Pre-allocate objects to avoid GC
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(...CAMERA_OFFSET), []);
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);
  const turretDirection = useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    if (!tankRef.current) return;

    const tank = tankRef.current;

    // Compute desired camera position: offset behind and above tank
    desiredPosition.copy(offset);
    desiredPosition.applyQuaternion(tank.quaternion);
    desiredPosition.add(tank.position);

    // Smoothly lerp camera position
    camera.position.lerp(desiredPosition, CAMERA_LERP_SPEED * delta);

    // Compute look-at target: blend between tank position and turret aim direction
    // Get turret's world forward direction
    const turret = tank.children.find((child) => child.type === 'Group' && child.children.length > 1);
    if (turret) {
      turretDirection.set(0, 0, -1);
      turretDirection.applyQuaternion(turret.quaternion);
      turretDirection.applyQuaternion(tank.quaternion);
      turretDirection.normalize();

      // Blend: 70% tank position, 30% along turret aim direction
      lookAtTarget.copy(tank.position);
      lookAtTarget.addScaledVector(turretDirection, TURRET_AIM_BLEND * 10);
    } else {
      // Fallback: just look at tank
      lookAtTarget.copy(tank.position);
    }

    // Smoothly lerp look-at
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10);
    currentLookAt.add(camera.position);

    currentLookAt.lerp(lookAtTarget, CAMERA_LOOK_LERP_SPEED * delta);
    camera.lookAt(currentLookAt);
  });

  return null;
}
