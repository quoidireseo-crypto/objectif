import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AppData, Goal, Task, JournalEntry, LifeDomain } from '../types';
import { 
  Network, Search, ZoomIn, ZoomOut, Maximize, 
  CheckCircle, Circle, RefreshCw, X, HelpCircle, 
  Eye, EyeOff, Sparkles, BookHeart, Flag, CheckSquare, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartographyProps {
  data: AppData;
  userProfile: { name: string; ageGroup?: string; focusArea?: string } | null;
}

interface GraphNode {
  id: string; // 'center', 'domain:name', 'goal:id', 'task:id', 'journal:id', 'journal_hub'
  label: string;
  type: 'center' | 'domain' | 'goal' | 'task' | 'journal' | 'journal_hub';
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null; // fixed position (for dragging)
  fy?: number | null;
  data?: any; // reference to original item
}

interface GraphLink {
  sourceId: string;
  targetId: string;
  distance: number;
  color: string;
}

const DOMAIN_COLORS: Record<LifeDomain, { node: string; edge: string; text: string; bg: string }> = {
  'Santé & Bien-être': { node: '#10B981', edge: '#A7F3D0', text: '#065F46', bg: '#D1FAE5' }, // Emerald
  'Projet Personnel': { node: '#3B82F6', edge: '#BFDBFE', text: '#1E40AF', bg: '#DBEAFE' }, // Blue
  'Relations & Famille': { node: '#EC4899', edge: '#FBCFE8', text: '#9D174D', bg: '#FCE7F3' }, // Pink
  'Apprentissage': { node: '#8B5CF6', edge: '#DDD6FE', text: '#5B21B6', bg: '#EDE9FE' }, // Purple
  'Finances': { node: '#F59E0B', edge: '#FEF3C7', text: '#92400E', bg: '#FEF3C7' }, // Amber
  'Spiritualité': { node: '#06B6D4', edge: '#CFFAFE', text: '#155E75', bg: '#ECFEFF' }, // Cyan
  'Autre': { node: '#6B7280', edge: '#E5E7EB', text: '#374151', bg: '#F3F4F6' } // Gray
};

export function CartographyView({ data, userProfile }: CartographyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter configurations
  const [showGoals, setShowGoals] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showJournal, setShowJournal] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);

  // Search and Select node state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Navigation / Camera State
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Physics and Simulation variables (held in Ref to run safely inside raf loop)
  const simulationRef = useRef<{
    nodes: GraphNode[];
    links: GraphLink[];
    draggedNodeId: string | null;
    isPanning: boolean;
    startX: number;
    startY: number;
  }>({
    nodes: [],
    links: [],
    draggedNodeId: null,
    isPanning: false,
    startX: 0,
    startY: 0
  });

  // Track client bounds
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // 1. Prepare Nodes & Links based on state & settings
  const { nodes, links } = useMemo(() => {
    const listNodes: GraphNode[] = [];
    const listLinks: GraphLink[] = [];

    // Anchor coordinates randomly around the center initially
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const getRandomPos = (rad: number) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        x: cx + Math.cos(angle) * rad,
        y: cy + Math.sin(angle) * rad
      };
    };

    // A. CENTER NODE (represents User / Universal Goal)
    listNodes.push({
      id: 'center',
      label: userProfile?.name || 'Moi',
      type: 'center',
      color: '#047857', // Emerald Core
      radius: 20,
      x: cx,
      y: cy,
      vx: 0,
      vy: 0
    });

    // B. DOMAINS NODES (Compass Pillars)
    const activeDomains = new Set<LifeDomain>();
    if (userProfile?.focusArea) {
      // Prioritize focus area domain
      const matchedDomain = Object.keys(DOMAIN_COLORS).find(d => userProfile.focusArea?.includes(d)) as LifeDomain | undefined;
      if (matchedDomain) activeDomains.add(matchedDomain);
    }
    // Also add domains that have any goal or task
    data.goals.forEach(g => activeDomains.add(g.domain));
    data.tasks.forEach(t => t.domain && activeDomains.add(t.domain));

    // Ensure we show at least common ones to look symmetric
    const allDomains: LifeDomain[] = [
      'Santé & Bien-être', 'Projet Personnel', 'Relations & Famille', 
      'Apprentissage', 'Finances', 'Spiritualité', 'Autre'
    ];
    allDomains.forEach(dom => activeDomains.add(dom));

    let index = 0;
    activeDomains.forEach(domainName => {
      const angle = (index / activeDomains.size) * Math.PI * 2;
      const dist = 140; // Ring distance
      const initialX = cx + Math.cos(angle) * dist;
      const initialY = cy + Math.sin(angle) * dist;

      listNodes.push({
        id: `domain:${domainName}`,
        label: domainName,
        type: 'domain',
        color: DOMAIN_COLORS[domainName]?.node || '#6B7280',
        radius: 14,
        x: initialX,
        y: initialY,
        vx: 0,
        vy: 0,
        data: domainName
      });

      // Link to center
      listLinks.push({
        sourceId: 'center',
        targetId: `domain:${domainName}`,
        distance: 120,
        color: 'rgba(212, 212, 210, 0.4)'
      });

      index++;
    });

    // C. GOALS (CAPS) NODES
    if (showGoals) {
      data.goals.forEach(goal => {
        const domainNodeId = `domain:${goal.domain}`;
        const pos = getRandomPos(180);

        listNodes.push({
          id: `goal:${goal.id}`,
          label: goal.title,
          type: 'goal',
          color: goal.status === 'Atteint' ? '#10B981' : '#F59E0B',
          radius: 11,
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
          data: goal
        });

        // Link Goal to its domain
        listLinks.push({
          sourceId: domainNodeId,
          targetId: `goal:${goal.id}`,
          distance: 90,
          color: DOMAIN_COLORS[goal.domain]?.edge || 'rgba(200, 200, 200, 0.4)'
        });
      });
    }

    // D. TASKS NODES
    if (showTasks) {
      data.tasks.forEach(task => {
        // Skip completed tasks if showCompleted is off
        if (task.isCompleted && !showCompleted) return;

        const pos = getRandomPos(240);
        let targetLinkNodeId = '';

        if (task.goalId) {
          targetLinkNodeId = `goal:${task.goalId}`;
        } else if (task.domain) {
          targetLinkNodeId = `domain:${task.domain}`;
        } else {
          targetLinkNodeId = 'center';
        }

        // Verify connected node exists under current filter settings
        const linkedNodeExists = listNodes.some(n => n.id === targetLinkNodeId);
        if (!linkedNodeExists) {
          // Fallback to center or domain
          targetLinkNodeId = task.domain ? `domain:${task.domain}` : 'center';
        }

        listNodes.push({
          id: `task:${task.id}`,
          label: task.title,
          type: 'task',
          color: task.isCompleted ? '#10B981' : '#475569',
          radius: 7,
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
          data: task
        });

        listLinks.push({
          sourceId: targetLinkNodeId,
          targetId: `task:${task.id}`,
          distance: 55,
          color: 'rgba(120, 113, 108, 0.25)'
        });
      });
    }

    // E. JOURNAL ENTRIES NODES
    if (showJournal && data.journal.length > 0) {
      // Create a single Journal Hub to balance the network
      listNodes.push({
        id: 'journal_hub',
        label: 'Journal de bord',
        type: 'journal_hub',
        color: '#EC4899', // Crimson / pink hub
        radius: 13,
        x: cx - 120,
        y: cy + 120,
        vx: 0,
        vy: 0
      });

      listLinks.push({
        sourceId: 'center',
        targetId: 'journal_hub',
        distance: 140,
        color: 'rgba(244, 63, 94, 0.25)'
      });

      // Render actual journal entries connected to the hub
      data.journal.forEach(entry => {
        const pos = getRandomPos(200);
        const formattedDate = new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

        // Mood color coding
        let moodColor = '#EC4899'; // Default Rose/Moyen
        if (entry.mood === 'Super') moodColor = '#10B981'; // Green
        else if (entry.mood === 'Bien') moodColor = '#3B82F6'; // Blue
        else if (entry.mood === 'Difficile') moodColor = '#EF4444'; // Red

        listNodes.push({
          id: `journal:${entry.id}`,
          label: `${formattedDate}: ${entry.content.substring(0, 20)}...`,
          type: 'journal',
          color: moodColor,
          radius: 8,
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
          data: entry
        });

        listLinks.push({
          sourceId: 'journal_hub',
          targetId: `journal:${entry.id}`,
          distance: 65,
          color: 'rgba(244, 63, 94, 0.15)'
        });
      });
    }

    return { nodes: listNodes, links: listLinks };
  }, [data, userProfile, showGoals, showTasks, showJournal, showCompleted, dimensions]);

  // Keep simulationRef nodes synchronized with derived list, but preserving current velocities & positions so simulation remains continuous!
  useEffect(() => {
    const sim = simulationRef.current;
    
    // Merge positions of existing nodes, compute new ones
    sim.nodes = nodes.map(newNode => {
      const existing = sim.nodes.find(n => n.id === newNode.id);
      if (existing) {
        return {
          ...newNode,
          x: existing.x,
          y: existing.y,
          vx: existing.vx,
          vy: existing.vy,
          fx: existing.fx,
          fy: existing.fy
        };
      }
      return newNode;
    });

    sim.links = links;
  }, [nodes, links]);

  // Handle ResizeObserver on container to guarantee responsive fluid size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: Math.max(clientHeight || 550, 450)
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Recenter helper
  const handleRecenter = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    // Move all nodes close to target default center coordinates
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    simulationRef.current.nodes.forEach(node => {
      if (node.id === 'center') {
        node.x = cx;
        node.y = cy;
      }
    });
  };

  // 2. Physics & Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;

    const stepSimulation = () => {
      const sim = simulationRef.current;
      const localNodes = sim.nodes;
      const localLinks = sim.links;

      const friction = 0.88;
      const kAttract = 0.045; // Spring constant
      const kRepel = 700; // Coulomb constante
      const kGravity = 0.006; // Central pull

      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;

      // Ensure nodes don't overlap or fly away
      // A. Repulsion between all node pairs
      for (let i = 0; i < localNodes.length; i++) {
        const u = localNodes[i];
        for (let j = i + 1; j < localNodes.length; j++) {
          const v = localNodes[j];

          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);

          // Closer nodes repel more strongly
          const strength = kRepel / distSq;
          const forceX = (dx / dist) * strength;
          const forceY = (dy / dist) * strength;

          u.vx -= forceX;
          u.vy -= forceY;
          v.vx += forceX;
          v.vy += forceY;
        }
      }

      // B. Link attraction (spring forces)
      localLinks.forEach(link => {
        const sourceNode = localNodes.find(n => n.id === link.sourceId);
        const targetNode = localNodes.find(n => n.id === link.targetId);

        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

          const stretch = dist - link.distance;
          const force = kAttract * stretch;

          const forceX = (dx / dist) * force;
          const forceY = (dy / dist) * force;

          sourceNode.vx += forceX;
          sourceNode.vy += forceY;
          targetNode.vx -= forceX;
          targetNode.vy -= forceY;
        }
      });

      // C. Central gravity & movement application
      localNodes.forEach(node => {
        // Attract softly back to center of container view
        const dx = cx - node.x;
        const dy = cy - node.y;
        node.vx += dx * kGravity;
        node.vy += dy * kGravity;

        // Apply friction
        node.vx *= friction;
        node.vy *= friction;

        // Update positions if not fixed explicitly (dragging)
        if (node.fx !== undefined && node.fx !== null) {
          node.x = node.fx;
          node.vx = 0;
        } else {
          node.x += node.vx;
        }

        if (node.fy !== undefined && node.fy !== null) {
          node.y = node.fy;
          node.vy = 0;
        } else {
          node.y += node.vy;
        }
      });
    };

    const drawGraph = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const sim = simulationRef.current;
      const localNodes = sim.nodes;
      const localLinks = sim.links;

      // Clear canvas with a very soft, premium warm linen/cream color matching the elegant Skopos paper theme
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.fillStyle = '#FAF9F6';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Save context for transform matrices (pan / zoom)
      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // A. COMPASS RETICLE: Calculate dynamic center coordinates
      const centerNode = localNodes.find(n => n.id === 'center');
      const centerX = centerNode ? centerNode.x : dimensions.width / 2;
      const centerY = centerNode ? centerNode.y : dimensions.height / 2;

      // Draw elegant topographic/cartography dot matrix aligned with zoom and pan
      ctx.save();
      ctx.fillStyle = 'rgba(40, 36, 30, 0.035)';
      const gridSize = 50;
      const minX = -panX / zoom - 100;
      const maxX = (dimensions.width - panX) / zoom + 100;
      const minY = -panY / zoom - 100;
      const maxY = (dimensions.height - panY) / zoom + 100;
      
      const startGridX = Math.floor(minX / gridSize) * gridSize;
      const startGridY = Math.floor(minY / gridSize) * gridSize;

      for (let x = startGridX; x <= maxX; x += gridSize) {
        for (let y = startGridY; y <= maxY; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Draw concentric dashed orbit paths of the life-compass (Boussole de vie)
      ctx.save();
      ctx.strokeStyle = 'rgba(40, 36, 30, 0.04)';
      ctx.lineWidth = 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(120, 115, 105, 0.35)';
      ctx.font = 'bold 7px system-ui, -apple-system, sans-serif';

      const orbits = [
        { r: 60, label: 'COEUR CENTRAL' },
        { r: 130, label: 'PILES ET DOMAINES' },
        { r: 215, label: 'COMPAS DE DIRECTION' },
        { r: 290, label: 'ACTIONS ET SOUVENIRS' }
      ];

      orbits.forEach(orbit => {
        ctx.beginPath();
        ctx.setLineDash([3, 7]);
        ctx.arc(centerX, centerY, orbit.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Label on the orbits
        ctx.fillText(orbit.label, centerX, centerY - orbit.r - 2);
      });
      ctx.restore();

      // Determine hovered sub-tree nodes to apply spotlight effect
      const spotlightNodeIds = new Set<string>();
      if (hoveredNode) {
        spotlightNodeIds.add(hoveredNode.id);
        localLinks.forEach(link => {
          if (link.sourceId === hoveredNode.id) spotlightNodeIds.add(link.targetId);
          if (link.targetId === hoveredNode.id) spotlightNodeIds.add(link.sourceId);
        });
      }

      // DRAW EDGES (LINKS) WITH FLOW ANIMATIONS
      localLinks.forEach(link => {
        const sourceNode = localNodes.find(n => n.id === link.sourceId);
        const targetNode = localNodes.find(n => n.id === link.targetId);

        if (sourceNode && targetNode) {
          const isHighlighted = hoveredNode ? (spotlightNodeIds.has(sourceNode.id) && spotlightNodeIds.has(targetNode.id)) : true;
          const isDimmed = hoveredNode && !isHighlighted;

          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          
          if (isHighlighted) {
            ctx.strokeStyle = hoveredNode ? 'rgba(4, 120, 87, 0.65)' : link.color;
            ctx.lineWidth = hoveredNode ? 2.2 : 1.5;
          } else {
            ctx.strokeStyle = 'rgba(120, 115, 110, 0.05)'; // Super subtle warm silver
            ctx.lineWidth = 0.8;
          }

          ctx.setLineDash(link.sourceId === 'journal_hub' || targetNode.type === 'journal' ? [2, 4] : []);
          ctx.stroke();
          ctx.setLineDash([]);

          // Flowing dynamic pulse dots (Micro-energy pulses along connections)
          if (isHighlighted && !isDimmed) {
            const timeFactor = Date.now() / 2200;
            const seed = (link.sourceId.charCodeAt(0) + link.targetId.charCodeAt(0)) % 5;
            const progress = (timeFactor + seed / 5) % 1.0;
            const pulseX = sourceNode.x + (targetNode.x - sourceNode.x) * progress;
            const pulseY = sourceNode.y + (targetNode.y - sourceNode.y) * progress;
            
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = hoveredNode ? '#10B981' : targetNode.color;
            ctx.shadowColor = ctx.fillStyle as string;
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.shadowBlur = 0; // Restore
          }
        }
      });

      // DRAW NODES WITH INDIVIDUAL GLASSMORPHISM STYLES & RETICLES
      localNodes.forEach(node => {
        const isHighlighted = hoveredNode ? spotlightNodeIds.has(node.id) : true;
        const isSelected = selectedNode?.id === node.id;
        const isDimmed = hoveredNode && !isHighlighted;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.22 : 1.0;

        // Draw shadow/concentric halo glow for critical elements or active selections
        if (node.type === 'center' || node.type === 'domain' || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + (isSelected ? 9 : 6), 0, Math.PI * 2);
          ctx.fillStyle = node.type === 'center' ? 'rgba(4, 120, 87, 0.05)' : 'rgba(40, 30, 20, 0.02)';
          ctx.fill();
        }

        // DESIGN INDIVIDUAL NODE GRAPHICS
        if (node.type === 'center') {
          // Inner breathing aura for Core Center
          const breath = 1.5 + Math.sin(Date.now() / 900) * 1.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4 + breath, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(4, 120, 87, 0.08)';
          ctx.fill();

          // Core container
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#10B981';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.fill();
          ctx.stroke();

          // Star rating/crosshair compass line markings
          ctx.beginPath();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.4;
          ctx.moveTo(node.x - 5, node.y);
          ctx.lineTo(node.x + 5, node.y);
          ctx.moveTo(node.x, node.y - 5);
          ctx.lineTo(node.x, node.y + 5);
          ctx.stroke();

        } else if (node.type === 'domain') {
          // Double glass shine ring for domains
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}15`;
          ctx.fill();
          ctx.strokeStyle = `${node.color}25`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          // Little center nucleus to signify focal weight
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

        } else if (node.type === 'goal') {
          const isCompleted = (node.data as Goal)?.status === 'Atteint';
          const primaryColor = isCompleted ? '#10B981' : '#F59E0B';

          // Additional track
          if (!isCompleted) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = primaryColor;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.8;
          ctx.fill();
          ctx.stroke();

          // Small interior core
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

        } else if (node.type === 'task') {
          const isCompleted = (node.data as Task)?.isCompleted;

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

          if (isCompleted) {
            ctx.fillStyle = '#10B981';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();

            // Completed check bullet
            ctx.beginPath();
            ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
          } else {
            // Hollow checklist circle
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.6;
            ctx.fill();
            ctx.stroke();

            // Subtle inner dot
            ctx.beginPath();
            ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(71, 85, 105, 0.2)';
            ctx.fill();
          }

        } else if (node.type === 'journal_hub') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#EC4899';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          // Inner mini jewel 
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

        } else if (node.type === 'journal') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          // Light core representing reflection ink
          ctx.beginPath();
          ctx.arc(node.x, node.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
        }

        // DYNAMIC TARGET-LOCK CORNER BRACKETS ROTATING (For selected node)
        if (isSelected) {
          ctx.save();
          const angle = (Date.now() / 1500) % (Math.PI * 2);
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, node.radius * 0.9]);
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, angle, angle + Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // DRAW LABELS
        const shouldDrawLabel = isSelected || isHighlighted || node.type === 'center' || node.type === 'domain' || node.type === 'journal_hub' || zoom > 0.85;

        if (shouldDrawLabel) {
          const fontSize = node.type === 'center' ? 12 : node.type === 'domain' ? 10 : 9;
          const isBold = node.type === 'center' || node.type === 'domain' || isSelected;

          ctx.font = `${isBold ? '600' : '400'} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          
          let text = node.label;
          if (text.length > 25 && !isSelected) {
            text = text.substring(0, 22) + '...';
          }

          const textWidth = ctx.measureText(text).width;
          
          // Bubble text envelope
          ctx.save();
          ctx.shadowColor = 'rgba(40, 36, 30, 0.08)';
          ctx.shadowBlur = 5;
          ctx.shadowOffsetY = 2.5;

          ctx.fillStyle = isSelected 
            ? 'rgba(28, 25, 23, 0.96)' 
            : isHighlighted && hoveredNode 
              ? 'rgba(255, 255, 255, 0.98)' 
              : 'rgba(253, 252, 249, 0.93)'; // elegant warm paper finish
          
          ctx.strokeStyle = isSelected 
            ? '#1C1917' 
            : isHighlighted && hoveredNode
              ? '#E5E7EB'
              : 'rgba(28, 25, 23, 0.08)';
          ctx.lineWidth = 1;
          
          const rectW = textWidth + 12;
          const rectH = fontSize + 6;
          const rectX = node.x - rectW / 2;
          const rectY = node.y - node.radius - rectH - 5;
          
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, rectW, rectH, 6);
          ctx.fill();
          ctx.stroke();
          ctx.restore(); // Restore shadow context details

          // Fill actual characters
          ctx.fillStyle = isSelected 
            ? '#FFFFFF' 
            : isHighlighted && hoveredNode 
              ? '#047857' 
              : '#33302B'; // Slate charcoal
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, node.x, rectY + rectH / 2 + 0.5);
        }

        ctx.restore();
      });

      ctx.restore();
    };

    const renderLoop = () => {
      stepSimulation();
      drawGraph();
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [dimensions, panX, panY, zoom, selectedNode, hoveredNode]);

  // Coordinate mapper from event to world coords
  const getWorldCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: (x - panX) / zoom,
      y: (y - panY) / zoom
    };
  };

  // Find node under mouse coords
  const getNodeUnderMouse = (worldX: number, worldY: number) => {
    const sim = simulationRef.current;
    // Walk list backwards to pick uppermost circles
    for (let i = sim.nodes.length - 1; i >= 0; i--) {
      const node = sim.nodes[i];
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Give extra hit margin on smaller items for comfortable mobile finger touch
      const hitRadius = Math.max(node.radius, 14);
      if (dist <= hitRadius) {
        return node;
      }
    }
    return null;
  };

  // Camera Zoom utility
  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const next = direction === 'in' ? prev + 0.15 : prev - 0.15;
      return Math.max(0.2, Math.min(next, 3.5));
    });
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getWorldCoords(e);
    const targetNode = getNodeUnderMouse(coords.x, coords.y);
    const sim = simulationRef.current;

    if (e.button === 0) { // Left click
      if (targetNode) {
        // Dragging Node
        sim.draggedNodeId = targetNode.id;
        targetNode.fx = coords.x;
        targetNode.fy = coords.y;
        setSelectedNode(targetNode);
      } else {
        // Start panning camera
        sim.isPanning = true;
        sim.startX = e.clientX - panX;
        sim.startY = e.clientY - panY;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getWorldCoords(e);
    const sim = simulationRef.current;

    // Handle physics node drag
    if (sim.draggedNodeId) {
      const draggedNode = sim.nodes.find(n => n.id === sim.draggedNodeId);
      if (draggedNode) {
        draggedNode.fx = coords.x;
        draggedNode.fy = coords.y;
      }
      return;
    }

    // Handle view camera pan
    if (sim.isPanning) {
      setPanX(e.clientX - sim.startX);
      setPanY(e.clientY - sim.startY);
      return;
    }

    // Handle hover focus spotlight detection
    const hovered = getNodeUnderMouse(coords.x, coords.y);
    if (hovered?.id !== hoveredNode?.id) {
      setHoveredNode(hovered);
    }
  };

  const handleMouseUp = () => {
    const sim = simulationRef.current;

    if (sim.draggedNodeId) {
      const draggedNode = sim.nodes.find(n => n.id === sim.draggedNodeId);
      if (draggedNode) {
        draggedNode.fx = null;
        draggedNode.fy = null;
      }
    }

    sim.draggedNodeId = null;
    sim.isPanning = false;
  };

  // Double click resets position
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getWorldCoords(e);
    const clickedNode = getNodeUnderMouse(coords.x, coords.y);
    if (!clickedNode) {
      handleRecenter();
    }
  };

  // Auto-centering when selected node via search
  const handleSelectFromSearch = (nodeId: string) => {
    const node = simulationRef.current.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      // Pan camera so node is in actual center of container view
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      setPanX(cx - node.x * zoom);
      setPanY(cy - node.y * zoom);
    }
    setSearchQuery('');
  };

  // Search filter list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return nodes.filter(node => 
      node.id !== 'center' && node.id !== 'journal_hub' &&
      node.label.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery, nodes]);

  // Determine connected structures for selected details panel
  const selectedNodeWithContext = useMemo(() => {
    if (!selectedNode) return null;

    const list: any[] = [];
    const currentId = selectedNode.id;

    if (selectedNode.type === 'domain') {
      const domainName = selectedNode.data as LifeDomain;
      const goals = data.goals.filter(g => g.domain === domainName);
      const tasks = data.tasks.filter(t => t.domain === domainName);
      return {
        node: selectedNode,
        domain: domainName,
        goals,
        tasks,
        percentage: goals.length > 0
          ? Math.round((goals.filter(g => g.status === 'Atteint').length / goals.length) * 100)
          : 0
      };
    }

    if (selectedNode.type === 'goal') {
      const goal = selectedNode.data as Goal;
      const tasks = data.tasks.filter(t => t.goalId === goal.id);
      return {
        node: selectedNode,
        goal,
        tasks
      };
    }

    if (selectedNode.type === 'task') {
      const task = selectedNode.data as Task;
      const parentGoal = data.goals.find(g => g.id === task.goalId);
      return {
        node: selectedNode,
        task,
        goal: parentGoal
      };
    }

    if (selectedNode.type === 'journal') {
      const entry = selectedNode.data as JournalEntry;
      return {
        node: selectedNode,
        entry
      };
    }

    return { node: selectedNode };
  }, [selectedNode, data]);

  return (
    <div className="flex-1 flex flex-col min-h-full py-2 animate-in fade-in duration-500 font-serif">
      
      {/* 2.1 Ethereal Header */}
      <header className="mb-6 border-b border-stone-200/55 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-light text-stone-900 flex items-center gap-2.5">
              <Network className="text-[#047857] w-8 h-8" />
              Cartographie de l'Esprit
            </h2>
            <p className="text-stone-500 font-sans text-xs md:text-sm mt-2 leading-relaxed max-w-xl font-light">
              Visualise d'un coup d'œil les correspondances sacrées entre tes points d'ancrage, tes caps, tes pas quotidiens et ton journal de bord.
            </p>
          </div>
          
          {/* Legend and Search bar */}
          <div className="relative w-full md:w-72 font-sans">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un cap, jalon, sentiment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 text-xs outline-none focus:ring-1 focus:ring-[#047857] focus:border-[#047857] transition"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Float Search Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 mt-1.5 bg-white border border-stone-200/80 rounded-2xl shadow-lg z-50 p-2.5 max-h-60 overflow-y-auto space-y-1"
                >
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold px-2 mb-1.5">Noeuds trouvés :</p>
                  {searchResults.map(res => (
                    <button
                      key={res.id}
                      onClick={() => handleSelectFromSearch(res.id)}
                      className="w-full text-left px-3 py-2 hover:bg-stone-50 rounded-xl transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-stone-800 line-clamp-1">{res.label}</span>
                        <span className="text-[9px] text-[#047857] uppercase tracking-wider font-bold mt-0.5">{res.type}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 italic">Centrer ›</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Interactive Stage Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        
        {/* LEFT COLUMN: THE PHYSICAL CANVAS INTERFACE (9 Cols or Full if no select) */}
        <div className={`col-span-1 lg:col-span-8 flex flex-col min-h-[500px] bg-white rounded-3xl border border-stone-150/80 shadow-md relative overflow-hidden`}>
          
          {/* Controls Overlay Floating */}
          <div className="absolute top-4 left-4 z-20 flex gap-1.5 bg-white/92 backdrop-blur-md rounded-2xl p-1.5 border border-stone-200/50 shadow-sm font-sans">
            <button onClick={() => handleZoom('in')} className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition" title="Zoom avant">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => handleZoom('out')} className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition" title="Zoom arrière">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleRecenter} className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition" title="Réinitialiser la caméra">
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-2 max-w-[calc(100%-100px)] justify-end font-sans">
            {/* Filter Pill: Caps */}
            <button 
              onClick={() => setShowGoals(!showGoals)}
              className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                showGoals ? 'bg-amber-100/80 border-amber-200 text-amber-900 font-bold' : 'bg-stone-50 border-stone-200 text-stone-400'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              Caps
            </button>
            {/* Filter Pill: Tâches */}
            <button 
              onClick={() => setShowTasks(!showTasks)}
              className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                showTasks ? 'bg-slate-100/90 border-slate-200 text-slate-800 font-bold' : 'bg-stone-50 border-stone-200 text-stone-400'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Pas
            </button>
            {/* Filter Pill: Journal */}
            <button 
              onClick={() => setShowJournal(!showJournal)}
              className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                showJournal ? 'bg-rose-50 border-rose-100 text-[#9D174D] font-bold' : 'bg-stone-50 border-stone-200 text-stone-400'
              }`}
            >
              <BookHeart className="w-3.5 h-3.5" />
              Journal
            </button>
            {/* Toggle Completed */}
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                showCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-bold' : 'bg-stone-50 border-stone-200 text-stone-400'
              }`}
            >
              {showCompleted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Faits
            </button>
          </div>

          {/* Interactive HTML5 Canvas Container with ResizeObserver attachment */}
          <div ref={containerRef} className="flex-1 w-full relative cursor-grab active:cursor-grabbing">
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              className="absolute left-0 top-0 block w-full h-full"
            />
          </div>

          {/* Graph Legend Panel Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-100/80 flex flex-wrap gap-4 justify-center items-center text-[10px] md:text-xs font-sans text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#047857]" />
              <span>Moi / Cap Pivot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-violet-500" />
              <span>Domaines de vie</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
              <span>Caps de Direction (Objectifs)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#475569]" />
              <span>Actions (Pas Quotidiens)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EC4899]" />
              <span>Impressions du Journal</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL PANEL INSIGHT (4 Cols) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col justify-between max-h-[600px] lg:max-h-none overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedNodeWithContext ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-md flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                    <span className="text-[10px] uppercase tracking-widest font-bold font-sans px-2.5 py-1 rounded-full text-stone-500 bg-stone-50 border border-stone-150">
                      Structure {selectedNode.type === 'center' ? 'Racine' : selectedNode.type === 'domain' ? 'Pillier' : selectedNode.type === 'goal' ? 'Cap' : selectedNode.type === 'task' ? 'Un Pas' : 'Ressenti'}
                    </span>
                    <button 
                      onClick={() => setSelectedNode(null)}
                      className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* DOMAIN VIEW NODE DETAILS */}
                  {selectedNode.type === 'domain' && selectedNodeWithContext.domain && (
                    <div className="space-y-4">
                      <h3 className="text-xl text-stone-900 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: selectedNode.color }} />
                        {selectedNodeWithContext.domain}
                      </h3>
                      
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/50">
                        <p className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest mb-1">Rapport d'accomplissement</p>
                        <div className="flex items-end gap-3 mt-1.5">
                          <span className="text-3xl font-light text-stone-800">{selectedNodeWithContext.percentage}%</span>
                          <span className="text-xs text-stone-500 font-sans pb-1">de vos caps accomplis</span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div 
                            className="bg-[#047857] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${selectedNodeWithContext.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Linked Goals List */}
                      <div className="space-y-2">
                        <h4 className="text-xs uppercase font-bold tracking-widest font-sans text-stone-400 flex items-center gap-1.5">
                          <Flag className="w-3.5 h-3.5 text-stone-500" />
                          Caps de direction ({selectedNodeWithContext.goals.length})
                        </h4>
                        {selectedNodeWithContext.goals.length === 0 ? (
                          <p className="text-xs italic text-stone-400 py-1 font-sans">Aucun objectif fixé dans ce domaine de vie.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {selectedNodeWithContext.goals.map((g: Goal) => (
                              <div key={g.id} className="p-2.5 bg-stone-50 border border-stone-150 rounded-xl text-xs flex items-center justify-between font-sans">
                                <span className="font-medium text-stone-800 line-clamp-1">{g.title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${g.status === 'Atteint' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
                                  {g.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* GOAL VIEW NODE DETAILS */}
                  {selectedNode.type === 'goal' && selectedNodeWithContext.goal && (
                    <div className="space-y-4">
                      <h3 className="text-xl text-stone-900 font-light flex items-start gap-2.5">
                        <Flag className="w-5.5 h-5.5 text-amber-500 shrink-0 mt-0.5" />
                        {selectedNodeWithContext.goal.title}
                      </h3>

                      <div className="bg-[#FFFBEB] border border-amber-200/60 p-4 rounded-2xl">
                        <p className="text-[10px] font-sans font-bold text-amber-600 uppercase tracking-widest mb-1.5">Sens profond & Motivations</p>
                        <p className="text-stone-700 italic text-xs leading-relaxed">
                          "{selectedNodeWithContext.goal.why || 'Aucune intention écrite.'}"
                        </p>
                      </div>

                      <div className="space-y-2.5 font-sans">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-400">Statut de direction :</span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            selectedNodeWithContext.goal.status === 'Atteint' 
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                              : 'bg-amber-50 border border-amber-100 text-amber-800'
                          }`}>
                            {selectedNodeWithContext.goal.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-400">Domaine de Vie :</span>
                          <span className="text-stone-700 font-medium">{selectedNodeWithContext.goal.domain}</span>
                        </div>
                      </div>

                      {/* Associated Daily Steps Tasks List */}
                      <div className="space-y-2 pt-3 border-t border-stone-100">
                        <h4 className="text-xs uppercase font-bold tracking-widest font-sans text-stone-400 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-stone-500" />
                          Pas reliés ({selectedNodeWithContext.tasks.length})
                        </h4>
                        {selectedNodeWithContext.tasks.length === 0 ? (
                          <p className="text-xs italic text-stone-400 py-1 font-sans">Aucune action ou tâche n'est reliée à ce cap.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {selectedNodeWithContext.tasks.map((t: Task) => (
                              <div key={t.id} className="p-2.5 bg-stone-50 border border-stone-150 rounded-xl text-xs flex items-center gap-2.5 font-sans">
                                {t.isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-stone-400 shrink-0" />
                                )}
                                <span className={`text-stone-850 line-clamp-1 ${t.isCompleted ? 'line-through text-stone-400' : ''}`}>
                                  {t.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TASK VIEW NODE DETAILS */}
                  {selectedNode.type === 'task' && selectedNodeWithContext.task && (
                    <div className="space-y-4">
                      <h3 className="text-lg text-stone-900 font-sans font-bold flex items-start gap-2.5">
                        <CheckSquare className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
                        {selectedNodeWithContext.task.title}
                      </h3>

                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/50 space-y-2.5 font-sans text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Statut :</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            selectedNodeWithContext.task.isCompleted 
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                              : 'bg-stone-100 border border-stone-200 text-stone-600'
                          }`}>
                            {selectedNodeWithContext.task.isCompleted ? 'Complété' : 'À Faire'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Date prévue :</span>
                          <span className="text-stone-700 font-medium">
                            {new Date(selectedNodeWithContext.task.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        {selectedNodeWithContext.task.domain && (
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Pillier :</span>
                            <span className="text-stone-700 font-medium">{selectedNodeWithContext.task.domain}</span>
                          </div>
                        )}
                      </div>

                      {selectedNodeWithContext.goal && (
                        <div className="border-t border-stone-100 pt-3 space-y-1.5">
                          <p className="text-[10px] uppercase tracking-widest font-bold font-sans text-stone-400">Cap de direction associé :</p>
                          <div className="p-3 bg-[#FFFBEB] border border-amber-200/40 rounded-xl flex items-center justify-between">
                            <span className="text-xs font-serif italic text-stone-800 line-clamp-1">"{selectedNodeWithContext.goal.title}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* JOURNAL JOURNALENTRY DETAILS */}
                  {selectedNode.type === 'journal' && selectedNodeWithContext.entry && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-sans font-bold text-rose-500 uppercase tracking-widest">Sentiment & Ressenti</p>
                        <h3 className="text-xl text-stone-900 font-light flex items-center gap-2">
                          <BookHeart className="w-5.5 h-5.5 text-rose-500" />
                          {new Date(selectedNodeWithContext.entry.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 font-sans py-1">
                        <span className="text-xs text-stone-400">État intérieur :</span>
                        <span className={`px-3 py-0.5 rounded-full font-bold text-xs shadow-xs ${
                          selectedNodeWithContext.entry.mood === 'Super' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                          selectedNodeWithContext.entry.mood === 'Bien' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                          selectedNodeWithContext.entry.mood === 'Moyen' ? 'bg-rose-50 text-[#9D174D] border border-rose-100' :
                          'bg-amber-50 text-amber-800 border border-amber-100'
                        }`}>
                          {selectedNodeWithContext.entry.mood}
                        </span>
                      </div>

                      <div className="bg-[#FFFDFB] border border-rose-100 p-4 rounded-2xl shadow-inner min-h-[120px] max-h-60 overflow-y-auto">
                        <p className="text-stone-800 italic text-xs leading-relaxed whitespace-pre-wrap">
                          "{selectedNodeWithContext.entry.content}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CORE CENTER HUB DETAILS */}
                  {selectedNode.type === 'center' && (
                    <div className="space-y-4">
                      <h3 className="text-xl text-stone-950 font-light flex items-center gap-2">
                        <Sparkles className="w-5.5 h-5.5 text-[#047857]" />
                        {userProfile?.name ? userProfile.name : 'Moi'} — Boussole Pivot
                      </h3>
                      <p className="text-xs font-sans text-stone-500 leading-relaxed">
                        C'est vous ! Ce pôle central maintient l'intégrité gravitationnelle de tous vos objectifs, actions rattachées et sentiments écrits.
                      </p>
                      <div className="p-3.5 bg-stone-50 border border-stone-200/50 rounded-2xl text-stone-600 font-sans text-[11px] leading-relaxed">
                        💡 <span className="font-bold">Astuce :</span> Cliquer sur n'importe quel autre nœud environnant pour faire apparaître son sens profond, sa progression ou s'il s'agit d'une action, son détail.
                      </div>
                    </div>
                  )}

                  {/* JOURNAL HUB DETAIL */}
                  {selectedNode.type === 'journal_hub' && (
                    <div className="space-y-4">
                      <h3 className="text-xl text-stone-900 flex items-center gap-2">
                        <BookHeart className="w-6 h-6 text-rose-500" />
                        Espace Réflexion (Journal)
                      </h3>
                      <p className="text-xs font-sans text-stone-500 leading-relaxed">
                        C'est l'étage mental où s'ancrent toutes vos réflexions rédigées. Chaque nœud satellite représente une date unique.
                      </p>
                      <p className="text-xs font-sans text-stone-400 leading-relaxed">
                        L'état d'esprit est représenté par la couleur du nœud : le vert correspond à un état splendide, le bleu à une journée sereine, le jaune et le rouge décrivent des contextes d'efforts et de défis.
                      </p>
                    </div>
                  )}

                </div>

                <div className="pt-4 border-t border-stone-100 mt-6 text-center text-[10px] text-stone-400 font-sans">
                  Glisser le nœud pour ajuster la gravité locale. Double-cliquer pour réinitialiser.
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-md flex-1 flex flex-col justify-center items-center text-center font-sans">
                <Compass className="w-10 h-10 text-stone-300 animate-pulse mb-3" />
                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Aucun focus d'analyse</h3>
                <p className="text-xs text-stone-400 max-w-[200px] leading-relaxed mt-2">
                  Cliquez sur un domaine de vie, un objectif ou un jalon du graphique pour en dévoiler le sens profond et les liaisons.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
