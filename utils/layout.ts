import * as d3 from 'd3-hierarchy';
import { NodeData, LinkData } from '../types';

// Convert our flat node list into a D3 hierarchy, run layout, and flatten back with coords
export const computeLayout = (nodes: NodeData[], rootId: string) => {
  if (nodes.length === 0) return { nodes: [], links: [] };

  // 1. Create a map for easy lookup
  const nodeMap = new Map<string, any>();
  nodes.forEach(n => nodeMap.set(n.id, { ...n, children: [] }));

  // 2. Build hierarchy structure
  let rootNode = null;
  nodeMap.forEach(n => {
    if (n.id === rootId) {
      rootNode = n;
    }
    if (n.parentId && nodeMap.has(n.parentId)) {
      nodeMap.get(n.parentId).children.push(n);
    }
  });

  if (!rootNode) return { nodes, links: [] };

  const hierarchy = d3.hierarchy(rootNode);

  // 3. Configure layout
  // Using a cluster layout for radial visualization
  // Separation allows space between nodes at the same depth
  const layout = d3.tree()
    .size([2 * Math.PI, 1]) // Angle (radians), Radius (normalized)
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

  const root = layout(hierarchy);

  // 4. Map back to 3D coordinates
  // Start radius at 0, increase by fixed amount per level
  const LEVEL_DISTANCE = 15; 
  
  const updatedNodes: NodeData[] = [];
  const links: LinkData[] = [];

  root.descendants().forEach((d: any) => {
    // Radial conversion
    // x is angle, y is depth (0 to 1 based on normalization, but d.depth is integer levels)
    // We use d.depth manually to control spacing
    const angle = d.x;
    const radius = d.depth * LEVEL_DISTANCE;

    // Convert polar to cartesian (X, Z plane)
    // Rotate slightly so root isn't awkward if needed, but standard is fine
    const x = radius * Math.cos(angle - Math.PI / 2); // -PI/2 to start at top
    const z = radius * Math.sin(angle - Math.PI / 2);

    // Keep the original node object's properties but update position
    // We find the original node in the input array to preserve other state like loading/collapsed
    const original = nodes.find(n => n.id === d.data.id);
    if (original) {
      updatedNodes.push({
        ...original,
        position: { x, y: 0, z }, // Y is up-down in 3JS, we map to flat plane (y=0)
      });
    }

    if (d.parent) {
      links.push({
        id: `${d.parent.data.id}-${d.data.id}`,
        source: d.parent.data.id,
        target: d.data.id
      });
    }
  });

  return { nodes: updatedNodes, links };
};
