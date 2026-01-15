import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { animated, useSpring, config } from '@react-spring/three';
import * as THREE from 'three';
import { NodeData } from '../types';

interface MindNodeProps {
  node: NodeData;
  onClick: (id: string) => void;
  isRoot: boolean;
}

export const MindNode: React.FC<MindNodeProps> = ({ node, onClick, isRoot }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Animate position
  const { position, scale, color } = useSpring({
    position: [node.position.x, node.position.y, node.position.z],
    scale: hovered ? 1.2 : 1,
    color: isRoot ? '#ef4444' : (node.loading ? '#fbbf24' : '#60a5fa'),
    config: config.wobbly,
  });

  // Pulse animation for loading state
  useFrame((state) => {
    if (node.loading && meshRef.current) {
      const t = state.clock.getElapsedTime();
      const s = 1 + Math.sin(t * 10) * 0.1;
      meshRef.current.scale.set(s, s, s);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick(node.id);
  };

  return (
    <animated.group position={position as any}>
      {/* Node Geometry */}
      <animated.mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        scale={scale}
      >
        <sphereGeometry args={[isRoot ? 2 : 1.2, 32, 32]} />
        <animated.meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </animated.mesh>

      {/* Label - Facing Camera */}
      <Text
        position={[0, isRoot ? 3 : 2.2, 0]}
        fontSize={isRoot ? 1 : 0.6}
        maxWidth={isRoot ? 10 : 4}
        textAlign="center"
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {node.name}
      </Text>

    </animated.group>
  );
};