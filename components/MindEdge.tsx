import React, { useLayoutEffect, useRef } from 'react';
import { NodeData } from '../types';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

interface MindEdgeProps {
  sourceNode: NodeData;
  targetNode: NodeData;
}

export const MindEdge: React.FC<MindEdgeProps> = ({ sourceNode, targetNode }) => {
  // Create a curve or straight line
  const points = [
    new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
    new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z),
  ];

  return (
    <Line
      points={points}
      color="#374151" // gray-700
      lineWidth={1}
      transparent
      opacity={0.6}
    />
  );
};
