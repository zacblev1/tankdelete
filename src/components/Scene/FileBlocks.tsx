import { useRef, useMemo, useEffect, useState, createRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BlockData } from '../../hooks/useFileBlocks';
import { CATEGORY_SHAPES } from '../../lib/geometries';
import { FileCategory } from '../../lib/colors';
import { formatBytes } from '../../lib/format';

interface InstancedCategoryBlocksProps {
  blocks: BlockData[];
  category: FileCategory;
  onHover: (block: BlockData | null) => void;
  meshRef?: React.RefObject<THREE.InstancedMesh | null>;
  markedFiles: Set<string>;
  deletingFiles: Set<string>;
  onDeletionComplete?: (filePath: string) => void;
}

function InstancedCategoryBlocks({ blocks, category, onHover, meshRef: externalMeshRef, markedFiles, deletingFiles, onDeletionComplete }: InstancedCategoryBlocksProps) {
  const internalMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const meshRef = externalMeshRef || internalMeshRef;
  const groupRef = useRef<THREE.Group>(null);
  const shapeConfig = CATEGORY_SHAPES[category];
  const categoryColor = blocks[0]?.color || '#ffffff';

  // Track deletion animation progress for each deleting file
  const deletionProgressRef = useRef<Map<string, number>>(new Map());
  const DEREZ_DURATION = 0.8; // seconds

  // Create base geometry based on shape config
  const geometry = useMemo(() => {
    if (shapeConfig.type === 'box') {
      return new THREE.BoxGeometry(...(shapeConfig.args as [number, number, number]));
    } else if (shapeConfig.type === 'octahedron') {
      return new THREE.OctahedronGeometry(...(shapeConfig.args as [number, number]));
    }
    return new THREE.BoxGeometry(1, 1, 1);
  }, [shapeConfig]);

  // Create merged wireframe geometry for all blocks in this category
  const mergedWireframe = useMemo(() => {
    const edgeGeometries: THREE.EdgesGeometry[] = [];

    for (const block of blocks) {
      const edgesGeometry = new THREE.EdgesGeometry(geometry, 15);
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(...block.position),
        new THREE.Quaternion(),
        new THREE.Vector3(block.scale, block.scale, block.scale)
      );
      edgesGeometry.applyMatrix4(matrix);
      edgeGeometries.push(edgesGeometry);
    }

    if (edgeGeometries.length === 0) return null;
    const merged = mergeGeometries(edgeGeometries);

    // Clean up individual geometries
    edgeGeometries.forEach(g => g.dispose());

    return merged;
  }, [blocks, geometry]);

  // Pre-allocated objects for frame updates
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);

  // Setup instance matrices
  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      tempPosition.set(...block.position);
      tempScale.set(block.scale, block.scale, block.scale);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [blocks, tempMatrix, tempPosition, tempQuaternion, tempScale]);

  // Animate: gentle bob, pulsing glow, mark visuals, de-rez animation
  useFrame(({ clock }, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    const time = clock.getElapsedTime();

    // Update deletion progress for deleting files
    for (const block of blocks) {
      if (deletingFiles.has(block.path)) {
        const currentProgress = deletionProgressRef.current.get(block.path) || 0;
        const newProgress = currentProgress + delta / DEREZ_DURATION;

        if (newProgress >= 1.0) {
          // Animation complete
          deletionProgressRef.current.delete(block.path);
          if (onDeletionComplete) {
            onDeletionComplete(block.path);
          }
        } else {
          deletionProgressRef.current.set(block.path, newProgress);
        }
      }
    }

    // Update instance matrices with bob animation, mark visuals, and de-rez
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const isDeleting = deletingFiles.has(block.path);
      const deletionProgress = deletionProgressRef.current.get(block.path) || 0;

      // Bob animation (unless deleting)
      const bobOffset = isDeleting ? 0 : Math.sin(time * 1.5 + block.position[0] * 0.5) * 0.08;

      // De-rez animation: shrink and sink
      let scale = block.scale;
      let yOffset = bobOffset;
      if (isDeleting) {
        scale = block.scale * (1 - deletionProgress);
        yOffset = -deletionProgress * 2; // Sink into ground
      }

      tempPosition.set(block.position[0], block.position[1] + yOffset, block.position[2]);
      tempScale.set(scale, scale, scale);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Pulsing glow on material (stronger pulse for marked files)
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (material) {
      // Check if any blocks in this category are marked
      const hasMarked = blocks.some(b => markedFiles.has(b.path));
      if (hasMarked) {
        material.emissiveIntensity = 1.5 + Math.sin(time * 4) * 0.8; // Stronger, faster pulse
      } else {
        material.emissiveIntensity = 1.0 + Math.sin(time * 2) * 0.3;
      }
    }

    // Bob the wireframe group in sync
    const categoryBobOffset = Math.sin(time * 1.5 + category.charCodeAt(0)) * 0.08;
    groupRef.current.position.y = categoryBobOffset;
  });

  // Hover detection
  const handlePointerOver = (event: any) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    if (instanceId !== undefined && blocks[instanceId]) {
      onHover(blocks[instanceId]);
    }
  };

  const handlePointerOut = (event: any) => {
    event.stopPropagation();
    onHover(null);
  };

  return (
    <>
      {/* Instanced mesh for transparent faces */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, blocks.length]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color={categoryColor}
          emissive={categoryColor}
          emissiveIntensity={1.0}
          transparent
          opacity={0.15}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Merged wireframe edges */}
      {mergedWireframe && (
        <group ref={groupRef}>
          <lineSegments geometry={mergedWireframe}>
            <lineBasicMaterial color={categoryColor} toneMapped={false} />
          </lineSegments>
        </group>
      )}

      {/* Marked file overlays - pulsing red-orange glow */}
      {blocks.filter(block => markedFiles.has(block.path)).map((block) => (
        <mesh key={`marked-${block.path}`} position={block.position}>
          {shapeConfig.type === 'box' ? (
            <boxGeometry args={[block.scale * 1.1, block.scale * 1.1, block.scale * 1.1]} />
          ) : (
            <octahedronGeometry args={[block.scale * 0.6, 1]} />
          )}
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff4400"
            emissiveIntensity={2.0}
            transparent
            opacity={0.3}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Floating filename labels */}
      {blocks.map((block) => (
        <Text
          key={block.path}
          position={[block.position[0], block.position[1] + block.scale + 0.5, block.position[2]]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.2}
          color={block.color}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {block.name}
        </Text>
      ))}
    </>
  );
}

interface FileBlocksProps {
  blocks: Map<FileCategory, BlockData[]>;
  onHover: (block: BlockData | null) => void;
  onMeshRefsReady?: (refs: React.RefObject<THREE.InstancedMesh | null>[]) => void;
  markedFiles?: Set<string>;
  deletingFiles?: Set<string>;
  onDeletionComplete?: (filePath: string) => void;
}

export function FileBlocks({ blocks, onHover, onMeshRefsReady, markedFiles = new Set(), deletingFiles = new Set(), onDeletionComplete }: FileBlocksProps) {
  const [hoveredBlock, setHoveredBlock] = useState<BlockData | null>(null);

  // Collect mesh refs for hit detection
  const meshRefs = useRef<Map<FileCategory, React.RefObject<THREE.InstancedMesh | null>>>(new Map());

  // Report mesh refs when they're ready
  useEffect(() => {
    if (onMeshRefsReady && meshRefs.current.size > 0) {
      const refs = Array.from(meshRefs.current.values());
      onMeshRefsReady(refs);
    }
  }, [onMeshRefsReady, blocks]);

  const handleHover = (block: BlockData | null) => {
    setHoveredBlock(block);
    onHover(block);
  };

  return (
    <>
      {/* Render instanced blocks per category */}
      {Array.from(blocks.entries()).map(([category, categoryBlocks]) => {
        // Create or get ref for this category
        if (!meshRefs.current.has(category)) {
          meshRefs.current.set(category, createRef<THREE.InstancedMesh>());
        }
        const categoryMeshRef = meshRefs.current.get(category)!;

        return (
          <InstancedCategoryBlocks
            key={category}
            blocks={categoryBlocks}
            category={category}
            onHover={handleHover}
            meshRef={categoryMeshRef}
            markedFiles={markedFiles}
            deletingFiles={deletingFiles}
            onDeletionComplete={onDeletionComplete}
          />
        );
      })}

      {/* Hover tooltip */}
      {hoveredBlock && (
        <Html
          position={[
            hoveredBlock.position[0],
            hoveredBlock.position[1] + hoveredBlock.scale + 1.0,
            hoveredBlock.position[2],
          ]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(5, 5, 16, 0.95)',
              border: '2px solid #00ffff',
              borderRadius: '4px',
              padding: '8px 12px',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{hoveredBlock.name}</div>
            <div>{formatBytes(hoveredBlock.size)}</div>
          </div>
        </Html>
      )}
    </>
  );
}
