import { useRef, useMemo, forwardRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { TANK_SPEED, TANK_ROTATION_SPEED } from '../../lib/constants';

// Controls enum
export enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
}

interface TankProps {
  onShoot?: (position: THREE.Vector3, direction: THREE.Vector3) => void;
  initialPosition?: [number, number, number];
  tankStateRef?: React.RefObject<{ position: [number, number, number]; rotation: number }>;
}

export const Tank = forwardRef<THREE.Group, TankProps>(({ onShoot, initialPosition = [0, 0, 0], tankStateRef }, tankRef) => {
  const turretRef = useRef<THREE.Group>(null);
  const { camera, pointer } = useThree();

  // Pre-allocate reusable objects to avoid GC pressure
  const direction = useMemo(() => new THREE.Vector3(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);
  const tempWorldPos = useMemo(() => new THREE.Vector3(), []);
  const tempWorldDir = useMemo(() => new THREE.Vector3(), []);

  // Get keyboard controls (use transient reads with get() to avoid re-renders)
  const [, get] = useKeyboardControls<Controls>();

  // Reset tank position when initialPosition changes (directory navigation)
  useEffect(() => {
    if (tankRef && 'current' in tankRef && tankRef.current) {
      tankRef.current.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
      tankRef.current.rotation.y = Math.PI; // Face toward files (+Z direction)
    }
  }, [initialPosition, tankRef]);

  // Mouse click handler for shooting
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      // Only fire on left click (button 0)
      if (event.button !== 0) return;
      if (!tankRef || !('current' in tankRef) || !tankRef.current || !turretRef.current) return;
      if (!onShoot) return;

      // Get turret world position and direction
      turretRef.current.getWorldPosition(tempWorldPos);
      turretRef.current.getWorldDirection(tempWorldDir);

      // getWorldDirection returns -Z axis direction, but tank body is rotated PI
      // so we negate to get the actual barrel-forward direction in world space
      tempWorldDir.negate();

      // Spawn position: slightly in front of barrel tip
      const spawnPosition = tempWorldPos.clone().addScaledVector(tempWorldDir, 0.8);

      // Fire projectile in barrel direction
      onShoot(spawnPosition, tempWorldDir.clone());
    }

    // Use capture phase to ensure we receive the event before R3F Canvas
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [tankRef, onShoot, tempWorldPos, tempWorldDir]);

  useFrame((_state, delta) => {
    if (!tankRef || !('current' in tankRef) || !tankRef.current || !turretRef.current) return;

    const tank = tankRef.current;
    const controls = get();

    // Update tank state ref for minimap (if provided)
    if (tankStateRef?.current) {
      tankStateRef.current.position = [tank.position.x, tank.position.y, tank.position.z];
      tankStateRef.current.rotation = tank.rotation.y;
    }

    // Tank body rotation (A/D keys)
    if (controls.left) {
      tank.rotation.y += TANK_ROTATION_SPEED * delta;
    }
    if (controls.right) {
      tank.rotation.y -= TANK_ROTATION_SPEED * delta;
    }

    // Tank body movement (W/S keys)
    const moveAmount = TANK_SPEED * delta;
    if (controls.forward || controls.backward) {
      // Get forward direction based on tank body rotation
      direction.set(0, 0, -1);
      direction.applyQuaternion(tank.quaternion);
      direction.normalize();

      if (controls.forward) {
        tank.position.addScaledVector(direction, moveAmount);
      }
      if (controls.backward) {
        tank.position.addScaledVector(direction, -moveAmount);
      }
    }

    // Turret aiming with mouse
    // Cast ray from camera through pointer position to find ground intersection
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(groundPlane, intersection);

    if (intersection) {
      // Convert world position to tank local space
      const localTarget = tank.worldToLocal(intersection.clone());

      // Make turret look at the local target (only Y-axis rotation)
      // Barrel points along turret's local -Z axis
      // To aim -Z toward (x, z): angle = atan2(-x, -z)
      const angle = Math.atan2(-localTarget.x, -localTarget.z);
      turretRef.current.rotation.y = angle;
    }
  });

  return (
    <group ref={tankRef} position={[0, 0.2, 0]}>
      {/* Tank body */}
      <group>
        {/* Main chassis - wireframe edges */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.2, 0.4, 1.8)]} />
          <lineBasicMaterial color="#00ffff" toneMapped={false} />
        </lineSegments>

        {/* Main chassis - transparent face fill */}
        <mesh>
          <boxGeometry args={[1.2, 0.4, 1.8]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.1}
          />
        </mesh>

        {/* Left tread */}
        <group position={[-0.6, 0, 0]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(0.15, 0.3, 1.6)]} />
            <lineBasicMaterial color="#00ffff" toneMapped={false} />
          </lineSegments>
          <mesh>
            <boxGeometry args={[0.15, 0.3, 1.6]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.1}
            />
          </mesh>
        </group>

        {/* Right tread */}
        <group position={[0.6, 0, 0]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(0.15, 0.3, 1.6)]} />
            <lineBasicMaterial color="#00ffff" toneMapped={false} />
          </lineSegments>
          <mesh>
            <boxGeometry args={[0.15, 0.3, 1.6]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.1}
            />
          </mesh>
        </group>
      </group>

      {/* Turret */}
      <group ref={turretRef} position={[0, 0.4, 0]}>
        {/* Turret base - octagonal cylinder */}
        <group>
          <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8)]} />
            <lineBasicMaterial color="#00ffff" toneMapped={false} />
          </lineSegments>
          <mesh>
            <cylinderGeometry args={[0.35, 0.35, 0.25, 8]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.1}
            />
          </mesh>
        </group>

        {/* Barrel */}
        <group position={[0, 0, -0.5]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(0.08, 0.08, 1.0)]} />
            <lineBasicMaterial color="#00ffff" toneMapped={false} />
          </lineSegments>
          <mesh>
            <boxGeometry args={[0.08, 0.08, 1.0]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.1}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
});

Tank.displayName = 'Tank';
