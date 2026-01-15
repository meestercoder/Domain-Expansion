export interface NodeData {
  id: string;
  name: string;
  parentId: string | null;
  childrenIds: string[];
  level: number;
  collapsed: boolean;
  loading: boolean;
  position: { x: number; y: number; z: number };
}

export interface LinkData {
  id: string;
  source: string;
  target: string;
}

export interface TreeData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}
