import { useRef, useEffect } from 'react';

interface MinimapProps {
  tankPosition: [number, number, number];
  tankRotation: number; // Y rotation in radians
  fileBlocks: Array<{ position: [number, number, number]; color: string; isMarked?: boolean }>;
  folderPortals: Array<{ position: [number, number, number] }>;
  backPortalPosition: [number, number, number] | null;
}

export function Minimap({
  tankPosition,
  tankRotation,
  fileBlocks,
  folderPortals,
  backPortalPosition,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDrawnPosition = useRef({ x: 0, y: 0, z: 0, rotation: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CANVAS_SIZE = 160;
    const RADAR_RADIUS = 70; // pixels on canvas
    const WORLD_RADIUS = 30; // units in 3D world space
    const SCALE = RADAR_RADIUS / WORLD_RADIUS;

    // Function to check if position changed enough to warrant redraw
    function hasPositionChanged(): boolean {
      const threshold = 0.1; // Small threshold to avoid excessive redraws
      const rotationThreshold = 0.05;

      return (
        Math.abs(tankPosition[0] - lastDrawnPosition.current.x) > threshold ||
        Math.abs(tankPosition[2] - lastDrawnPosition.current.z) > threshold ||
        Math.abs(tankRotation - lastDrawnPosition.current.rotation) > rotationThreshold
      );
    }

    // Draw the minimap
    function draw() {
      if (!ctx || !canvas) return;

      // Update last drawn position
      lastDrawnPosition.current = {
        x: tankPosition[0],
        y: tankPosition[1],
        z: tankPosition[2],
        rotation: tankRotation,
      };

      const centerX = CANVAS_SIZE / 2;
      const centerY = CANVAS_SIZE / 2;

      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw dark circular background
      ctx.fillStyle = 'rgba(5, 5, 16, 0.85)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, RADAR_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Draw faint concentric ring guides
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const radius = (RADAR_RADIUS / 3) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw rotating sweep line (classic radar effect)
      const time = Date.now() / 1000;
      const sweepAngle = (time * 2) % (Math.PI * 2);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sweepAngle);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -RADAR_RADIUS);
      ctx.stroke();
      ctx.restore();

      // Helper function to rotate point relative to tank
      function rotateAndScale(worldX: number, worldZ: number): { x: number; y: number } | null {
        // Calculate relative position from tank
        const relX = worldX - tankPosition[0];
        const relZ = worldZ - tankPosition[2];

        // Check if within radar range
        const distance = Math.sqrt(relX * relX + relZ * relZ);
        if (distance > WORLD_RADIUS) return null;

        // Rotate by negative tank rotation (so forward is always up on minimap)
        const cos = Math.cos(-tankRotation);
        const sin = Math.sin(-tankRotation);
        const rotX = relX * cos - relZ * sin;
        const rotZ = relX * sin + relZ * cos;

        // Scale to canvas coordinates (note: Z maps to Y in 2D)
        return {
          x: centerX + rotX * SCALE,
          y: centerY + rotZ * SCALE,
        };
      }

      // Draw file blocks as colored dots
      for (const block of fileBlocks) {
        const pos = rotateAndScale(block.position[0], block.position[2]);
        if (!pos) continue;

        ctx.fillStyle = block.isMarked ? '#ff3366' : block.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw folder portals as magenta squares
      for (const portal of folderPortals) {
        const pos = rotateAndScale(portal.position[0], portal.position[2]);
        if (!pos) continue;

        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
      }

      // Draw back portal as green triangle
      if (backPortalPosition) {
        const pos = rotateAndScale(backPortalPosition[0], backPortalPosition[2]);
        if (pos) {
          ctx.fillStyle = '#00ff66';
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y - 4);
          ctx.lineTo(pos.x - 3, pos.y + 2);
          ctx.lineTo(pos.x + 3, pos.y + 2);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw player at center as bright cyan triangle pointing up
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 6);
      ctx.lineTo(centerX - 4, centerY + 3);
      ctx.lineTo(centerX + 4, centerY + 3);
      ctx.closePath();
      ctx.fill();

      // Draw cyan border around canvas
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, RADAR_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Animation loop for smooth sweep line
    function animate() {
      if (hasPositionChanged()) {
        draw();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Start animation
    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [tankPosition, tankRotation, fileBlocks, folderPortals, backPortalPosition]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={160}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 50,
        borderRadius: '50%',
        border: '2px solid #00ffff',
        background: 'rgba(5, 5, 16, 0.85)',
      }}
    />
  );
}
