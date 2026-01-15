import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, Stars, Environment, PerspectiveCamera } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { MindNode } from './components/MindNode';
import { MindEdge } from './components/MindEdge';
import { fetchSubTopics } from './services/gemini';
import { computeLayout } from './utils/layout';
import { NodeData, LinkData } from './types';

// Initial Subject
const DEFAULT_SUBJECT = "Subjects";

function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // State for the exploration
  const [rootSubject, setRootSubject] = useState(DEFAULT_SUBJECT);
  const [inputValue, setInputValue] = useState(DEFAULT_SUBJECT);

  // Initialize tree with a subject
  const initializeTree = useCallback((subject: string) => {
    const rootNode: NodeData = {
      id: 'root',
      name: subject,
      parentId: null,
      childrenIds: [],
      level: 0,
      collapsed: false,
      loading: false,
      position: { x: 0, y: 0, z: 0 }
    };
    
    const { nodes: layoutNodes, links: layoutLinks } = computeLayout([rootNode], 'root');
    setNodes(layoutNodes);
    setLinks(layoutLinks);
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    initializeTree(DEFAULT_SUBJECT);
  }, [initializeTree]);

  const handleExplore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setRootSubject(inputValue);
    initializeTree(inputValue);
  };

  const handleNodeClick = useCallback(async (nodeId: string) => {
    // Find node
    const nodeIndex = nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;
    const node = nodes[nodeIndex];

    // If already has children, prevent re-fetching
    if (node.childrenIds.length > 0) {
      return; 
    }

    // Set loading
    const updatedNodes = [...nodes];
    updatedNodes[nodeIndex] = { ...node, loading: true };
    setNodes(updatedNodes);
    setError(null);

    try {
      // 1. Fetch data
      const subTopics = await fetchSubTopics(node.name);
      
      if (subTopics.length === 0) {
         throw new Error("No topics returned");
      }

      // 2. Create new node objects
      const newNodes: NodeData[] = subTopics.map(topic => ({
        id: uuidv4(),
        name: topic,
        parentId: nodeId,
        childrenIds: [],
        level: node.level + 1,
        collapsed: false,
        loading: false,
        position: { ...node.position } // Start at parent position for animation
      }));

      // 3. Update parent node
      const parentNode = { 
        ...node, 
        loading: false, 
        childrenIds: newNodes.map(n => n.id) 
      };

      // 4. Merge and Layout
      const allNodesRaw = [
        ...nodes.filter(n => n.id !== nodeId), // Remove old parent
        parentNode,
        ...newNodes
      ];

      const { nodes: finalNodes, links: finalLinks } = computeLayout(allNodesRaw, 'root');
      
      setNodes(finalNodes);
      setLinks(finalLinks);

    } catch (err: any) {
      console.error(err);
      setError("Failed to expand knowledge tree. Try again.");
      // Reset loading
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, loading: false } : n));
    }
  }, [nodes]);

  return (
    <div className="w-full h-full bg-black relative">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none w-full flex justify-between items-start">
        {/* Left Panel: Controls */}
        <div className="pointer-events-auto flex flex-col gap-4 max-w-md w-full">
            <div>
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tighter shadow-black drop-shadow-lg">
                    Infinite <span className="text-blue-500">Knowledge</span>
                </h1>
                
                <form onSubmit={handleExplore} className="flex gap-2 w-full shadow-lg">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 bg-gray-900/90 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                        placeholder="Enter any subject..."
                    />
                    <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 whitespace-nowrap"
                    >
                        Start
                    </button>
                </form>
            </div>

            <div className="text-gray-400 text-sm backdrop-blur-md bg-black/60 p-4 rounded-xl border border-gray-800 shadow-xl">
                <p className="mb-2">
                    <span className="text-blue-400 font-semibold">Root Topic:</span> {rootSubject}
                </p>
                <p className="leading-relaxed opacity-80">
                    Click nodes to expand using Generative AI. <br/>
                    <span className="text-xs text-gray-500">Drag to pan • Scroll to zoom • Right-click to rotate</span>
                </p>
            </div>

            {error && (
                <div className="p-3 bg-red-900/80 border border-red-500 text-red-100 rounded-lg text-sm animate-pulse">
                    {error}
                </div>
            )}
        </div>
        
        {/* Right Panel: Info */}
        <div className="pointer-events-auto">
            <div className="text-right text-xs text-gray-600 bg-black/40 p-2 rounded backdrop-blur-sm border border-gray-900">
                Powered by Gemini 2.0 Flash
            </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas className="w-full h-full" dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 40, 40]} fov={50} />
        
        {/* Lighting & Environment */}
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 20, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -20, -10]} intensity={0.5} color="#4f46e5" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="city" />

        {/* Content */}
        <group>
            {links.map(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (!source || !target) return null;
                return <MindEdge key={link.id} sourceNode={source} targetNode={target} />;
            })}
            
            {nodes.map(node => (
                <MindNode 
                    key={node.id} 
                    node={node} 
                    onClick={handleNodeClick}
                    isRoot={node.id === 'root'}
                />
            ))}
        </group>

        {/* Controls */}
        <MapControls 
            enableDamping 
            dampingFactor={0.05} 
            minDistance={10} 
            maxDistance={200} 
            maxPolarAngle={Math.PI / 2.1} // Prevent going under the floor
        />
        
        {/* Simple grid floor for orientation */}
        <gridHelper args={[500, 50, 0x222222, 0x111111]} position={[0, -2, 0]} />
        
      </Canvas>
    </div>
  );
}

export default App;