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

  // Pre-allocate reusable Box3 objects to avoid GC pressure
  const tankBox = useMemo(() => new THREE.Box3(), []);
  const portalBox = useMemo(() => new THREE.Box3(), []);

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
    tankBox.setFromCenterAndSize(
      new THREE.Vector3(tankPos.x, tankPos.y, tankPos.z),
      new THREE.Vector3(1.2, 0.5, 1.8)
    );

    // Check collision with folder portals
    for (const portal of folderPortals) {
      const [x, y, z] = portal.position;

      // Portal archway dimensions (width ~ 2 * scale, height ~ 2.5 * scale, depth ~ 0.5)
      const archWidth = 2.0 * portal.scale;
      const archHeight = 2.5 * portal.scale;
      const archDepth = 0.5;

      // Compute portal bounding box
      portalBox.setFromCenterAndSize(
        new THREE.Vector3(x, y + archHeight / 2, z),
        new THREE.Vector3(archWidth, archHeight, archDepth)
      );

      // Check intersection
      if (tankBox.intersectsBox(portalBox)) {
        lastNavigationTime.current = currentTime;
        onEnterFolder(portal.path);
        return; // Exit early to prevent multiple triggers
      }
    }

    // Check collision with back portal (if exists)
    if (backPortalPosition) {
      const [x, y, z] = backPortalPosition;
      const scale = 0.8;
      const archWidth = 2.0 * scale;
      const archHeight = 2.5 * scale;
      const archDepth = 0.5;

      portalBox.setFromCenterAndSize(
        new THREE.Vector3(x, y + archHeight / 2, z),
        new THREE.Vector3(archWidth, archHeight, archDepth)
      );

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
