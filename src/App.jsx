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
  PaintBucket // Added PaintBucket icon
} from 'lucide-react';

// Customized Resolution
const CANVAS_WIDTH = 1135;
const CANVAS_HEIGHT = 1200;

// --- Initial Configuration ---

const BLENDING_MODES = [
  'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'
];

const INITIAL_TOOLS = {
  PENCIL: { 
    id: 'PENCIL', icon: PenTool, label: 'Pencil', 
    size: 3, alpha: 1, composite: 'source-over', 
    smoothing: 0, pressure: true, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  INK: { 
    id: 'INK', icon: Pen, label: 'Ink Pen', 
    size: 4, alpha: 1, composite: 'source-over', 
    smoothing: 0.5, pressure: true, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  BRUSH: { 
    id: 'BRUSH', icon: Paintbrush, label: 'Brush', 
    size: 12, alpha: 1, composite: 'source-over', 
    smoothing: 0.2, pressure: true, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  WATERCOLOR: { 
    id: 'WATERCOLOR', icon: Droplet, label: 'Watercolor', 
    size: 25, alpha: 0.4, composite: 'multiply', 
    smoothing: 0.1, pressure: true, shadow: true, shadowBlur: 15, lineCap: 'round' 
  },
  CRAYON: { 
    id: 'CRAYON', icon: Edit3, label: 'Crayon', 
    size: 15, alpha: 1, composite: 'source-over', 
    smoothing: 0, pressure: false, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  CHARCOAL: { 
    id: 'CHARCOAL', icon: Feather, label: 'Charcoal', 
    size: 20, alpha: 0.8, composite: 'source-over', 
    smoothing: 0, pressure: true, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  MARKER: { 
    id: 'MARKER', icon: Highlighter, label: 'Marker', 
    size: 15, alpha: 0.5, composite: 'multiply', 
    smoothing: 0.1, pressure: false, shadow: false, shadowBlur: 0, lineCap: 'square' 
  },
  SPRAY: { 
    id: 'SPRAY', icon: SprayCan, label: 'Spray', 
    size: 50, alpha: 1, composite: 'source-over', 
    smoothing: 0, pressure: true, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  FILL: { 
    id: 'FILL', icon: PaintBucket, label: 'Fill', 
    size: 0, alpha: 1, composite: 'source-over', 
    smoothing: 0, pressure: false, shadow: false, shadowBlur: 0, lineCap: 'round' 
  },
  ERASER: { 
    id: 'ERASER', icon: Eraser, label: 'Eraser', 
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

const OVERLAY_TOOLS = ['PENCIL', 'INK', 'BRUSH', 'MARKER', 'WATERCOLOR'];

export default function App() {
  // --- State ---
  const [layers, setLayers] = useState([
    { id: 'layer-1', name: 'Background', visible: true, locked: false }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-1');
  
  // Tool State
  const [tools, setTools] = useState(INITIAL_TOOLS);
  const [mode, setMode] = useState('BRUSH'); 
  const [activeToolId, setActiveToolId] = useState('PENCIL');
  const [color, setColor] = useState('#000000');
  
  // UI State
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Transform State: Default to centered 0.25 scale to ensure visibility if calculation fails
  const [transform, setTransform] = useState({ x: 100, y: 100, k: 0.25 }); 
  
  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [snappedShape, setSnappedShape] = useState(null); 
  const [history, setHistory] = useState([]);

  // --- Refs ---
  const canvasRefs = useRef({});
  const overlayCanvasRef = useRef(null); 
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);
  
  // Drawing Refs
  const lastPos = useRef({ x: 0, y: 0 });
  const lastMidRef = useRef({ x: 0, y: 0 }); 
  const startPosRef = useRef({ x: 0, y: 0 });
  const pointsRef = useRef([]); 
  const holdTimerRef = useRef(null);
  const snapshotRef = useRef(null);
  const gestureRef = useRef({ startDist: 0, startScale: 1, startX: 0, startY: 0, startCenter: { x: 0, y: 0 } });

  // --- Initialization ---

  useEffect(() => {
    const bgCanvas = canvasRefs.current['layer-1'];
    if (bgCanvas) {
      const ctx = bgCanvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    // Force a fit after a brief delay
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


  // --- Tool Settings ---
  const updateToolSettings = (key, value) => {
    setTools(prev => ({
      ...prev,
      [activeToolId]: {
        ...prev[activeToolId],
        [key]: value
      }
    }));
  };

  // --- Undo System ---
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
    } catch (e) {
        console.error("Undo save failed", e);
    }
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

  // --- Helpers ---
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

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    
    let deviationSum = 0;
    points.forEach(p => {
        const val = Math.pow(p.x - centerX, 2) / Math.pow(radiusX, 2) + Math.pow(p.y - centerY, 2) / Math.pow(radiusY, 2);
        deviationSum += Math.abs(1 - val);
    });
    const avgDeviation = deviationSum / points.length;
    
    if (avgDeviation < 0.25) return 'ELLIPSE';

    const threshold = Math.min(width, height) * 0.25;
    const corners = [{x: minX, y: minY}, {x: maxX, y: minY}, {x: maxX, y: maxY}, {x: minX, y: maxY}];
    let cornersVisited = 0;
    corners.forEach(c => {
       if (points.some(p => Math.hypot(p.x - c.x, p.y - c.y) < threshold)) cornersVisited++;
    });
    
    if (cornersVisited >= 3) return 'RECT';
    return null;
  };

  // --- Flood Fill Algorithm ---
  const floodFill = (ctx, startX, startY, fillColor) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    
    // Get pixel data
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    
    // Helper to get pixel index
    const getPixelIndex = (x, y) => (y * w + x) * 4;
    
    // Parse fill color from hex
    const r = parseInt(fillColor.slice(1, 3), 16);
    const g = parseInt(fillColor.slice(3, 5), 16);
    const b = parseInt(fillColor.slice(5, 7), 16);
    const a = 255; // Full opacity for fill

    // Get starting pixel color
    const startIdx = getPixelIndex(Math.floor(startX), Math.floor(startY));
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];

    // If filling with same color, return
    if (startR === r && startG === g && startB === b && startA === a) return;

    // Match function
    const matchStartColor = (idx) => {
      return data[idx] === startR &&
             data[idx + 1] === startG &&
             data[idx + 2] === startB &&
             data[idx + 3] === startA;
    };

    // Color function
    const colorPixel = (idx) => {
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    };

    // Stack-based flood fill
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

  // --- Rendering Helpers ---

  const drawTextureAt = (ctx, x, y, tool, size) => {
     ctx.beginPath();
     if (tool.id === 'SPRAY') {
        const density = size * 2;
        for (let i = 0; i < density; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * size * 2;
          ctx.rect(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 1, 1);
        }
     } else {
        const spread = size * 0.6;
        const offsetX = (Math.random() - 0.5) * spread;
        const offsetY = (Math.random() - 0.5) * spread;
        const pSize = tool.id === 'CRAYON' ? 2 : 1.5; 
        ctx.arc(x + offsetX, y + offsetY, pSize / 2, 0, Math.PI * 2);
     }
     ctx.fill();
  };

  const drawLine = (ctx, p1, p2, tool, pressure, isOverlay, controlPoint = null) => {
      const isTextured = ['CRAYON', 'CHARCOAL', 'SPRAY'].includes(tool.id);
      
      let currentSize = tool.size;
      let currentAlpha = isOverlay ? 1.0 : tool.alpha; 
      
      if (tool.pressure) {
          const factor = pressure || 0.5;
          currentSize = Math.max(1, tool.size * (factor * 2)); 
          if (!isOverlay && (tool.id === 'WATERCOLOR' || tool.id === 'CHARCOAL')) {
              currentAlpha = Math.min(1, tool.alpha * (factor * 1.5));
          }
      }

      ctx.globalAlpha = currentAlpha;
      ctx.lineWidth = currentSize;

      if (isTextured) {
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const step = tool.id === 'CHARCOAL' ? 2 : (tool.id === 'SPRAY' ? currentSize/2 : 4);
          for (let i = 0; i < dist; i += step) {
            drawTextureAt(ctx, p1.x + Math.cos(angle) * i, p1.y + Math.sin(angle) * i, tool, currentSize);
          }
      } else {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          if (controlPoint) {
              ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, p2.x, p2.y);
          } else {
              ctx.lineTo(p2.x, p2.y);
          }
          ctx.stroke();
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

      const isTextured = ['CRAYON', 'CHARCOAL', 'SPRAY'].includes(tool.id);

      if (shapeType === 'RECT') {
          if (isTextured) {
              drawLine(ctx, {x: minX, y: minY}, {x: minX + w, y: minY}, tool, 0.5, isOverlay);
              drawLine(ctx, {x: minX + w, y: minY}, {x: minX + w, y: minY + h}, tool, 0.5, isOverlay);
              drawLine(ctx, {x: minX + w, y: minY + h}, {x: minX, y: minY + h}, tool, 0.5, isOverlay);
              drawLine(ctx, {x: minX, y: minY + h}, {x: minX, y: minY}, tool, 0.5, isOverlay);
          } else {
              ctx.strokeRect(minX, minY, w, h);
          }
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
          drawLine(ctx, start, end, tool, 0.5, isOverlay);
      } else if (shapeType === 'ELLIPSE') {
          const rx = w / 2;
          const ry = h / 2;
          const cx = minX + rx;
          const cy = minY + ry;
          if (isTextured) {
              const circumference = 2 * Math.PI * Math.sqrt((rx*rx + ry*ry)/2);
              const step = 2; 
              const steps = circumference / step;
              for(let i=0; i<=steps; i++) {
                  const theta = (i/steps) * Math.PI * 2;
                  const px = cx + rx * Math.cos(theta);
                  const py = cy + ry * Math.sin(theta);
                  drawTextureAt(ctx, px, py, tool, tool.size);
              }
          } else {
              ctx.beginPath();
              ctx.ellipse(cx, cy, rx, ry, 0, 0, 2*Math.PI);
              ctx.stroke();
          }
      }
  };

  // --- Interaction Handlers ---

  const commitStroke = useCallback(() => {
    setIsDrawing(false);
    setSnappedShape(null);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    
    const isOverlay = OVERLAY_TOOLS.includes(activeToolId);
    
    if ((isOverlay || mode === 'SHAPE' || snappedShape) && overlayCanvasRef.current && canvasRefs.current[activeLayerId]) {
        const ctx = canvasRefs.current[activeLayerId].getContext('2d', { willReadFrequently: true });
        
        // SAFEGUARD: If mode is SHAPE, activeToolId might be 'RECT', which isn't in tools.
        // Fallback to PENCIL settings in that case to avoid crash.
        const tool = tools[activeToolId] || tools['PENCIL'];
        
        if (tool) {
            ctx.globalAlpha = tool.alpha;
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
    
    // === FILL TOOL LOGIC ===
    if (activeToolId === 'FILL') {
        const canvas = canvasRefs.current[activeLayerId];
        if (canvas) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            floodFill(ctx, x, y, color);
        }
        return; // Return early, no stroke handling needed
    }

    lastPos.current = { x, y };
    lastMidRef.current = { x, y }; 
    startPosRef.current = { x, y };
    pointsRef.current = [{ x, y }];
    setIsDrawing(true);
    setSnappedShape(null);

    const isOverlay = OVERLAY_TOOLS.includes(activeToolId);
    if (isOverlay && overlayCanvasRef.current) {
        const oCtx = overlayCanvasRef.current.getContext('2d', { willReadFrequently: true });
        oCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const tool = tools[activeToolId];
        // Safety check for tool existence
        if (tool) {
            overlayCanvasRef.current.style.opacity = tool.alpha;
            overlayCanvasRef.current.style.mixBlendMode = tool.composite === 'source-over' ? 'normal' : tool.composite;
        }
    }

    if (mode === 'BRUSH') {
       if (activeToolId !== 'ERASER') {
         holdTimerRef.current = setTimeout(() => {
            const detected = analyzeShape(pointsRef.current);
            if (detected) {
                setSnappedShape(detected);
                if (navigator.vibrate) navigator.vibrate(50);
            }
         }, 800);
       }
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
    
    const isOverlay = OVERLAY_TOOLS.includes(activeToolId);
    const isShapePreview = mode === 'SHAPE' || snappedShape;
    
    let targetCanvas;

    if (isShapePreview) {
        targetCanvas = overlayCanvasRef.current;
        const oCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
        oCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (!isOverlay && snapshotRef.current && canvasRefs.current[activeLayerId]) {
             const mainCtx = canvasRefs.current[activeLayerId].getContext('2d', { willReadFrequently: true });
             mainCtx.putImageData(snapshotRef.current, 0, 0);
        }
    } else if (isOverlay) {
        targetCanvas = overlayCanvasRef.current;
    } else {
        targetCanvas = canvasRefs.current[activeLayerId];
    }
    
    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });

    ctx.lineCap = activeTool.lineCap;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowBlur = activeTool.shadow ? activeTool.shadowBlur : 0;
    ctx.shadowColor = color;
    
    ctx.globalCompositeOperation = (targetCanvas === overlayCanvasRef.current) ? 'source-over' : activeTool.composite;
    ctx.globalAlpha = (targetCanvas === overlayCanvasRef.current) ? 1.0 : activeTool.alpha; 

    if (mode === 'SHAPE') {
        drawShape(ctx, activeToolId, startPosRef.current, {x, y}, 'PENCIL'); 
    } 
    else if (snappedShape) {
        drawShape(ctx, snappedShape, startPosRef.current, {x, y}, activeToolId);
    } 
    else {
        if (Math.hypot(x - lastPos.current.x, y - lastPos.current.y) > 5) {
            if (holdTimerRef.current) {
                clearTimeout(holdTimerRef.current);
                if (activeToolId !== 'ERASER') {
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
        
        const currentMid = {
            x: (lastPos.current.x + x) / 2,
            y: (lastPos.current.y + y) / 2
        };
        
        drawLine(
            ctx, 
            lastMidRef.current, 
            currentMid,         
            activeTool, 
            pressure, 
            (targetCanvas === overlayCanvasRef.current),
            lastPos.current     
        );

        lastMidRef.current = currentMid;
        lastPos.current = { x, y };
    }
  };

  const stopDrawing = (e) => {
    if (mode === 'BRUSH' && !snappedShape && isDrawing) {
        const isOverlay = OVERLAY_TOOLS.includes(activeToolId);
        const targetCanvas = isOverlay ? overlayCanvasRef.current : canvasRefs.current[activeLayerId];
        
        // Safe access to active tool
        const activeTool = tools[activeToolId];
        
        if (targetCanvas && activeTool) {
            const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
            
            ctx.lineCap = activeTool.lineCap;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;
            ctx.lineWidth = activeTool.size; 
            ctx.globalCompositeOperation = isOverlay ? 'source-over' : activeTool.composite;
            ctx.globalAlpha = isOverlay ? 1.0 : activeTool.alpha; 
            
            const dist = Math.hypot(lastPos.current.x - lastMidRef.current.x, lastPos.current.y - lastMidRef.current.y);
            const isTextured = ['CRAYON', 'CHARCOAL', 'SPRAY'].includes(activeTool.id);

            if (dist < 1) {
                // === Handle Taps ===
                if (isTextured) {
                    drawTextureAt(ctx, lastPos.current.x, lastPos.current.y, activeTool, activeTool.size);
                } else {
                    ctx.beginPath();
                    ctx.fillStyle = color;
                    ctx.arc(lastPos.current.x, lastPos.current.y, activeTool.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // === Handle Line End (Texture aware) ===
                if (isTextured) {
                    // Draw final textured segment from lastMid to lastPos
                    // We explicitly call drawLine for the segment
                    drawLine(ctx, lastMidRef.current, lastPos.current, activeTool, 0.5, isOverlay);
                } else {
                    // Standard smooth finish
                    ctx.beginPath();
                    ctx.moveTo(lastMidRef.current.x, lastMidRef.current.y);
                    ctx.lineTo(lastPos.current.x, lastPos.current.y);
                    ctx.stroke();
                }
            }
        }
    }

    commitStroke(); 
    
    if (e.currentTarget && e.pointerId) {
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  };

  // --- Zoom Logic ---
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Updated limit: Max 40x zoom
      const newScale = Math.min(Math.max(transform.k * (1 - e.deltaY * 0.001), 0.05), 40);
      setTransform(t => ({ ...t, k: newScale }));
    }
  };
  
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      if (isDrawing) {
          commitStroke();
      }
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
      // Updated limit: Max 40x zoom
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
      <div className="absolute left-20 top-0 bottom-0 w-64 bg-neutral-800 border-r border-neutral-700 p-4 overflow-y-auto z-20 shadow-2xl flex flex-col gap-6 slide-in-from-left">
         <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
               <Settings className="w-4 h-4" />
               {tool.label} Settings
            </h2>
            <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white">
               <X className="w-4 h-4" />
            </button>
         </div>

         {/* Size & Opacity */}
         <div className="space-y-4">
            <div className="space-y-1">
               <div className="flex justify-between text-xs text-neutral-400">
                  <span>Size</span>
                  <span>{tool.size}px</span>
               </div>
               <input 
                  type="range" min="0.1" max="1000" step="0.1"
                  value={tool.size} 
                  onChange={(e) => updateToolSettings('size', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
               />
            </div>
            <div className="space-y-1">
               <div className="flex justify-between text-xs text-neutral-400">
                  <span>Opacity</span>
                  <span>{Math.round(tool.alpha * 100)}%</span>
               </div>
               <input 
                  type="range" min="0" max="100" 
                  value={tool.alpha * 100} 
                  onChange={(e) => updateToolSettings('alpha', parseInt(e.target.value)/100)}
                  className="w-full accent-indigo-500"
               />
            </div>
         </div>

         <div className="h-px bg-neutral-700" />

         {/* Dynamics */}
         <div className="space-y-4">
             <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                <span>Pressure Sensitivity</span>
                <input 
                  type="checkbox" 
                  checked={tool.pressure} 
                  onChange={(e) => updateToolSettings('pressure', e.target.checked)}
                  className="accent-indigo-500"
                />
             </label>
             
             <div className="space-y-1">
               <div className="flex justify-between text-xs text-neutral-400">
                  <span>Smoothing</span>
                  <span>{Math.round(tool.smoothing * 100)}%</span>
               </div>
               <input 
                  type="range" min="0" max="100" 
                  value={tool.smoothing * 100} 
                  onChange={(e) => updateToolSettings('smoothing', parseInt(e.target.value)/100)}
                  className="w-full accent-indigo-500"
               />
            </div>
         </div>

         <div className="h-px bg-neutral-700" />

         {/* Styling */}
         <div className="space-y-4">
             <div className="space-y-1">
                <span className="text-xs text-neutral-400">Blending Mode</span>
                <select 
                   value={tool.composite}
                   onChange={(e) => updateToolSettings('composite', e.target.value)}
                   className="w-full bg-neutral-700 text-xs text-white p-2 rounded border border-neutral-600 outline-none"
                >
                   {BLENDING_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                   ))}
                </select>
             </div>

             <div className="space-y-1">
                <span className="text-xs text-neutral-400">Line Cap</span>
                <div className="flex bg-neutral-700 rounded p-1">
                   {['round', 'square', 'butt'].map(c => (
                      <button 
                        key={c}
                        onClick={() => updateToolSettings('lineCap', c)}
                        className={`flex-1 text-[10px] py-1 rounded capitalize ${tool.lineCap === c ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                      >
                         {c}
                      </button>
                   ))}
                </div>
             </div>
         </div>

         <div className="h-px bg-neutral-700" />

         {/* Effects */}
         <div className="space-y-4">
             <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                <span>Enable Shadow</span>
                <input 
                  type="checkbox" 
                  checked={tool.shadow} 
                  onChange={(e) => updateToolSettings('shadow', e.target.checked)}
                  className="accent-indigo-500"
                />
             </label>
             
             {tool.shadow && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-neutral-400">
                      <span>Shadow Blur</span>
                      <span>{tool.shadowBlur}px</span>
                  </div>
                  <input 
                      type="range" min="0" max="50" 
                      value={tool.shadowBlur} 
                      onChange={(e) => updateToolSettings('shadowBlur', parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                  />
                </div>
             )}
         </div>

      </div>
    );
  };

  // --- Render ---

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-200 overflow-hidden font-sans select-none touch-none">
      
      {showUI && (
        <header className="h-14 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-4 shrink-0 z-30 transition-all">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg text-white hidden sm:block">LayerPaint</h1>
            
            <div className="h-6 w-px bg-neutral-600 mx-2"></div>
            <button 
              onClick={undo}
              disabled={history.length === 0}
              className="flex items-center gap-1 text-neutral-300 hover:text-white disabled:opacity-30 active:scale-95 transition-transform"
            >
              <Undo className="w-5 h-5" />
              <span className="text-xs">Undo</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fitCanvasToScreen}
              className="p-2 hover:bg-neutral-700 rounded-md text-neutral-400 hover:text-white"
              title="Recenter Canvas"
            >
              <Scan className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowUI(false)}
              className="p-2 hover:bg-neutral-700 rounded-md text-neutral-400 hover:text-white"
              title="Fullscreen Mode"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button 
              onClick={downloadImage}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </header>
      )}

      {!showUI && (
        <button 
          onClick={() => setShowUI(true)}
          className="absolute top-4 right-4 z-50 p-3 bg-neutral-800/90 backdrop-blur rounded-full text-white shadow-lg hover:bg-neutral-700 transition-all"
        >
          <Minimize className="w-6 h-6" />
        </button>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- Left Toolbar --- */}
        <div className={`
            bg-neutral-800 border-r border-neutral-700 flex flex-col items-center py-4 gap-4 overflow-y-auto z-20 custom-scrollbar shadow-xl transition-all duration-300
            ${showUI ? 'w-20 translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'}
        `}>
          
          <div className="flex flex-col gap-1 w-full px-2">
            <span className="text-[10px] text-neutral-500 font-bold uppercase text-center mb-1">Brushes</span>
            {Object.values(tools).map((t) => (
              <button
                key={t.id}
                onClick={() => { setMode('BRUSH'); setActiveToolId(t.id); }}
                className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all group relative ${
                  mode === 'BRUSH' && activeToolId === t.id
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-[9px] mt-0.5">{t.label}</span>
                {mode === 'BRUSH' && activeToolId === t.id && (
                    <div onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className="absolute -right-1 -top-1 bg-white text-indigo-600 rounded-full p-0.5 shadow cursor-pointer hover:scale-110 transition-transform">
                        <Settings className="w-3 h-3" />
                    </div>
                )}
              </button>
            ))}
          </div>

          <div className="w-10 h-px bg-neutral-700 shrink-0"></div>

          <div className="flex flex-col gap-1 w-full px-2">
            <span className="text-[10px] text-neutral-500 font-bold uppercase text-center mb-1">Shapes</span>
            {Object.values(SHAPE_TOOLS).map((t) => (
              <button
                key={t.id}
                onClick={() => { setMode('SHAPE'); setActiveToolId(t.id); }}
                className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                  mode === 'SHAPE' && activeToolId === t.id
                    ? 'bg-teal-600 text-white shadow-lg' 
                    : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-[9px] mt-0.5">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="w-10 h-px bg-neutral-700 shrink-0"></div>

          <div className="flex flex-col gap-3 w-full px-2 items-center">
             <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-neutral-600 cursor-pointer p-0"
             />
             <div className="h-20 flex items-center justify-center py-2 w-full">
                <input
                  type="range"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  orient="vertical"
                  value={tools[activeToolId]?.size || 5}
                  onChange={(e) => updateToolSettings('size', parseFloat(e.target.value))}
                  className="w-1.5 h-full appearance-none bg-neutral-700 rounded-lg outline-none cursor-pointer accent-indigo-500"
                  style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                />
             </div>
          </div>
        </div>

        {/* --- Settings Panel Overlay --- */}
        {showSettings && <SettingsPanel />}

        {/* --- Center Canvas --- */}
        <div 
            ref={workspaceRef}
            className="flex-1 bg-neutral-900 overflow-hidden relative cursor-crosshair"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
          <div className="w-full h-full flex items-center justify-center origin-top-left">
            <div 
                ref={containerRef}
                className="absolute top-0 left-0 origin-top-left shadow-2xl bg-white bg-opacity-5"
                style={{ 
                    width: CANVAS_WIDTH, 
                    height: CANVAS_HEIGHT,
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                    backgroundImage: 'linear-gradient(45deg, #262626 25%, transparent 25%), linear-gradient(-45deg, #262626 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #262626 75%), linear-gradient(-45deg, transparent 75%, #262626 75%)',
                    backgroundSize: '100px 100px',
                    backgroundPosition: '0 0, 0 50px, 50px -50px, -50px 0px'
                }}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
            >
                {/* Regular Layers */}
                {[...layers].reverse().map((layer) => (
                <canvas
                    key={layer.id}
                    ref={(el) => canvasRefs.current[layer.id] = el}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="absolute top-0 left-0 pointer-events-none transition-opacity duration-200"
                    style={{ width: '100%', height: '100%', opacity: layer.visible ? 1 : 0, zIndex: layer.id }}
                />
                ))}

                {/* --- Temporary Overlay Layer (For continuous transparent strokes) --- */}
                <canvas
                    ref={overlayCanvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="absolute top-0 left-0 pointer-events-none z-50"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none">
            {snappedShape && (
                <div className="bg-indigo-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
                    Snapped: {snappedShape}
                </div>
            )}
            {showUI && (
                <div className="bg-neutral-800/80 backdrop-blur text-xs px-4 py-2 rounded-full border border-neutral-700 shadow-lg text-neutral-400">
                    {Math.round(transform.k * 100)}% • {layers.find(l => l.id === activeLayerId)?.name}
                </div>
            )}
          </div>
        </div>

        {/* --- Right Layers Panel --- */}
        <div className={`
            bg-neutral-800 border-l border-neutral-700 flex flex-col shrink-0 z-20 shadow-xl transition-all duration-300
            ${showUI ? 'w-64 translate-x-0' : 'w-0 translate-x-full opacity-0 pointer-events-none'}
        `}>
          <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm text-neutral-300">
              <Layers className="w-4 h-4" />
              Layers
            </h2>
            <button onClick={() => {
                const newId = `layer-${Date.now()}`;
                setLayers([{ id: newId, name: `Layer ${layers.length + 1}`, visible: true }, ...layers]);
                setActiveLayerId(newId);
            }} className="p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {layers.map((layer, i) => (
              <div 
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none ${
                  activeLayerId === layer.id ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-neutral-700/20 border-transparent'
                }`}
              >
                <button onClick={(e) => { e.stopPropagation(); setLayers(layers.map(l => l.id === layer.id ? {...l, visible: !l.visible} : l)) }} 
                  className="text-neutral-400 hover:text-white">
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <span className={`flex-1 text-xs truncate ${activeLayerId === layer.id ? 'text-indigo-200' : 'text-neutral-400'}`}>
                  {layer.name}
                </span>
                <button onClick={(e) => {
                    if (layers.length <= 1) return;
                    e.stopPropagation();
                    const n = layers.filter(l => l.id !== layer.id);
                    setLayers(n);
                    if (activeLayerId === layer.id) setActiveLayerId(n[0].id);
                }} className="text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}