import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Projectile } from '../../hooks/useProjectilePool';
import { PROJECTILE_SPEED, PROJECTILE_MAX_LIFETIME } from '../../lib/constants';
import { BlockData } from '../../hooks/useFileBlocks';

interface ProjectileManagerProps {
  pool: React.RefObject<Projectile[]>;
  despawn: (index: number) => void;
  onHit: (filePath: string) => void;
  fileBlockRefs: React.RefObject<THREE.InstancedMesh | null>[];
  allBlocks: BlockData[];
}

export function ProjectileManager({
  pool,
  despawn,
  onHit,
  fileBlockRefs,
  allBlocks,
}: ProjectileManagerProps) {
  // Pre-allocate raycaster and temp vectors
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);

  // Shared geometry for all projectile spheres
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.12, 8, 8), []);

  useFrame((_state, delta) => {
    if (!pool.current) return;

    for (let i = 0; i < pool.current.length; i++) {
      const projectile = pool.current[i];
      if (!projectile.active) continue;

      // Move projectile
      projectile.position.addScaledVector(projectile.direction, PROJECTILE_SPEED * delta);
      projectile.lifetime += delta;

      // Despawn if too old
      if (projectile.lifetime > PROJECTILE_MAX_LIFETIME) {
        despawn(i);
        continue;
      }

      // Hit detection via raycasting
      raycaster.set(projectile.position, projectile.direction);

      // Check intersections against all instanced meshes
      const validMeshes = fileBlockRefs
        .map(ref => ref.current)
        .filter((mesh): mesh is THREE.InstancedMesh => mesh !== null);

      const intersections = raycaster.intersectObjects(validMeshes, false);

      if (intersections.length > 0) {
        const hit = intersections[0];

        // Find the corresponding block by position proximity
        // This works because instanced meshes report hit.point in world coordinates
        let hitBlock: BlockData | null = null;
        let minDist = Infinity;

        for (const block of allBlocks) {
          const dist = tempPosition.set(...block.position).distanceTo(hit.point);
          if (dist < minDist && dist < 2.0) {
            minDist = dist;
            hitBlock = block;
          }
        }

        if (hitBlock) {
          onHit(hitBlock.path);
          despawn(i);
        }
      }
    }
  });

  // Render active projectiles
  return (
    <group>
      {pool.current?.map((projectile, index) => {
        if (!projectile.active) return null;

        return (
          <mesh
            key={index}
            position={projectile.position}
            geometry={sphereGeometry}
            dispose={null}
          >
            <meshBasicMaterial color="#00ffff" toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}
