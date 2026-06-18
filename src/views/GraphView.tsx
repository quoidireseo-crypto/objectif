import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AppData, Goal, Task, JournalEntry, LifeDomain } from '../types';
import { 
  Network, ZoomIn, ZoomOut, Maximize2, 
  CheckCircle, Circle, X, Eye, EyeOff, Sparkles, BookHeart, Info
} from 'lucide-react';

interface GraphViewProps {
  data: AppData;
  onChangeView?: (view: any) => void;
  userProfile?: { name: string; ageGroup?: string; focusArea?: string } | null;
  isPreview?: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  fullTitle: string;
  type: 'goal' | 'milestone' | 'task' | 'journal';
  domain?: LifeDomain;
  isCompleted?: boolean;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  radius: number;
  color: string;
  date?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'goal-milestone' | 'goal-task' | 'milestone-task' | 'task-journal';
}

const DOMAIN_COLORS: Record<LifeDomain, string> = {
  'Santé & Bien-être': '#d97706',    // amber
  'Projet Personnel': '#57534e',     // stone
  'Relations & Famille': '#e11d48',  // rose
  'Apprentissage': '#2563eb',        // blue
  'Finances': '#059669',             // emerald
  'Spiritualité': '#7c3aed',         // violet
  'Autre': '#a8a29e',                // stone light
};

const EDGE_STYLES = {
  'goal-milestone': { stroke: '#86efac', strokeWidth: 2, defaultOpacity: 0.6 }, // emerald-300
  'goal-task': { stroke: '#d6d3d1', strokeWidth: 1.5, defaultOpacity: 0.5 },    // stone-300
  'milestone-task': { stroke: '#a7f3d0', strokeWidth: 1, opacity: 0.4 },        // emerald-200
  'task-journal': { stroke: '#c7d2fe', strokeWidth: 1, opacity: 0.4 },          // indigo-200
};

// Main Graph Data construction helper function
export function buildGraphData(data: AppData) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const truncate = (text: string, count: number) => {
    if (!text) return '';
    return text.length > count ? text.substring(0, count - 3) + '...' : text;
  };

  const getGoalDomain = (goalId: string): LifeDomain | undefined => {
    return data.goals.find(g => g.id === goalId)?.domain;
  };

  const getMilestoneGoalDomain = (milestoneId: string): LifeDomain | undefined => {
    const milestone = data.milestones.find(m => m.id === milestoneId);
    if (!milestone) return undefined;
    return getGoalDomain(milestone.goalId);
  };

  // 1. Add Goals
  data.goals.forEach(goal => {
    nodes.push({
      id: goal.id,
      label: truncate(goal.title, 30),
      fullTitle: goal.title,
      type: 'goal',
      domain: goal.domain,
      isCompleted: goal.status === 'Atteint',
      radius: 28,
      color: DOMAIN_COLORS[goal.domain] || '#a8a29e',
      x: 0,
      y: 0,
    });
  });

  // 2. Add Milestones
  data.milestones.forEach(milestone => {
    const domain = getGoalDomain(milestone.goalId);
    const color = domain ? DOMAIN_COLORS[domain] : '#a8a29e';
    nodes.push({
      id: milestone.id,
      label: truncate(milestone.title, 30),
      fullTitle: milestone.title,
      type: 'milestone',
      domain,
      isCompleted: milestone.isCompleted,
      radius: 18,
      color,
      x: 0,
      y: 0,
    });

    edges.push({
      source: milestone.goalId,
      target: milestone.id,
      type: 'goal-milestone',
    });
  });

  // 3. Add Tasks
  data.tasks.forEach(task => {
    let domain = task.domain;
    if (!domain && task.milestoneId) {
      domain = getMilestoneGoalDomain(task.milestoneId);
    }
    if (!domain && task.goalId) {
      domain = getGoalDomain(task.goalId);
    }
    const color = domain ? DOMAIN_COLORS[domain] : '#a8a29e';

    nodes.push({
      id: task.id,
      label: truncate(task.title, 30),
      fullTitle: task.title,
      type: 'task',
      domain,
      isCompleted: task.isCompleted,
      radius: 12,
      color,
      date: task.date,
      x: 0,
      y: 0,
    });

    if (task.goalId) {
      edges.push({
        source: task.goalId,
        target: task.id,
        type: 'goal-task',
      });
    }

    if (task.milestoneId) {
      edges.push({
        source: task.milestoneId,
        target: task.id,
        type: 'milestone-task',
      });
    }
  });

  // 4. Add Journals
  data.journal.forEach(entry => {
    const sameDayCompletedTasks = data.tasks.filter(t => t.isCompleted && t.date === entry.date);
    
    let domain: LifeDomain | undefined;
    if (sameDayCompletedTasks.length > 0) {
      const firstTask = sameDayCompletedTasks[0];
      if (firstTask.domain) {
        domain = firstTask.domain;
      } else if (firstTask.milestoneId) {
        domain = getMilestoneGoalDomain(firstTask.milestoneId);
      } else if (firstTask.goalId) {
        domain = getGoalDomain(firstTask.goalId);
      }
    }
    const color = domain ? DOMAIN_COLORS[domain] : '#6366f1'; // Indigo for standalones or same-day journals

    nodes.push({
      id: entry.id,
      label: truncate(entry.content, 30),
      fullTitle: entry.content || 'Entrée Journal',
      type: 'journal',
      domain,
      isCompleted: false,
      radius: 10,
      color,
      date: entry.date,
      x: 0,
      y: 0,
    });

    sameDayCompletedTasks.forEach(task => {
      edges.push({
        source: task.id,
        target: entry.id,
        type: 'task-journal',
      });
    });
  });

  return { nodes, edges };
}

// Helper to place nodes in circle rings centered around (0,0) before simulating
export function getInitialLayout(data: AppData, hideTasksAndJournal: boolean) {
  const { nodes: rawNodes, edges: rawEdges } = buildGraphData(data);

  // Apply view masks
  let filteredNodes = rawNodes;
  if (hideTasksAndJournal) {
    filteredNodes = rawNodes.filter(n => n.type === 'goal' || n.type === 'milestone');
  }

  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = rawEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  // Initialize coordinate maps and placements centered at (0,0)
  const goals = filteredNodes.filter(n => n.type === 'goal');
  goals.forEach((goal, i) => {
    const angle = goals.length > 1 ? (i / goals.length) * 2 * Math.PI : 0;
    goal.x = 200 * Math.cos(angle);
    goal.y = 200 * Math.sin(angle);
    goal.vx = 0;
    goal.vy = 0;
  });

  const coords = new Map<string, { x: number, y: number }>();
  goals.forEach(g => coords.set(g.id, { x: g.x, y: g.y }));

  // Placement of Milestones
  const milestones = filteredNodes.filter(n => n.type === 'milestone');
  const milestonesByGoal = new Map<string, typeof milestones>();
  milestones.forEach(m => {
    const rawM = data.milestones.find(rm => rm.id === m.id);
    if (rawM) {
      const list = milestonesByGoal.get(rawM.goalId) || [];
      list.push(m);
      milestonesByGoal.set(rawM.goalId, list);
    }
  });

  milestonesByGoal.forEach((list, goalId) => {
    const goalCoords = coords.get(goalId) || { x: 0, y: 0 };
    list.forEach((m, idx) => {
      const angle = (idx / Math.max(1, list.length)) * 2 * Math.PI;
      m.x = goalCoords.x + 120 * Math.cos(angle) + (Math.random() - 0.5) * 10;
      m.y = goalCoords.y + 120 * Math.sin(angle) + (Math.random() - 0.5) * 10;
      m.vx = 0;
      m.vy = 0;
      coords.set(m.id, { x: m.x, y: m.y });
    });
  });

  // Placement of Tasks
  const tasks = filteredNodes.filter(n => n.type === 'task');
  const tasksByParent = new Map<string, typeof tasks>();
  tasks.forEach(t => {
    const rawT = data.tasks.find(rt => rt.id === t.id);
    if (rawT) {
      const parentId = rawT.milestoneId || rawT.goalId;
      if (parentId) {
        const list = tasksByParent.get(parentId) || [];
        list.push(t);
        tasksByParent.set(parentId, list);
      } else {
        // No parent
        const angle = Math.random() * 2 * Math.PI;
        t.x = 250 * Math.cos(angle);
        t.y = 250 * Math.sin(angle);
        t.vx = 0;
        t.vy = 0;
        coords.set(t.id, { x: t.x, y: t.y });
      }
    }
  });

  tasksByParent.forEach((list, parentId) => {
    const parentCoords = coords.get(parentId) || { x: 0, y: 0 };
    list.forEach((t, idx) => {
      const angle = (idx / Math.max(1, list.length)) * 2 * Math.PI;
      t.x = parentCoords.x + 70 * Math.cos(angle) + (Math.random() - 0.5) * 5;
      t.y = parentCoords.y + 70 * Math.sin(angle) + (Math.random() - 0.5) * 5;
      t.vx = 0;
      t.vy = 0;
      coords.set(t.id, { x: t.x, y: t.y });
    });
  });

  // Placement of Journals
  const journals = filteredNodes.filter(n => n.type === 'journal');
  journals.forEach((j, idx) => {
    const connectedTaskEdge = filteredEdges.find(e => e.target === j.id && e.type === 'task-journal');
    if (connectedTaskEdge) {
      const taskCoords = coords.get(connectedTaskEdge.source) || { x: 0, y: 0 };
      const angle = (idx / Math.max(1, journals.length)) * 2 * Math.PI;
      j.x = taskCoords.x + 45 * Math.cos(angle) + (Math.random() - 0.5) * 5;
      j.y = taskCoords.y + 45 * Math.sin(angle) + (Math.random() - 0.5) * 5;
    } else {
      const rawJ = data.journal.find(rj => rj.id === j.id);
      const relatedTasks = data.tasks.filter(rt => rawJ && rt.date === rawJ.date);
      if (relatedTasks.length > 0 && coords.has(relatedTasks[0].id)) {
        const tCoords = coords.get(relatedTasks[0].id)!;
        const angle = Math.random() * 2 * Math.PI;
        j.x = tCoords.x + 50 * Math.cos(angle);
        j.y = tCoords.y + 50 * Math.sin(angle);
      } else {
        const angle = (idx / Math.max(1, journals.length)) * 2 * Math.PI;
        j.x = 300 * Math.cos(angle) + (Math.random() - 0.5) * 10;
        j.y = 300 * Math.sin(angle) + (Math.random() - 0.5) * 10;
      }
    }
    j.vx = 0;
    j.vy = 0;
    coords.set(j.id, { x: j.x, y: j.y });
  });

  return { initialNodes: filteredNodes, initialEdges: filteredEdges };
}

// Single step of force directed physics schema
export function runSimulationStep(currentNodes: GraphNode[], edgesList: GraphEdge[]): GraphNode[] {
  const nodesCount = currentNodes.length;
  const updatedNodes = currentNodes.map(n => ({
    ...n,
    vx: n.vx || 0,
    vy: n.vy || 0,
  }));

  const nodeMap = new Map<string, GraphNode>();
  updatedNodes.forEach(n => nodeMap.set(n.id, n));

  // 1. REPULSION between all nodes
  const repulsionStrength = 3000;
  for (let i = 0; i < nodesCount; i++) {
    const u = updatedNodes[i];
    for (let j = i + 1; j < nodesCount; j++) {
      const v = updatedNodes[j];
      const dx = u.x - v.x;
      const dy = u.y - v.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const force = repulsionStrength / (distance * distance);
      
      u.vx += force * (dx / distance);
      u.vy += force * (dy / distance);
      v.vx -= force * (dx / distance);
      v.vy -= force * (dy / distance);
    }
  }

  // 2. ATTRACTION on edges
  edgesList.forEach(edge => {
    const u = nodeMap.get(edge.source);
    const v = nodeMap.get(edge.target);
    if (u && v) {
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      let idealLength = 80;
      if (edge.type === 'goal-milestone') idealLength = 160;
      else if (edge.type === 'goal-task') idealLength = 200;
      else if (edge.type === 'milestone-task') idealLength = 100;
      else if (edge.type === 'task-journal') idealLength = 80;

      const force = (distance - idealLength) * 0.05;

      u.vx += force * (dx / distance);
      u.vy += force * (dy / distance);
      v.vx -= force * (dx / distance);
      v.vy -= force * (dy / distance);
    }
  });

  // 3. GRAVITY attraction towards (0,0)
  updatedNodes.forEach(u => {
    u.vx -= 0.005 * u.x;
    u.vy -= 0.005 * u.y;
  });

  // 4. DAMPING velocities & updating coordinates
  updatedNodes.forEach(u => {
    u.vx *= 0.85;
    u.vy *= 0.85;
    u.x += u.vx;
    u.y += u.vy;
  });

  return updatedNodes;
}

export function GraphView({ data, onChangeView, isPreview = false }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Vue Filters
  const [hideTasksAndJournal, setHideTasksAndJournal] = useState(false);
  const [todayTasksOnlyHighlight, setTodayTasksOnlyHighlight] = useState(false);

  // States for organized nodes and edges managed by physics simulation
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  // Resize listener
  useEffect(() => {
    if (isPreview) {
      setDimensions({ width: 1000, height: 600 });
      return;
    }
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: width || 1000,
        height: height || 700
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPreview]);

  // Run physics simulation animated for 80 steps
  useEffect(() => {
    const { initialNodes, initialEdges } = getInitialLayout(data, hideTasksAndJournal);
    setNodes(initialNodes);
    setEdges(initialEdges);
    setIsSimulating(true);

    let currentNodes: GraphNode[] = initialNodes.map(n => ({ ...n, vx: 0, vy: 0 }));
    let iteration = 0;
    const maxIterations = 80;
    let animFrameId: number;

    const tick = () => {
      if (iteration >= maxIterations) {
        setIsSimulating(false);
        return;
      }

      currentNodes = runSimulationStep(currentNodes, initialEdges);
      setNodes([...currentNodes]);
      iteration++;
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [data, hideTasksAndJournal]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Set of connected nodes for high performance checks
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach(edge => {
      if (edge.source === selectedNodeId) set.add(edge.target);
      if (edge.target === selectedNodeId) set.add(edge.source);
    });
    return set;
  }, [selectedNodeId, edges]);

  // Find currently selected node representation
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  // List neighbors
  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const list: typeof nodes = [];
    edges.forEach(edge => {
      if (edge.source === selectedNodeId) {
        const found = nodes.find(n => n.id === edge.target);
        if (found) list.push(found);
      }
      if (edge.target === selectedNodeId) {
        const found = nodes.find(n => n.id === edge.source);
        if (found) list.push(found);
      }
    });

    // Remove duplicates
    const finalNodes: typeof nodes = [];
    const seen = new Set<string>();
    list.forEach(node => {
      if (!seen.has(node.id)) {
        seen.add(node.id);
        finalNodes.push(node);
      }
    });
    return finalNodes;
  }, [selectedNodeId, edges, nodes]);

  // Event handlers for dragging to Pan
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    if (target.closest('button') || target.closest('.node-element')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel to Zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newScale = scale;
    if (e.deltaY < 0) {
      newScale = Math.min(2.5, scale * zoomFactor);
    } else {
      newScale = Math.max(0.3, scale / zoomFactor);
    }
    setScale(newScale);
  };

  // Truncate labels for SVG Under-Labels
  const truncated20 = (text: string) => {
    if (!text) return '';
    return text.length > 20 ? text.substring(0, 17) + '...' : text;
  };

  // Empty check
  const isEmpty = data.goals.length === 0 && data.tasks.length === 0;

  return (
    <div className={`flex flex-col h-full ${isPreview ? 'bg-transparent' : 'bg-stone-50 dark:bg-stone-900'}`}>
      {/* Upper header */}
      {!isPreview && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 z-10 shrink-0 select-none">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-serif font-light text-stone-800 dark:text-stone-100">
              <Network className="w-6 h-6 text-indigo-500 dark:text-indigo-400 animate-pulse" />
              <span>Ma Carte Mentale</span>
            </h1>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Visualise la constellation de tes objectifs, jalons, actions d'engagement et notes de journal.
            </p>
          </div>

          {/* View Controls */}
          <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => {
                setOffset({ x: 0, y: 0 });
                setScale(0.8);
              }}
              className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-sans font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-800 dark:hover:text-stone-100 shadow-sm transition active:scale-95"
              title="Recadrer la constellation"
            >
              Tout voir
            </button>

            <button
              onClick={() => setHideTasksAndJournal(!hideTasksAndJournal)}
              className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs font-sans font-bold shadow-sm transition active:scale-95 ${
                hideTasksAndJournal
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
              }`}
              title="Masquer les actions et entrées journal"
            >
              {hideTasksAndJournal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              Objectifs seuls
            </button>

            <button
              onClick={() => setTodayTasksOnlyHighlight(!todayTasksOnlyHighlight)}
              className={`flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs font-sans font-bold shadow-sm transition active:scale-95 ${
                todayTasksOnlyHighlight
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
              }`}
              title="Mettre en valeur uniquement les actions prévues aujourd'hui"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Actions du jour
            </button>

            <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 p-0.5 shadow-sm">
              <button
                onClick={() => setScale(prev => Math.min(2.5, prev + 0.2))}
                className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="text-[10px] font-mono text-stone-400 dark:text-stone-500 px-1 select-none w-10 text-center">
                {Math.round(scale * 100)}%
              </div>
              <button
                onClick={() => setScale(prev => Math.max(0.3, prev - 0.2))}
                className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmpty ? (
        isPreview ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none pointer-events-none">
            <Network className="w-8 h-8 text-stone-300 dark:text-stone-600 mb-2 animate-pulse" />
            <p className="text-xs text-stone-400 dark:text-stone-500 italic">Aucune intention à afficher</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-stone-900 z-0 max-w-lg mx-auto my-12 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
              <Network className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-serif font-light text-stone-800 dark:text-stone-100 mb-2">Ton graphe est vide</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed max-w-sm">
              Commence par définir un objectif pour voir tes intentions prendre forme ici.
            </p>
            <button
              onClick={() => onChangeView && onChangeView('goals')}
              className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-700 text-white font-medium rounded-2xl px-5 py-3 text-sm hover:bg-indigo-700 dark:hover:bg-indigo-800 active:scale-95 transition"
            >
              Fixer mon premier cap
            </button>
          </div>
        )
      ) : (
        <div className="flex-1 overflow-hidden relative select-none">
          {/* Floating status text during organization simulation */}
          {!isPreview && isSimulating && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-stone-900/95 backdrop-blur border border-stone-200/50 dark:border-stone-700/50 px-4 py-1.5 rounded-full text-xs text-stone-400 dark:text-stone-500 italic shadow-sm z-30 flex items-center gap-2 select-none animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              Organisation en cours...
            </div>
          )}

          <div ref={containerRef} className="w-full h-full relative">
            {/* Main Interactive SVG */}
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              style={{ display: 'block' }}
              className="bg-stone-50/40 dark:bg-stone-900/40 cursor-grab active:cursor-grabbing outline-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onClick={() => setSelectedNodeId(null)}
            >
              {/* Main Transform Group */}
              <g transform={`translate(${dimensions.width / 2 + offset.x}, ${dimensions.height / 2 + offset.y}) scale(${scale})`}>
                {/* 1. Edges Graph Layer */}
                <g id="edges-layer" className="bg-graph-elements">
                  {edges.map((edge, index) => {
                    const u = nodes.find(n => n.id === edge.source);
                    const v = nodes.find(n => n.id === edge.target);
                    if (!u || !v) return null;

                    const style = EDGE_STYLES[edge.type] || { stroke: '#a8a29e', strokeWidth: 1, opacity: 0.4 };
                    const isHighlighted = selectedNodeId 
                      ? (edge.source === selectedNodeId || edge.target === selectedNodeId)
                      : true;

                    return (
                      <line
                        key={`edge-${edge.source}-${edge.target}-${index}`}
                        x1={u.x}
                        y1={u.y}
                        x2={v.x}
                        y2={v.y}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        opacity={
                          todayTasksOnlyHighlight 
                            ? 0.05
                            : (selectedNodeId ? (isHighlighted ? 0.8 : 0.05) : style.opacity || 0.4)
                        }
                        className="transition-opacity duration-300 pointer-events-none"
                      />
                    );
                  })}
                </g>

                {/* 2. Nodes Graph Layer */}
                <g id="nodes-layer">
                  {nodes.map(node => {
                    const isSelected = selectedNodeId === node.id;
                    const isConnected = connectedNodeIds.has(node.id);
                    const isTodayTask = node.type === 'task' && node.date === todayStr;

                    // Dimming logic
                    let opacity = 1;
                    if (todayTasksOnlyHighlight) {
                      opacity = isTodayTask ? 1 : 0.15;
                    } else if (selectedNodeId) {
                      opacity = isSelected || isConnected ? 1 : 0.2;
                    } else {
                      opacity = node.isCompleted ? 1 : 0.75;
                    }

                    return (
                      <g
                        key={`node-${node.id}`}
                        className="node-element cursor-pointer group"
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        opacity={opacity}
                        style={{ transition: 'opacity 0.2s ease, transform 0.2s ease' }}
                      >
                        {/* Interactive hover circle back-drop */}
                        <circle
                          r={node.radius + 8}
                          fill="transparent"
                          className="pointer-events-auto"
                        />

                        {/* Selected White Halo Ring */}
                        {isSelected && (
                          <circle
                            r={node.radius + 3}
                            fill="none"
                            stroke="white"
                            strokeWidth={3}
                            className="pointer-events-none"
                          />
                        )}

                        {/* Domain Solid Core */}
                        <circle
                          r={node.radius}
                          fill={node.color}
                          style={{
                            filter: node.type === 'goal' ? 'drop-shadow(0px 2px 5px rgba(0,0,0,0.2))' : undefined,
                          }}
                          className="transition-transform duration-200 group-hover:scale-[1.12]"
                        />

                        {/* If Completed - Inner Accent Ring & checkmark */}
                        {node.isCompleted && (
                          <>
                            <circle
                              r={Math.max(node.radius - 4, 3)}
                              fill="none"
                              stroke="white"
                              strokeWidth={1.5}
                              pointerEvents="none"
                            />
                            <text
                              textAnchor="middle"
                              dy=".32em"
                              fill="white"
                              fontSize={node.radius > 15 ? '12px' : '9px'}
                              fontWeight="bold"
                              pointerEvents="none"
                              className="font-sans"
                            >
                              ✓
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* 3. Text Labels Layer */}
                <g id="labels-layer">
                  {nodes.map(node => {
                    const isVisible = scale > 0.7 || hoveredNodeId === node.id || selectedNodeId === node.id;
                    if (!isVisible) return null;

                    const isHovered = hoveredNodeId === node.id;
                    const isSelected = selectedNodeId === node.id;
                    const isConnected = connectedNodeIds.has(node.id);
                    const isTodayTask = node.type === 'task' && node.date === todayStr;

                    // Dimming labels
                    let opacity = 1;
                    if (todayTasksOnlyHighlight) {
                      opacity = isTodayTask ? 1 : 0.15;
                    } else if (selectedNodeId) {
                      opacity = isSelected || isConnected ? 1 : 0.15;
                    }

                    const displayText = isHovered ? node.fullTitle : truncated20(node.label);

                    return (
                      <text
                        key={`label-${node.id}`}
                        x={node.x}
                        y={node.y + node.radius + 15}
                        textAnchor="middle"
                        className="font-sans select-none pointer-events-none fill-stone-600 dark:fill-stone-300 font-medium tracking-tight"
                        style={{
                          fontSize: '10px',
                          opacity,
                          transition: 'opacity 0.2s ease',
                        }}
                      >
                        {displayText}
                      </text>
                    );
                  })}
                </g>
              </g>
            </svg>

            {/* Floating Legend (Bottom Left) */}
            {!isPreview && (
              legendOpen ? (
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur rounded-2xl p-4 border border-stone-100 text-[11px] font-sans shadow-md space-y-2.5 z-40 select-none animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between gap-6 mb-1">
                    <div className="font-semibold text-stone-400 uppercase tracking-wider text-[9px]">Légende</div>
                    <button
                      onClick={() => setLegendOpen(false)}
                      className="p-1 hover:bg-stone-50 rounded-full transition text-stone-400 hover:text-stone-600 focus:outline-none"
                      title="Fermer la légende"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-600">
                    <span className="w-3.5 h-3.5 rounded-full bg-violet-600 inline-block flex-shrink-0" />
                    <span className="font-medium">Objectif (28px)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block flex-shrink-0" />
                    <span className="font-medium">Étape (18px)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
                    <span className="font-medium">Action (12px)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
                    <span className="font-medium">Journal (10px)</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setLegendOpen(true)}
                  className="absolute bottom-6 left-6 bg-white border border-stone-200 rounded-full w-9 h-9 flex items-center justify-center shadow-sm cursor-pointer z-40 text-stone-500 hover:text-indigo-600 hover:bg-stone-50 transition active:scale-95 focus:outline-none"
                  title="Afficher la légende"
                >
                  <Info className="w-5 h-5" />
                </button>
              )
            )}
          </div>

          {/* Floating Details Sidebar Panel (Bottom Right) */}
          {!isPreview && selectedNode && (
            <div className="fixed bottom-6 right-6 bg-white border border-stone-100 rounded-3xl shadow-xl p-6 w-80 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex justify-between items-start mb-4">
                {/* Colored Badge */}
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: selectedNode.color + '15',
                    color: selectedNode.color,
                  }}
                >
                  {selectedNode.type === 'goal' ? 'Objectif' :
                   selectedNode.type === 'milestone' ? 'Étape' :
                   selectedNode.type === 'task' ? 'Action' : 'Journal'}
                </span>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 hover:bg-stone-50 rounded-full transition text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <h3 className="font-serif font-light text-xl text-stone-800 leading-tight mb-3">
                {selectedNode.fullTitle}
              </h3>

              {/* Status Section */}
              {selectedNode.type !== 'journal' && (
                <div className="flex items-center gap-2 mb-4 text-xs text-stone-500">
                  {selectedNode.isCompleted ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Complété
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-stone-400 font-semibold">
                      <Circle className="w-3.5 h-3.5" />
                      En cours
                    </span>
                  )}
                  {selectedNode.date && (
                    <span className="text-stone-400">
                      • {selectedNode.date}
                    </span>
                  )}
                </div>
              )}

              {/* Connections list */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Connecté à
                </h4>
                {connectedNodes.length === 0 ? (
                  <span className="text-xs text-stone-400 italic font-mono">Aucun lien direct</span>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {connectedNodes.map(connectedItem => (
                      <button
                        key={connectedItem.id}
                        onClick={() => setSelectedNodeId(connectedItem.id)}
                        className="w-full flex items-center justify-between text-left p-2 rounded-xl transition hover:bg-stone-50 text-xs border border-transparent hover:border-stone-100 group"
                      >
                        <div className="flex items-center gap-2 text-stone-600 group-hover:text-stone-800 font-medium truncate max-w-[170px]">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: connectedItem.color }} />
                          <span className="truncate">{connectedItem.fullTitle}</span>
                        </div>
                        <span className="text-[9px] text-stone-400 select-none bg-stone-50 px-1.5 py-0.5 rounded">
                          {connectedItem.type === 'goal' ? 'Obj' :
                           connectedItem.type === 'milestone' ? 'Étape' :
                           connectedItem.type === 'task' ? 'Act' : 'Jour'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
