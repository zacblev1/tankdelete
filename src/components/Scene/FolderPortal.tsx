import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FileEntry } from '../../lib/types';
import { formatBytes } from '../../lib/format';
import { PORTAL_COLOR } from '../../lib/colors';

interface FolderPortalProps {
  folder: FileEntry;
  position: [number, number, number];
  scale: number;
  childCount: number;
  totalSize: number;
  onHover: (data: any | null) => void;
}

export function FolderPortal({
  folder,
  position,
  scale,
  childCount,
  totalSize,
  onHover,
}: FolderPortalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Archway dimensions
  const archWidth = 2.0 * scale;
  const archHeight = 2.5 * scale;
  const pillarWidth = 0.15 * scale;
  const archRadius = archWidth / 2;
  const archThickness = 0.08 * scale;

  // Create pillar geometry
  const pillarGeometry = new THREE.BoxGeometry(pillarWidth, archHeight, pillarWidth);
  const pillarEdges = new THREE.EdgesGeometry(pillarGeometry, 15);

  // Create arch geometry (torus)
  const archGeometry = new THREE.TorusGeometry(archRadius, archThickness, 8, 32, Math.PI);
  const archEdges = new THREE.EdgesGeometry(archGeometry, 15);

  // Idle animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    // Subtle pulsing glow
    groupRef.current.children.forEach(child => {
      if (child instanceof THREE.LineSegments) {
        const material = child.material as THREE.LineBasicMaterial;
        material.opacity = 0.7 + Math.sin(time * 2) * 0.3;
      }
    });
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    onHover({ folder, childCount, totalSize });
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    onHover(null);
  };

  const emissiveIntensity = hovered ? 2.0 : 1.0;

  return (
    <group ref={groupRef} position={position}>
      {/* Left pillar */}
      <group position={[-archWidth / 2, archHeight / 2, 0]}>
        <lineSegments geometry={pillarEdges}>
          <lineBasicMaterial
            color={PORTAL_COLOR}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </lineSegments>
      </group>

      {/* Right pillar */}
      <group position={[archWidth / 2, archHeight / 2, 0]}>
        <lineSegments geometry={pillarEdges}>
          <lineBasicMaterial
            color={PORTAL_COLOR}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </lineSegments>
      </group>

      {/* Top arch */}
      <group position={[0, archHeight, 0]} rotation={[0, 0, 0]}>
        <lineSegments geometry={archEdges}>
          <lineBasicMaterial
            color={PORTAL_COLOR}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </lineSegments>
      </group>

      {/* Portal glow box (drive-through only - no click interaction) */}
      <mesh
        position={[0, archHeight / 2, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[archWidth, archHeight, pillarWidth * 4]} />
        <meshStandardMaterial
          color={PORTAL_COLOR}
          emissive={PORTAL_COLOR}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.05}
          toneMapped={false}
        />
      </mesh>

      {/* Folder name label */}
      <Text
        position={[0, archHeight + 0.5 * scale, 0]}
        fontSize={0.25 * scale}
        color={PORTAL_COLOR}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02 * scale}
        outlineColor="#000000"
      >
        {folder.name}
      </Text>

      {/* File count and size label */}
      <Text
        position={[0, archHeight + 0.2 * scale, 0]}
        fontSize={0.15 * scale}
        color="#00ffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01 * scale}
        outlineColor="#000000"
      >
        {childCount} items - {formatBytes(totalSize)}
      </Text>
    </group>
  );
}
