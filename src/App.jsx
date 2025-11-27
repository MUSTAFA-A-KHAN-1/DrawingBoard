import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  Paintbrush,
  PenTool,
  Eraser,
  SprayCan,
  Highlighter,
  Undo,
  Palette,
  Pen,
  Droplet,
  Feather,
  Edit3,
  Maximize,
  Minimize,
  Square,
  Circle as CircleIcon,
  Triangle,
  Minus,
  Settings,
  X,
  Scan,
  PaintBucket,
  PanelLeft,
  PanelRight,
  Wind,
  Grid,
  AlignJustify,
  Sliders,
  Copy,
  Scissors,
  Brush,
  Cloud,
  Fingerprint,
  Spline 
} from 'lucide-react';

// --- Config ---
const CANVAS_WIDTH = 1135;
const CANVAS_HEIGHT = 1200;

const BLENDING_MODES = [
  'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'
];

// Tools Config
const INITIAL_TOOLS = {
  // Standard Vector Tools
  PENCIL: { 
    id: 'PENCIL', type: 'vector', icon: PenTool, label: 'Pencil', 
    size: 3, alpha: 1, composite: 'source-over', 
    smoothing: 0, pressure: true, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  INK: { 
    id: 'INK', type: 'vector', icon: Pen, label: 'Ink Pen', 
    size: 4, alpha: 1, composite: 'source-over', 
    smoothing: 0.5, pressure: true, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  
  // Special FX
  RIBBON: { 
    id: 'RIBBON', type: 'physics', icon: Spline, label: 'Ribbon', 
    size: 1, alpha: 1, composite: 'source-over', 
    smoothing: 0, pressure: false, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },

  // Painting Brushes
  OIL: { 
    id: 'OIL', type: 'texture', icon: Brush, label: 'Oil Paint', 
    size: 40, alpha: 0.6, composite: 'source-over', 
    smoothing: 0.2, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.6, scatter: 0 
  },
  ACRYLIC: { 
    id: 'ACRYLIC', type: 'texture', icon: Paintbrush, label: 'Acrylic', 
    size: 35, alpha: 0.9, composite: 'source-over', 
    smoothing: 0.1, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.8, scatter: 0 
  },
  BRUSH: { 
    id: 'BRUSH', type: 'vector', icon: Paintbrush, label: 'Basic Brush', 
    size: 12, alpha: 1, composite: 'source-over', 
    smoothing: 0.2, pressure: true, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },

  // Soft/Blending Brushes
  WATERCOLOR: { 
    id: 'WATERCOLOR', type: 'texture', icon: Droplet, label: 'Watercolor', 
    size: 50, alpha: 0.1, composite: 'multiply', 
    smoothing: 0.1, pressure: true, shadow: false, shadowBlur: 0, 
    density: 0.2, scatter: 0 
  },
  AIRBRUSH: { 
    id: 'AIRBRUSH', type: 'texture', icon: Wind, label: 'Airbrush', 
    size: 60, alpha: 0.5, composite: 'source-over', 
    smoothing: 0.1, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.25, scatter: 0 
  },
  
  // Dry Media
  PASTEL: { 
    id: 'PASTEL', type: 'texture', icon: Cloud, label: 'Pastel', 
    size: 30, alpha: 0.7, composite: 'source-over', 
    smoothing: 0, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.6, scatter: 2 
  },
  CRAYON: { 
    id: 'CRAYON', type: 'texture', icon: Edit3, label: 'Crayon', 
    size: 25, alpha: 0.8, composite: 'source-over', 
    smoothing: 0, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.5, scatter: 1
  },
  CHARCOAL: { 
    id: 'CHARCOAL', type: 'texture', icon: Feather, label: 'Charcoal', 
    size: 30, alpha: 0.6, composite: 'source-over', 
    smoothing: 0, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.8, scatter: 2
  },
  
  // FX / Portrait
  SKIN: { 
    id: 'SKIN', type: 'texture', icon: Fingerprint, label: 'Skin Texture', 
    size: 50, alpha: 0.3, composite: 'source-over', 
    smoothing: 0.1, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.2, scatter: 10 
  },
  MARKER: { 
    id: 'MARKER', type: 'vector', icon: Highlighter, label: 'Marker', 
    size: 20, alpha: 0.5, composite: 'multiply', 
    smoothing: 0.1, pressure: false, shadow: false, shadowBlur: 0, lineCap: 'square' 
  },
  SPRAY: { 
    id: 'SPRAY', type: 'texture', icon: SprayCan, label: 'Spray', 
    size: 60, alpha: 0.8, composite: 'source-over', 
    smoothing: 0, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.1, scatter: 20
  },

  // Pattern
  CALLIGRAPHY: { 
    id: 'CALLIGRAPHY', type: 'texture', icon: Pen, label: 'Calligraphy', 
    size: 20, alpha: 1, composite: 'source-over', 
    smoothing: 0.5, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.1, scatter: 0
  },
  FUR: { 
    id: 'FUR', type: 'texture', icon: AlignJustify, label: 'Fur', 
    size: 30, alpha: 0.8, composite: 'source-over', 
    smoothing: 0.2, pressure: true, shadow: false, shadowBlur: 0,
    density: 0.6, scatter: 5
  },
  HATCH_V: { 
    id: 'HATCH_V', type: 'texture', icon: Grid, label: 'Hatch (V)', 
    size: 30, alpha: 0.8, composite: 'source-over', 
    smoothing: 0, pressure: false, shadow: false, shadowBlur: 0,
    density: 0.4, scatter: 0
  },
  HATCH_CROSS: { 
    id: 'HATCH_CROSS', type: 'texture', icon: Grid, label: 'Mesh', 
    size: 30, alpha: 0.8, composite: 'source-over', 
    smoothing: 0, pressure: false, shadow: false, shadowBlur: 0,
    density: 0.4, scatter: 0
  },
  
  // Utility
  FILL: { 
    id: 'FILL', type: 'tool', icon: PaintBucket, label: 'Fill', 
    size: 0, alpha: 1, composite: 'source-over' 
  },
  ERASER: { 
    id: 'ERASER', type: 'vector', icon: Eraser, label: 'Eraser', 
    size: 30, alpha: 1, composite: 'destination-out', 
    smoothing: 0, pressure: false, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
};

const SHAPE_TOOLS = {
  RECT: { id: 'RECT', icon: Square, label: 'Rectangle' },
  ELLIPSE: { id: 'ELLIPSE', icon: CircleIcon, label: 'Circle' },
  TRIANGLE: { id: 'TRIANGLE', icon: Triangle, label: 'Triangle' },
  LINE: { id: 'LINE', icon: Minus, label: 'Line' },
};

const OVERLAY_TOOLS = ['PENCIL', 'INK', 'BRUSH', 'MARKER', 'WATERCOLOR', 'CRAYON', 'CHARCOAL', 'SPRAY', 'AIRBRUSH', 'CALLIGRAPHY', 'FUR', 'HATCH_V', 'HATCH_CROSS', 'OIL', 'ACRYLIC', 'PASTEL', 'SKIN', 'RIBBON'];

export default function App() {
  // --- State ---
  const [layers, setLayers] = useState([
    { id: 'layer-1', name: 'Background', visible: true, locked: false, opacity: 1, blendMode: 'normal', shadow: false, shadowColor: '#000000', shadowBlur: 10, shadowX: 0, shadowY: 5 }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-1');
  const [tools, setTools] = useState(INITIAL_TOOLS);
  const [mode, setMode] = useState('BRUSH'); 
  const [activeToolId, setActiveToolId] = useState('PENCIL');
  const [color, setColor] = useState('#000000');
  
  // UI State
  const [showUI, setShowUI] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false); 
  const [showSettings, setShowSettings] = useState(false);
  const [showLayerSettings, setShowLayerSettings] = useState(false);

  const [transform, setTransform] = useState({ x: 100, y: 100, k: 0.25 }); 
  const [isDrawing, setIsDrawing] = useState(false);
  const [snappedShape, setSnappedShape] = useState(null); 
  const [history, setHistory] = useState([]);

  // --- Refs ---
  const canvasRefs = useRef({});
  const overlayCanvasRef = useRef(null); 
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);
  const brushTextures = useRef({}); 
  const lastPos = useRef({ x: 0, y: 0 });
  const lastMidRef = useRef({ x: 0, y: 0 }); 
  const startPosRef = useRef({ x: 0, y: 0 });
  const pointsRef = useRef([]); 
  const holdTimerRef = useRef(null);
  const snapshotRef = useRef(null);
  const gestureRef = useRef({ startDist: 0, startScale: 1, startX: 0, startY: 0, startCenter: { x: 0, y: 0 } });

  // Ribbon Refs
  const ribbonRef = useRef({
      painters: [],
      interval: null,
      lastPoint: { x: 0, y: 0 },
      active: false
  });

  // --- Texture Generation System ---
  const generateBrushTexture = (type, size, color) => {
      const tipCanvas = document.createElement('canvas');
      const r = size / 2;
      const padding = 4; 
      tipCanvas.width = size + padding * 2;
      tipCanvas.height = size + padding * 2;
      const ctx = tipCanvas.getContext('2d');
      const cx = tipCanvas.width / 2;
      const cy = tipCanvas.height / 2;

      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      if (type === 'CRAYON' || type === 'CHARCOAL' || type === 'PASTEL') {
          const count = type === 'PASTEL' ? 80 : 50;
          for (let i = 0; i < count; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = Math.random() * r;
              const sizeMod = Math.random() * 2 + 1;
              ctx.globalAlpha = Math.random() * 0.5 + 0.2;
              
              if (type === 'PASTEL') {
                  ctx.fillRect(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, sizeMod, sizeMod);
              } else {
                  ctx.beginPath();
                  ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, sizeMod, 0, Math.PI * 2);
                  ctx.fill();
              }
          }
      } else if (type === 'SPRAY' || type === 'SKIN') {
          const count = type === 'SKIN' ? 60 : 40;
          for (let i = 0; i < count; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = Math.random() * r;
              ctx.globalAlpha = Math.random() * 0.8 + 0.2;
              const dotSize = type === 'SKIN' ? 0.8 : 1.5; 
              ctx.fillRect(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, dotSize, dotSize);
          }
      } else if (type === 'WATERCOLOR' || type === 'AIRBRUSH') {
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, color); 
          ctx.globalAlpha = 0.1; 
          if (type === 'AIRBRUSH') ctx.globalAlpha = 0.05;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          if (type === 'AIRBRUSH') {
             ctx.filter = 'blur(4px)';
             ctx.fill();
             ctx.filter = 'none';
          }
      } else if (type === 'OIL' || type === 'ACRYLIC') {
          const bristles = type === 'OIL' ? 40 : 30;
          ctx.globalAlpha = type === 'OIL' ? 0.2 : 0.5; 
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();
          for (let i = 0; i < bristles; i++) {
              const rx = (Math.random() - 0.5) * size;
              const ry = (Math.random() - 0.5) * size;
              const rw = Math.random() * (size * 0.1) + 1;
              const rh = Math.random() * (size * 0.8) + 5;
              ctx.fillRect(cx + rx, cy + ry - rh/2, rw, rh);
          }
          ctx.restore();
      } else if (type === 'CALLIGRAPHY') {
          ctx.translate(cx, cy);
          ctx.rotate(-Math.PI / 4); 
          ctx.fillRect(-r, -r/4, size, size/2); 
          ctx.setTransform(1, 0, 0, 1, 0, 0); 
      } else if (type === 'FUR') {
          for(let i=0; i<10; i++) {
              const angle = (Math.random() - 0.5) * Math.PI; 
              const len = Math.random() * r;
              ctx.globalAlpha = Math.random() * 0.5 + 0.3;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
              ctx.stroke();
          }
      } else if (type === 'HATCH_V') {
          ctx.lineWidth = 1;
          const step = 4;
          for(let i = -r; i < r; i+=step) {
              ctx.beginPath();
              ctx.moveTo(cx + i, cy - r);
              ctx.lineTo(cx + i, cy + r);
              ctx.stroke();
          }
      } else if (type === 'HATCH_CROSS') {
          ctx.lineWidth = 1;
          const step = 6;
          for(let i = -r; i < r; i+=step) {
              ctx.beginPath();
              ctx.moveTo(cx + i, cy - r);
              ctx.lineTo(cx + i, cy + r);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(cx - r, cy + i);
              ctx.lineTo(cx + r, cy + i);
              ctx.stroke();
          }
      }
      return tipCanvas;
  };

  useEffect(() => {
      const newTextures = {};
      Object.keys(INITIAL_TOOLS).forEach(key => {
          const tool = INITIAL_TOOLS[key];
          if (tool.type === 'texture') {
             newTextures[key] = generateBrushTexture(key, 50, color);
          }
      });
      brushTextures.current = newTextures;
  }, [color]);

  // --- Initialization ---
  useEffect(() => {
    const bgCanvas = canvasRefs.current['layer-1'];
    if (bgCanvas) {
      const ctx = bgCanvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    if (window.innerWidth > 768) {
      setShowRightPanel(true);
    }
    setTimeout(fitCanvasToScreen, 100);
  }, []);

  const fitCanvasToScreen = useCallback(() => {
    if (workspaceRef.current) {
        const rect = workspaceRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const scaleX = rect.width / CANVAS_WIDTH;
        const scaleY = rect.height / CANVAS_HEIGHT;
        const scale = Math.min(scaleX, scaleY) * 0.9; 
        const centerX = (rect.width - CANVAS_WIDTH * scale) / 2;
        const centerY = (rect.height - CANVAS_HEIGHT * scale) / 2;
        setTransform({ x: centerX, y: centerY, k: scale });
    }
  }, []);

  // Watch for resize
  useEffect(() => {
    if (!workspaceRef.current) return;
    const resizeObserver = new ResizeObserver(() => {});
    resizeObserver.observe(workspaceRef.current);
    fitCanvasToScreen();
    setTimeout(fitCanvasToScreen, 100);
    return () => resizeObserver.disconnect();
  }, [fitCanvasToScreen]);

  // --- State Updaters ---
  const updateToolSettings = (key, value) => {
    setTools(prev => ({
      ...prev,
      [activeToolId]: { ...prev[activeToolId], [key]: value }
    }));
  };

  const updateLayer = (id, key, value) => {
      setLayers(layers.map(l => l.id === id ? { ...l, [key]: value } : l));
  };

  const saveToHistory = useCallback(() => {
    const canvas = canvasRefs.current[activeLayerId];
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    try {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        setHistory(prev => {
          const newHistory = [...prev, { layerId: activeLayerId, imageData }];
          if (newHistory.length > 20) newHistory.shift(); 
          return newHistory;
        });
    } catch (e) { console.error("Undo save failed", e); }
  }, [activeLayerId]);

  const undo = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    const canvas = canvasRefs.current[lastAction.layerId];
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.putImageData(lastAction.imageData, 0, 0);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const clearLayer = (layerId) => {
      saveToHistory();
      const canvas = canvasRefs.current[layerId];
      if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
  };

  const fillLayer = (layerId) => {
      saveToHistory();
      const canvas = canvasRefs.current[layerId];
      if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
  };

  // --- Helpers & Core Logic ---
  const getCoordinates = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    return { x: relativeX * scaleX, y: relativeY * scaleY };
  };

  const saveSnapshot = (ctx) => {
    try {
        snapshotRef.current = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } catch(e) { console.error("Snapshot failed", e); }
  };

  // Restored helper function
  const drawTextureAt = (ctx, x, y, tool, size) => {
      const texture = brushTextures.current[tool.id];
      if (!texture) return;
      
      const scale = size / 50; 
      const jitter = (Math.random() - 0.5) * (tool.scatter || 0);

      ctx.save();
      ctx.translate(x + jitter, y + jitter);
      if (tool.id !== 'HATCH_V' && tool.id !== 'HATCH_CROSS') {
         ctx.rotate(Math.random() * Math.PI * 2);
      } else {
         ctx.rotate(0);
      }
      ctx.scale(scale, scale);
      ctx.drawImage(texture, -25, -25); 
      ctx.restore();
  };

  const analyzeShape = (points) => {
    if (points.length < 15) return null;
    const start = points[0];
    const end = points[points.length - 1];
    const totalLength = points.reduce((acc, pt, i) => i === 0 ? 0 : acc + Math.hypot(pt.x - points[i-1].x, pt.y - points[i-1].y), 0);
    const gap = Math.hypot(end.x - start.x, end.y - start.y);
    const isClosed = gap < totalLength * 0.25;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    const width = maxX - minX;
    const height = maxY - minY;
    
    if (!isClosed) return (gap / totalLength > 0.85) ? 'LINE' : null;
    
    let deviationSum = 0;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    points.forEach(p => {
        const val = Math.pow(p.x - centerX, 2) / Math.pow(radiusX, 2) + Math.pow(p.y - centerY, 2) / Math.pow(radiusY, 2);
        deviationSum += Math.abs(1 - val);
    });
    const avgDeviation = deviationSum / points.length;
    if (avgDeviation < 0.25) return 'ELLIPSE';

    const threshold = Math.min(width, height) * 0.25;
    let cornersVisited = 0;
    const corners = [{x: minX, y: minY}, {x: maxX, y: minY}, {x: maxX, y: maxY}, {x: minX, y: maxY}];
    corners.forEach(c => {
       if (points.some(p => Math.hypot(p.x - c.x, p.y - c.y) < threshold)) cornersVisited++;
    });
    if (cornersVisited >= 3) return 'RECT';
    return null;
  };

  const floodFill = (ctx, startX, startY, fillColor) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const getPixelIndex = (x, y) => (y * w + x) * 4;
    const r = parseInt(fillColor.slice(1, 3), 16);
    const g = parseInt(fillColor.slice(3, 5), 16);
    const b = parseInt(fillColor.slice(5, 7), 16);
    const a = 255; 
    const startIdx = getPixelIndex(Math.floor(startX), Math.floor(startY));
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];
    if (startR === r && startG === g && startB === b && startA === a) return;
    const matchStartColor = (idx) => data[idx] === startR && data[idx + 1] === startG && data[idx + 2] === startB && data[idx + 3] === startA;
    const colorPixel = (idx) => { data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a; };
    const stack = [[Math.floor(startX), Math.floor(startY)]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const pixelIdx = getPixelIndex(cx, cy);
      if (matchStartColor(pixelIdx)) {
        colorPixel(pixelIdx);
        if (cx > 0) stack.push([cx - 1, cy]);
        if (cx < w - 1) stack.push([cx + 1, cy]);
        if (cy > 0) stack.push([cx, cy - 1]);
        if (cy < h - 1) stack.push([cx, cy + 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // --- Rendering ---
  
  // Physics Based Ribbon Logic
  const updateRibbon = useCallback(() => {
      if (!ribbonRef.current.active || !overlayCanvasRef.current) return;
      const ctx = overlayCanvasRef.current.getContext('2d', { willReadFrequently: true });
      
      // Physics update for each painter
      for (let i = 0; i < ribbonRef.current.painters.length; i++) {
          const p = ribbonRef.current.painters[i];
          
          ctx.beginPath();
          ctx.moveTo(p.dx, p.dy);
          
          // Update acceleration and position towards mouse
          // dx -= ax = (ax + (dx - mouseX) * div) * ease
          p.dx -= p.ax = (p.ax + (p.dx - ribbonRef.current.lastPoint.x) * p.div) * p.ease;
          p.dy -= p.ay = (p.ay + (p.dy - ribbonRef.current.lastPoint.y) * p.div) * p.ease;
          
          ctx.lineTo(p.dx, p.dy);
          ctx.stroke();
      }
  }, []);

  const startRibbon = (startX, startY, tool) => {
      const painters = [];
      const count = 50;
      for(let i=0; i<count; i++) {
          painters.push({
              dx: startX, dy: startY,
              ax: 0, ay: 0,
              div: 0.1,
              ease: Math.random() * 0.2 + 0.6
          });
      }
      
      ribbonRef.current = {
          active: true,
          painters: painters,
          lastPoint: { x: startX, y: startY },
          interval: setInterval(updateRibbon, 1000/60)
      };
      
      if (overlayCanvasRef.current) {
          const ctx = overlayCanvasRef.current.getContext('2d');
          ctx.strokeStyle = `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, ${0.05 * tool.alpha})`;
          ctx.lineWidth = tool.size || 1;
      }
  };

  const drawTextureLine = (ctx, p1, p2, tool, pressure) => {
      const texture = brushTextures.current[tool.id];
      if (!texture) return;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      let currentSize = tool.size;
      let currentAlpha = tool.alpha;
      if (tool.pressure) {
          const factor = pressure || 0.5;
          currentSize = Math.max(1, tool.size * (factor * 1.5));
          currentAlpha = Math.min(1, tool.alpha * (factor * 1.5));
      }
      const density = tool.density || 0.2;
      const step = Math.max(1, currentSize * density); 
      const scale = currentSize / 50; 
      for (let i = 0; i < dist; i += step) {
          const x = p1.x + Math.cos(angle) * i;
          const y = p1.y + Math.sin(angle) * i;
          const jitter = (Math.random() - 0.5) * (tool.scatter || 0);
          ctx.save();
          ctx.translate(x + jitter, y + jitter);
          if (tool.id !== 'HATCH_V' && tool.id !== 'HATCH_CROSS') ctx.rotate(Math.random() * Math.PI * 2);
          else ctx.rotate(0);
          ctx.scale(scale, scale);
          ctx.globalAlpha = currentAlpha; 
          ctx.drawImage(texture, -25, -25); 
          ctx.restore();
      }
  };

  const drawVectorLine = (ctx, p1, p2, tool, pressure, controlPoint = null) => {
      let currentSize = tool.size;
      if (tool.pressure) {
          const factor = pressure || 0.5;
          currentSize = Math.max(1, tool.size * (factor * 2)); 
      }
      ctx.lineWidth = currentSize;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      if (controlPoint) ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, p2.x, p2.y);
      else ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
  };

  const drawStroke = (ctx, p1, p2, tool, pressure, isOverlay, controlPoint) => {
      if (tool.type === 'physics') return; // Handled by interval
      
      ctx.lineCap = tool.lineCap;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.shadowBlur = tool.shadow ? tool.shadowBlur : 0;
      ctx.shadowColor = color;
      
      const isTexture = tool.type === 'texture';
      if (!isTexture) {
          ctx.globalCompositeOperation = isOverlay ? 'source-over' : tool.composite;
          ctx.globalAlpha = isOverlay ? 1.0 : tool.alpha;
          drawVectorLine(ctx, p1, p2, tool, pressure, controlPoint);
      } else {
          ctx.globalCompositeOperation = 'source-over'; 
          drawTextureLine(ctx, p1, p2, tool, pressure);
      }
  };

  const drawShape = (ctx, shapeType, start, end, toolId) => {
      let tool = tools[toolId] || tools['PENCIL'];
      const minX = Math.min(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      const isOverlay = ctx.canvas === overlayCanvasRef.current;
      ctx.lineWidth = tool.size;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = isOverlay ? 1.0 : tool.alpha; 
      ctx.lineCap = tool.lineCap;
      ctx.lineJoin = 'round';
      ctx.shadowBlur = tool.shadow ? tool.shadowBlur : 0;
      ctx.shadowColor = color;
      ctx.globalCompositeOperation = isOverlay ? 'source-over' : tool.composite; 
      const isTextured = ['CRAYON', 'CHARCOAL', 'SPRAY', 'PASTEL', 'OIL', 'ACRYLIC', 'SKIN'].includes(tool.id);

      if (shapeType === 'RECT') {
          if (isTextured) {
              drawLine(ctx, {x: minX, y: minY}, {x: minX + w, y: minY}, tool, 0.5, isOverlay);
              drawLine(ctx, {x: minX + w, y: minY}, {x: minX + w, y: minY + h}, tool, 0.5, isOverlay);
              drawLine(ctx, {x: minX + w, y: minY + h}, {x: minX, y: minY + h}, tool, 0.5, isOverlay);
              drawLine(ctx, {x: minX, y: minY + h}, {x: minX, y: minY}, tool, 0.5, isOverlay);
          } else ctx.strokeRect(minX, minY, w, h);
      } else if (shapeType === 'TRIANGLE') {
          const top = { x: minX + w / 2, y: minY };
          const botLeft = { x: minX, y: minY + h };
          const botRight = { x: minX + w, y: minY + h };
          if (isTextured) {
              drawLine(ctx, top, botRight, tool, 0.5, isOverlay);
              drawLine(ctx, botRight, botLeft, tool, 0.5, isOverlay);
              drawLine(ctx, botLeft, top, tool, 0.5, isOverlay);
          } else {
              ctx.beginPath();
              ctx.moveTo(top.x, top.y);
              ctx.lineTo(botRight.x, botRight.y);
              ctx.lineTo(botLeft.x, botLeft.y);
              ctx.closePath();
              ctx.stroke();
          }
      } else if (shapeType === 'LINE') {
          if(isTextured) drawLine(ctx, start, end, tool, 0.5, isOverlay);
          else {
              ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
          }
      } else if (shapeType === 'ELLIPSE') {
          if(isTextured) {
              const circumference = 2 * Math.PI * Math.sqrt((w*w/4 + h*h/4)/2);
              const steps = circumference / 2;
              for(let i=0; i<=steps; i++) {
                  const theta = (i/steps) * Math.PI * 2;
                  drawTextureAt(ctx, minX + w/2 + w/2 * Math.cos(theta), minY + h/2 + h/2 * Math.sin(theta), tool, tool.size);
              }
          } else {
              ctx.beginPath(); ctx.ellipse(minX + w/2, minY + h/2, w/2, h/2, 0, 0, 2*Math.PI); ctx.stroke();
          }
      }
  };

  // Reuse drawLine for shapes
  const drawLine = (ctx, p1, p2, tool, pressure, isOverlay) => {
     if (tool.type === 'vector') drawVectorLine(ctx, p1, p2, tool, pressure);
     else drawTextureLine(ctx, p1, p2, tool, pressure);
  };

  // --- Interaction ---

  const commitStroke = useCallback(() => {
    setIsDrawing(false);
    setSnappedShape(null);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    // Clear Ribbon
    if (ribbonRef.current.active) {
        clearInterval(ribbonRef.current.interval);
        ribbonRef.current.active = false;
    }
    
    const isOverlay = OVERLAY_TOOLS.includes(activeToolId) || activeToolId === 'RIBBON';
    
    if ((isOverlay || mode === 'SHAPE' || snappedShape) && overlayCanvasRef.current && canvasRefs.current[activeLayerId]) {
        const ctx = canvasRefs.current[activeLayerId].getContext('2d', { willReadFrequently: true });
        // Fallback for tools that might be shape-only or missing in map (safety)
        const tool = tools[activeToolId] || tools['PENCIL'];
        if (tool.type === 'vector') {
            ctx.globalAlpha = tool.alpha;
            ctx.globalCompositeOperation = tool.composite;
        } else {
            ctx.globalAlpha = 1.0; 
            ctx.globalCompositeOperation = tool.composite;
        }
        ctx.drawImage(overlayCanvasRef.current, 0, 0);
        const oCtx = overlayCanvasRef.current.getContext('2d', { willReadFrequently: true });
        oCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, [activeToolId, activeLayerId, mode, snappedShape, tools]); 

  const startDrawing = (e) => {
    if (e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches.length > 1) return;
    saveToHistory();
    e.preventDefault(); 
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getCoordinates(e);
    
    if (activeToolId === 'FILL') {
        const canvas = canvasRefs.current[activeLayerId];
        if (canvas) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            floodFill(ctx, x, y, color);
        }
        return; 
    }
    lastPos.current = { x, y };
    lastMidRef.current = { x, y }; 
    startPosRef.current = { x, y };
    pointsRef.current = [{ x, y }];
    setIsDrawing(true);
    setSnappedShape(null);

    // RIBBON Special Handling
    if (activeToolId === 'RIBBON') {
        startRibbon(x, y, tools['RIBBON']);
    }

    const isOverlay = OVERLAY_TOOLS.includes(activeToolId) || activeToolId === 'RIBBON';
    if (isOverlay && overlayCanvasRef.current) {
        const oCtx = overlayCanvasRef.current.getContext('2d', { willReadFrequently: true });
        // Ribbon accumulates, others wipe on start usually if clean stroke, but we use overlay for clean preview
        // Ribbon should NOT clear on start if we want multiple ribbons in one go? No, one stroke.
        // But commit clears it.
        if (activeToolId !== 'RIBBON') { // Ribbon manages its own clear state or accumulates
            oCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
             // Ensure fresh overlay for ribbon
             oCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        
        const tool = tools[activeToolId];
        if (tool && tool.type === 'vector') overlayCanvasRef.current.style.opacity = tool.alpha;
        else overlayCanvasRef.current.style.opacity = 1;
    }

    if (mode === 'BRUSH' && activeToolId !== 'ERASER' && activeToolId !== 'RIBBON') {
       holdTimerRef.current = setTimeout(() => {
          const detected = analyzeShape(pointsRef.current);
          if (detected) {
              setSnappedShape(detected);
              if (navigator.vibrate) navigator.vibrate(50);
          }
       }, 800);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches.length > 1) {
        commitStroke();
        return;
    }
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const pressure = e.pressure !== undefined ? e.pressure : 0.5;
    const activeTool = tools[activeToolId] || tools['PENCIL'];
    const isOverlay = OVERLAY_TOOLS.includes(activeToolId) || activeToolId === 'RIBBON';
    const isShapePreview = mode === 'SHAPE' || snappedShape;
    let targetCanvas = (isShapePreview || isOverlay) ? overlayCanvasRef.current : canvasRefs.current[activeLayerId];
    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });

    // Ribbon updates stored point for physics loop
    if (activeToolId === 'RIBBON') {
        ribbonRef.current.lastPoint = { x, y };
        return; // Ribbon draws via interval
    }

    if (isShapePreview) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (!isOverlay && snapshotRef.current && canvasRefs.current[activeLayerId]) {
             const mainCtx = canvasRefs.current[activeLayerId].getContext('2d', { willReadFrequently: true });
             mainCtx.putImageData(snapshotRef.current, 0, 0);
        }
    }
    if (mode === 'SHAPE') drawShape(ctx, activeToolId, startPosRef.current, {x, y}, 'PENCIL'); 
    else if (snappedShape) drawShape(ctx, snappedShape, startPosRef.current, {x, y}, activeToolId);
    else {
        if (Math.hypot(x - lastPos.current.x, y - lastPos.current.y) > 5) {
            if (holdTimerRef.current) {
                clearTimeout(holdTimerRef.current);
                if (activeToolId !== 'ERASER' && activeToolId !== 'RIBBON') {
                     holdTimerRef.current = setTimeout(() => {
                        const detected = analyzeShape(pointsRef.current);
                        if (detected) {
                            setSnappedShape(detected);
                            if (navigator.vibrate) navigator.vibrate(50);
                        }
                     }, 800);
                }
            }
        }
        pointsRef.current.push({ x, y });
        if (activeTool.type === 'vector') {
            const currentMid = { x: (lastPos.current.x + x) / 2, y: (lastPos.current.y + y) / 2 };
            drawStroke(ctx, lastMidRef.current, currentMid, activeTool, pressure, (targetCanvas === overlayCanvasRef.current), lastPos.current);
            lastMidRef.current = currentMid;
        } else if (activeTool.type === 'special') {
            drawStroke(ctx, lastPos.current, {x, y}, activeTool, pressure, (targetCanvas === overlayCanvasRef.current));
        } else {
            drawStroke(ctx, lastPos.current, {x, y}, activeTool, pressure, (targetCanvas === overlayCanvasRef.current));
        }
        lastPos.current = { x, y };
    }
  };

  const stopDrawing = (e) => {
    if (mode === 'BRUSH' && !snappedShape && isDrawing && tools[activeToolId]?.type === 'vector') {
        const isOverlay = OVERLAY_TOOLS.includes(activeToolId);
        const targetCanvas = isOverlay ? overlayCanvasRef.current : canvasRefs.current[activeLayerId];
        if (targetCanvas) {
            const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
            drawStroke(ctx, lastMidRef.current, lastPos.current, tools[activeToolId], 0.5, isOverlay);
        }
    }
    // Check for single tap with texture brush
    if (mode === 'BRUSH' && !snappedShape && isDrawing && tools[activeToolId]?.type === 'texture') {
        const dist = Math.hypot(lastPos.current.x - startPosRef.current.x, lastPos.current.y - startPosRef.current.y);
        if (dist < 2) { // It's a tap
            const isOverlay = OVERLAY_TOOLS.includes(activeToolId);
            const targetCanvas = isOverlay ? overlayCanvasRef.current : canvasRefs.current[activeLayerId];
            if (targetCanvas) {
                const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
                drawTextureAt(ctx, lastPos.current.x, lastPos.current.y, tools[activeToolId], tools[activeToolId].size);
            }
        }
    }
    
    commitStroke(); 
    if (e.currentTarget && e.pointerId) try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const newScale = Math.min(Math.max(transform.k * (1 - e.deltaY * 0.001), 0.05), 40);
      setTransform(t => ({ ...t, k: newScale }));
    }
  };
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      if (isDrawing) commitStroke();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      gestureRef.current = { startDist: dist, startScale: transform.k, startX: transform.x, startY: transform.y, startCenter: { x: (e.touches[0].clientX+e.touches[1].clientX)/2, y: (e.touches[0].clientY+e.touches[1].clientY)/2 }};
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const currentCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      const { startDist, startScale, startX, startY, startCenter } = gestureRef.current;
      const scale = Math.min(Math.max(startScale * (currentDist / startDist), 0.05), 40);
      const contentPointX = (startCenter.x - startX) / startScale;
      const contentPointY = (startCenter.y - startY) / startScale;
      const newX = currentCenter.x - (contentPointX * scale);
      const newY = currentCenter.y - (contentPointY * scale);
      setTransform({ k: scale, x: newX, y: newY });
    }
  };

 // const downloadImage = () => {
  //   const temp = document.createElement('canvas');
  //   temp.width = CANVAS_WIDTH;
  //   temp.height = CANVAS_HEIGHT;
  //   const tCtx = temp.getContext('2d', { willReadFrequently: true });
  //   tCtx.fillStyle = '#ffffff';
  //   tCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  //   [...layers].reverse().forEach(l => {
  //     if (l.visible && canvasRefs.current[l.id]) tCtx.drawImage(canvasRefs.current[l.id], 0, 0);
  //   });
  //   const link = document.createElement('a');
  //   link.download = 'art.png';
  //   link.href = temp.toDataURL();
  //   link.click();
  // };

  // --- Components ---

  const downloadImage = () => {
    // 1. Create the composite image (same as before)
    const temp = document.createElement('canvas');
    temp.width = CANVAS_WIDTH;
    temp.height = CANVAS_HEIGHT;
    const tCtx = temp.getContext('2d', { willReadFrequently: true });
    
    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    [...layers].reverse().forEach(l => {
      if (l.visible && canvasRefs.current[l.id]) {
        tCtx.drawImage(canvasRefs.current[l.id], 0, 0);
      }
    });

    // 2. Convert to Blob (better for sharing than DataURL)
    temp.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], "drawing.png", { type: "image/png" });

      // 3. Try Native Share (Works best on Telegram Mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'My Drawing',
            text: 'Check out my drawing!',
          });
          return; // Stop here if share was successful
        } catch (error) {
          console.log('Share canceled or failed', error);
          // If share fails, fall through to the download method below
        }
      }

      // 4. Fallback for Desktop / Web Browsers
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'drawing.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };


  const SettingsPanel = () => {
    const tool = tools[activeToolId];
    if (!tool) return null;
    return (
      <div className="absolute left-12 md:left-20 top-12 bottom-14 w-64 bg-neutral-800 border-r border-neutral-700 p-4 overflow-y-auto z-50 shadow-2xl flex flex-col gap-6 slide-in-from-left">
         <div className="flex items-center justify-between"><h2 className="font-bold text-white text-sm flex items-center gap-2"><Settings className="w-4 h-4" />{tool.label} Settings</h2><button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button></div>
         <div className="space-y-4">
            <div className="space-y-1"><div className="flex justify-between text-xs text-neutral-400"><span>Size</span><span>{tool.size}px</span></div><input type="range" min="0.1" max="1000" step="0.1" value={tool.size} onChange={(e) => updateToolSettings('size', parseFloat(e.target.value))} className="w-full accent-indigo-500"/></div>
            <div className="space-y-1"><div className="flex justify-between text-xs text-neutral-400"><span>Opacity</span><span>{Math.round(tool.alpha * 100)}%</span></div><input type="range" min="0" max="100" value={tool.alpha * 100} onChange={(e) => updateToolSettings('alpha', parseInt(e.target.value)/100)} className="w-full accent-indigo-500"/></div>
         </div>
         {tool.type === 'texture' && (
             <div className="space-y-4">
                <div className="h-px bg-neutral-700" />
                <div className="space-y-1"><div className="flex justify-between text-xs text-neutral-400"><span>Density</span><span>{Math.round(tool.density * 100) || 20}%</span></div><input type="range" min="0.01" max="1" step="0.01" value={tool.density || 0.2} onChange={(e) => updateToolSettings('density', parseFloat(e.target.value))} className="w-full accent-indigo-500"/></div>
                <div className="space-y-1"><div className="flex justify-between text-xs text-neutral-400"><span>Scatter</span><span>{tool.scatter || 0}</span></div><input type="range" min="0" max="50" value={tool.scatter || 0} onChange={(e) => updateToolSettings('scatter', parseInt(e.target.value))} className="w-full accent-indigo-500"/></div>
             </div>
         )}
         <div className="h-px bg-neutral-700" />
         <div className="space-y-4">
             <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer"><span>Pressure Sensitivity</span><input type="checkbox" checked={tool.pressure} onChange={(e) => updateToolSettings('pressure', e.target.checked)} className="accent-indigo-500"/></label>
             <div className="space-y-1"><div className="flex justify-between text-xs text-neutral-400"><span>Smoothing</span><span>{Math.round(tool.smoothing * 100)}%</span></div><input type="range" min="0" max="100" value={tool.smoothing * 100} onChange={(e) => updateToolSettings('smoothing', parseInt(e.target.value)/100)} className="w-full accent-indigo-500"/></div>
         </div>
         {tool.type === 'vector' && (
             <>
                <div className="h-px bg-neutral-700" />
                <div className="space-y-4">
                    <div className="space-y-1"><span className="text-xs text-neutral-400">Line Cap</span><div className="flex bg-neutral-700 rounded p-1">{['round', 'square', 'butt'].map(c => (<button key={c} onClick={() => updateToolSettings('lineCap', c)} className={`flex-1 text-[10px] py-1 rounded capitalize ${tool.lineCap === c ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}>{c}</button>))}</div></div>
                </div>
             </>
         )}
      </div>
    );
  };

  const LayerSettingsPanel = () => {
      const layer = layers.find(l => l.id === activeLayerId);
      if (!layer) return null;
      return (
          <div className="flex flex-col h-full">
              <div className="p-4 border-b border-neutral-700 flex items-center justify-between bg-neutral-800">
                  <div className="flex items-center gap-2">
                      <button onClick={() => setShowLayerSettings(false)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
                      <span className="font-bold text-sm text-white">Layer Properties</span>
                  </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-6">
                  <div className="space-y-2">
                      <div className="flex justify-between text-xs text-neutral-400"><span>Opacity</span><span>{Math.round(layer.opacity * 100)}%</span></div>
                      <input type="range" min="0" max="100" value={layer.opacity * 100} onChange={(e) => updateLayer(layer.id, 'opacity', parseInt(e.target.value)/100)} className="w-full accent-indigo-500" />
                  </div>
                  <div className="space-y-2">
                      <span className="text-xs text-neutral-400">Blending Mode</span>
                      <select value={layer.blendMode} onChange={(e) => updateLayer(layer.id, 'blendMode', e.target.value)} className="w-full bg-neutral-700 text-xs text-white p-2 rounded border border-neutral-600 outline-none capitalize">
                          <option value="normal">Normal</option>
                          {BLENDING_MODES.map(m => <option key={m} value={m}>{m.replace('-', ' ')}</option>)}
                      </select>
                  </div>
                  <div className="h-px bg-neutral-700" />
                  <div className="space-y-4">
                      <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                          <span>Drop Shadow</span>
                          <input type="checkbox" checked={layer.shadow} onChange={(e) => updateLayer(layer.id, 'shadow', e.target.checked)} className="accent-indigo-500" />
                      </label>
                      {layer.shadow && (
                          <div className="space-y-3 pl-2 border-l-2 border-neutral-700">
                              <div className="flex items-center gap-2">
                                  <input type="color" value={layer.shadowColor} onChange={(e) => updateLayer(layer.id, 'shadowColor', e.target.value)} className="w-6 h-6 rounded border-none p-0 bg-transparent" />
                                  <span className="text-xs text-neutral-400">Color</span>
                              </div>
                              <div className="space-y-1"><div className="flex justify-between text-xs text-neutral-500"><span>Blur</span><span>{layer.shadowBlur}px</span></div><input type="range" min="0" max="50" value={layer.shadowBlur} onChange={(e) => updateLayer(layer.id, 'shadowBlur', parseInt(e.target.value))} className="w-full accent-indigo-500 h-1" /></div>
                              <div className="space-y-1"><div className="flex justify-between text-xs text-neutral-500"><span>Offset X</span><span>{layer.shadowX}px</span></div><input type="range" min="-50" max="50" value={layer.shadowX} onChange={(e) => updateLayer(layer.id, 'shadowX', parseInt(e.target.value))} className="w-full accent-indigo-500 h-1" /></div>
                              <div className="space-y-1"><div className="flex justify-between text-xs text-neutral-500"><span>Offset Y</span><span>{layer.shadowY}px</span></div><input type="range" min="-50" max="50" value={layer.shadowY} onChange={(e) => updateLayer(layer.id, 'shadowY', parseInt(e.target.value))} className="w-full accent-indigo-500 h-1" /></div>
                          </div>
                      )}
                  </div>
                  <div className="h-px bg-neutral-700" />
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => fillLayer(layer.id)} className="flex items-center justify-center gap-2 p-2 bg-neutral-700 hover:bg-neutral-600 rounded text-xs text-white"><PaintBucket className="w-3 h-3"/> Fill Layer</button>
                      <button onClick={() => clearLayer(layer.id)} className="flex items-center justify-center gap-2 p-2 bg-red-900/50 hover:bg-red-900/70 text-red-200 rounded text-xs"><Trash2 className="w-3 h-3"/> Clear Layer</button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-200 overflow-hidden font-sans select-none touch-none">
      {showUI && (
        <header className="h-12 bg-neutral-900/90 backdrop-blur flex items-center justify-center border-b border-neutral-700 z-50 shrink-0 pt-2">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1 rounded"><Palette className="w-3 h-3 text-white" /></div>
            <span className="font-bold text-xs text-white tracking-wide">LAYERPAINT</span>
          </div>
        </header>
      )}
      {!showUI && (<button onClick={() => setShowUI(true)} className="absolute top-4 right-16 z-50 p-3 bg-neutral-800/90 backdrop-blur rounded-full text-white shadow-lg hover:bg-neutral-700 transition-all"><Minimize className="w-6 h-6" /></button>)}

      <div className="flex flex-1 overflow-hidden relative">
        <div className={`absolute left-0 top-0 bottom-0 w-14 md:w-20 bg-neutral-800 border-r border-neutral-700 flex flex-col items-center py-4 gap-4 overflow-y-auto z-40 custom-scrollbar shadow-xl transition-transform duration-300 ease-in-out ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col gap-1 w-full px-1">
            {Object.values(tools).map((t) => (
              <button key={t.id} onClick={() => { setMode('BRUSH'); setActiveToolId(t.id); }} className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all group relative ${mode === 'BRUSH' && activeToolId === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>
                <t.icon className="w-5 h-5 md:w-5 md:h-5" />
                <span className="text-[9px] mt-0.5 hidden md:block">{t.label}</span>
                {mode === 'BRUSH' && activeToolId === t.id && activeToolId !== 'FILL' && (<div onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className="absolute -right-1 -top-1 bg-white text-indigo-600 rounded-full p-0.5 shadow cursor-pointer hover:scale-110 transition-transform"><Settings className="w-3 h-3" /></div>)}
              </button>
            ))}
          </div>
          <div className="w-8 h-px bg-neutral-700 shrink-0"></div>
          <div className="flex flex-col gap-1 w-full px-1">
            {Object.values(SHAPE_TOOLS).map((t) => (
              <button key={t.id} onClick={() => { setMode('SHAPE'); setActiveToolId(t.id); }} className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${mode === 'SHAPE' && activeToolId === t.id ? 'bg-teal-600 text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>
                <t.icon className="w-5 h-5" /><span className="text-[9px] mt-0.5 hidden md:block">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="w-8 h-px bg-neutral-700 shrink-0"></div>
          <div className="flex flex-col gap-3 w-full px-2 items-center pb-20"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-neutral-600 cursor-pointer p-0"/></div>
        </div>

        {showSettings && <SettingsPanel />}

        <div ref={workspaceRef} className="flex-1 bg-neutral-900 overflow-hidden relative cursor-crosshair z-0" onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
          <div className="w-full h-full flex items-center justify-center origin-top-left">
            <div ref={containerRef} className="absolute top-0 left-0 origin-top-left shadow-2xl bg-white bg-opacity-5" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`, backgroundImage: 'linear-gradient(45deg, #262626 25%, transparent 25%), linear-gradient(-45deg, #262626 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #262626 75%), linear-gradient(-45deg, transparent 75%, #262626 75%)', backgroundSize: '100px 100px', backgroundPosition: '0 0, 0 50px, 50px -50px, -50px 0px' }} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing}>
                {[...layers].reverse().map((layer) => (
                    <canvas 
                        key={layer.id} 
                        ref={(el) => canvasRefs.current[layer.id] = el} 
                        width={CANVAS_WIDTH} 
                        height={CANVAS_HEIGHT} 
                        className="absolute top-0 left-0 pointer-events-none transition-opacity duration-200" 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            zIndex: layer.id,
                            opacity: layer.visible ? (layer.opacity ?? 1) : 0,
                            mixBlendMode: layer.blendMode ?? 'normal',
                            filter: layer.shadow ? `drop-shadow(${layer.shadowX}px ${layer.shadowY}px ${layer.shadowBlur}px ${layer.shadowColor})` : 'none'
                        }} 
                    />
                ))}
                <canvas ref={overlayCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute top-0 left-0 pointer-events-none z-50" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none z-30">{snappedShape && (<div className="bg-indigo-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">Snapped: {snappedShape}</div>)}</div>
        </div>

        <div className={`absolute right-0 top-0 bottom-0 w-64 bg-neutral-800 border-l border-neutral-700 flex flex-col z-40 shadow-xl transition-transform duration-300 ease-in-out ${showRightPanel ? 'translate-x-0' : 'translate-x-full'}`}>
          {showLayerSettings ? <LayerSettingsPanel /> : (
              <>
                <div className="p-4 border-b border-neutral-700 flex items-center justify-between"><h2 className="font-semibold flex items-center gap-2 text-sm text-neutral-300"><Layers className="w-4 h-4" />Layers</h2><button onClick={() => { const newId = `layer-${Date.now()}`; setLayers([{ id: newId, name: `Layer ${layers.length + 1}`, visible: true, opacity: 1, blendMode: 'normal', shadow: false, shadowColor: '#000000', shadowBlur: 10, shadowX: 0, shadowY: 5 }, ...layers]); setActiveLayerId(newId); }} className="p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded"><Plus className="w-4 h-4" /></button></div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 pb-20">
                    {layers.map((layer, i) => (
                        <div key={layer.id} onClick={() => setActiveLayerId(layer.id)} className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none ${activeLayerId === layer.id ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-neutral-700/20 border-transparent'}`}>
                            <button onClick={(e) => { e.stopPropagation(); setLayers(layers.map(l => l.id === layer.id ? {...l, visible: !l.visible} : l)) }} className="text-neutral-400 hover:text-white">{layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                            <span className={`flex-1 text-xs truncate ${activeLayerId === layer.id ? 'text-indigo-200' : 'text-neutral-400'}`}>{layer.name}</span>
                            {activeLayerId === layer.id && (
                                <button onClick={(e) => { e.stopPropagation(); setShowLayerSettings(true); }} className="text-indigo-400 hover:text-white p-1"><Sliders className="w-3.5 h-3.5" /></button>
                            )}
                            <button onClick={(e) => { if (layers.length <= 1) return; e.stopPropagation(); const n = layers.filter(l => l.id !== layer.id); setLayers(n); if (activeLayerId === layer.id) setActiveLayerId(n[0].id); }} className="text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    ))}
                </div>
              </>
          )}
        </div>
      </div>

      <div className="h-14 bg-neutral-800 border-t border-neutral-700 flex items-center justify-between px-4 pb-safe z-50 shadow-2xl shrink-0 relative">
          <div className="flex items-center gap-2"><button onClick={() => setShowLeftPanel(!showLeftPanel)} className={`p-2 rounded-md transition-colors ${showLeftPanel ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}><PanelLeft className="w-5 h-5" /></button><div className="h-6 w-px bg-neutral-600 mx-1"></div><button onClick={undo} disabled={history.length === 0} className="p-2 text-neutral-300 hover:text-white disabled:opacity-30 active:scale-95 transition-transform"><Undo className="w-5 h-5" /></button></div>
          <button onClick={fitCanvasToScreen} className="absolute left-1/2 -translate-x-1/2 -top-6 p-3 bg-neutral-700 hover:bg-neutral-600 rounded-full text-white shadow-lg border-4 border-neutral-800"><Scan className="w-6 h-6" /></button>
          <div className="flex items-center gap-2"><button onClick={downloadImage} className="p-2 text-neutral-400 hover:text-white"><Download className="w-5 h-5" /></button><div className="h-6 w-px bg-neutral-600 mx-1"></div><button onClick={() => setShowRightPanel(!showRightPanel)} className={`p-2 rounded-md transition-colors ${showRightPanel ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}><PanelRight className="w-5 h-5" /></button></div>
      </div>
    </div>
  );
}