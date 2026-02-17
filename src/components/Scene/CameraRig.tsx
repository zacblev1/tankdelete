import { useMemo, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CAMERA_OFFSET,
  CAMERA_LERP_SPEED,
} from '../../lib/constants';

interface CameraRigProps {
  tankRef: React.RefObject<THREE.Group | null>;
}

// How far the mouse can orbit the camera (radians)
const MAX_YAW = Math.PI * 0.4;   // ~72° left/right
const MAX_PITCH = Math.PI * 0.25; // ~45° up/down
const PITCH_MIN = -0.1;           // slight look-down limit

export function CameraRig({ tankRef }: CameraRigProps) {
  const { camera } = useThree();

  // Pre-allocate objects to avoid GC
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const baseOffset = useMemo(() => new THREE.Vector3(...CAMERA_OFFSET), []);
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);
  const rotatedOffset = useMemo(() => new THREE.Vector3(), []);

  // Mouse orbit state — right-click drag to look around
  const orbitYaw = useRef(0);   // horizontal orbit offset
  const orbitPitch = useRef(0); // vertical orbit offset
  const isDragging = useRef(false);

  useEffect(() => {
    function handleContextMenu(e: Event) {
      e.preventDefault(); // prevent right-click menu
    }

    function handlePointerDown(e: PointerEvent) {
      if (e.button === 2) { // right click
        isDragging.current = true;
      }
    }

    function handlePointerUp(e: PointerEvent) {
      if (e.button === 2) {
        isDragging.current = false;
      }
    }

    function handlePointerMove(e: PointerEvent) {
      if (!isDragging.current) return;

      const sensitivity = 0.003;
      orbitYaw.current = Math.max(-MAX_YAW, Math.min(MAX_YAW,
        orbitYaw.current - e.movementX * sensitivity
      ));
      orbitPitch.current = Math.max(PITCH_MIN, Math.min(MAX_PITCH,
        orbitPitch.current - e.movementY * sensitivity
      ));
    }

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointermove', handlePointerMove);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  useFrame((_state, delta) => {
    if (!tankRef.current) return;

    const tank = tankRef.current;

    // Smoothly return orbit to center when not dragging
    if (!isDragging.current) {
      orbitYaw.current *= 0.92;
      orbitPitch.current *= 0.92;
    }

    // Apply yaw and pitch to camera offset
    rotatedOffset.copy(baseOffset);

    // Rotate offset around Y axis (yaw) relative to tank
    if (orbitYaw.current !== 0) {
      rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitYaw.current);
    }

    // Adjust height for pitch (raise/lower camera)
    rotatedOffset.y += Math.sin(orbitPitch.current) * baseOffset.length();

    // Compute desired camera position: rotated offset applied in tank-local space
    desiredPosition.copy(rotatedOffset);
    desiredPosition.applyQuaternion(tank.quaternion);
    desiredPosition.add(tank.position);

    // Smoothly lerp camera position
    camera.position.lerp(desiredPosition, CAMERA_LERP_SPEED * delta);

    // Look at a point ahead of the tank, shifted by orbit
    lookAtTarget.copy(tank.position);
    lookAtTarget.y += 1; // look slightly above tank center

    camera.lookAt(lookAtTarget);
  });

  return null;
}
