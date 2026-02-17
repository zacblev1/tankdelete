import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface PortalCollisionProps {
  tankRef: React.RefObject<THREE.Group | null>;
  folderPortals: Array<{ path: string; position: [number, number, number]; scale: number }>;
  backPortalPosition: [number, number, number] | null;
  onEnterFolder: (folderPath: string) => void;
  onEnterBackPortal: () => void;
}

export function PortalCollision({
  tankRef,
  folderPortals,
  backPortalPosition,
  onEnterFolder,
  onEnterBackPortal,
}: PortalCollisionProps) {
  const { clock } = useThree();
  const lastNavigationTime = useRef(0);

  // Pre-allocate reusable objects to avoid GC pressure
  const tankBox = useMemo(() => new THREE.Box3(), []);
  const portalBox = useMemo(() => new THREE.Box3(), []);
  const tempCenter = useMemo(() => new THREE.Vector3(), []);
  const tempSize = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!tankRef.current) return;

    // Check cooldown - prevent multiple triggers
    const currentTime = clock.elapsedTime;
    if (currentTime - lastNavigationTime.current < 1.0) {
      return;
    }

    // Get tank world position
    const tankPos = tankRef.current.position;

    // Compute tank bounding box (approximate as 1.2 x 0.5 x 1.8 centered on tank)
    tempCenter.set(tankPos.x, tankPos.y, tankPos.z);
    tempSize.set(1.2, 0.5, 1.8);
    tankBox.setFromCenterAndSize(tempCenter, tempSize);

    // Check collision with folder portals
    for (const portal of folderPortals) {
      const [x, , z] = portal.position;

      // Tight collision zone — must drive into the tunnel opening
      const collisionWidth = 1.2 * portal.scale;
      const collisionHeight = 2.0;
      const collisionDepth = 1.2;

      // Center collision box from ground level up
      tempCenter.set(x, collisionHeight / 2, z);
      tempSize.set(collisionWidth, collisionHeight, collisionDepth);
      portalBox.setFromCenterAndSize(tempCenter, tempSize);

      // Check intersection
      if (tankBox.intersectsBox(portalBox)) {
        lastNavigationTime.current = currentTime;
        onEnterFolder(portal.path);
        return; // Exit early to prevent multiple triggers
      }
    }

    // Check collision with back portal (if exists)
    if (backPortalPosition) {
      const [x, , z] = backPortalPosition;
      const collisionWidth = 1.2 * 0.8;
      const collisionHeight = 2.0;
      const collisionDepth = 1.2;

      tempCenter.set(x, collisionHeight / 2, z);
      tempSize.set(collisionWidth, collisionHeight, collisionDepth);
      portalBox.setFromCenterAndSize(tempCenter, tempSize);

      if (tankBox.intersectsBox(portalBox)) {
        lastNavigationTime.current = currentTime;
        onEnterBackPortal();
        return;
      }
    }
  });

  // Invisible collision checker - no visual rendering
  return null;
}
