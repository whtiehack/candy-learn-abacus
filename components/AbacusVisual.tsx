import React, { useState, useEffect, useRef } from 'react';
import { MathProblem } from '../types';
import { RotateCcw } from 'lucide-react';
import { audioService } from '../services/audioService';

interface AbacusVisualProps {
  problem?: MathProblem;
  showValue: boolean;
  onChange?: (value: number) => void;
  digitCount?: number;
  labels?: string[];
  forceLandscape?: boolean; // If true, treats input coordinates as rotated 90deg
}

// --- CONSTANTS ---

// Standard Mobile (Portrait)
const MOBILE_BEAD_H = 32;
const MOBILE_BEAD_W = 60;
const MOBILE_GAP = 42; 
const MOBILE_SPACER = 28; 

// Desktop / Landscape Large
const DESKTOP_BEAD_H = 40;
const DESKTOP_BEAD_W = 70;
const DESKTOP_GAP = 55;
const DESKTOP_SPACER = 36;

// Compact (only used if NOT in landscape/forced landscape and many digits)
const COMPACT_BEAD_W = 50; 
const COMPACT_GAP = 38;

const DRAG_THRESHOLD = 5; // Reduced threshold for better sensitivity

// High Contrast Colors
const COLUMN_STYLES = [
  { bg: "linear-gradient(180deg, #facc15 0%, #ca8a04 100%)", shadow: "#a16207" }, // Units (Yellow)
  { bg: "linear-gradient(180deg, #f472b6 0%, #db2777 100%)", shadow: "#be185d" }, // Tens (Pink)
  { bg: "linear-gradient(180deg, #22d3ee 0%, #0891b2 100%)", shadow: "#155e75" }, // Hundreds (Blue)
  { bg: "linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)", shadow: "#5b21b6" }, // Thousands (Purple)
  { bg: "linear-gradient(180deg, #4ade80 0%, #16a34a 100%)", shadow: "#14532d" }, // 10k (Green)
  { bg: "linear-gradient(180deg, #fb923c 0%, #ea580c 100%)", shadow: "#9a3412" }, // 100k (Orange)
  { bg: "linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)", shadow: "#9f1239" }, // Mill (Red)
  { bg: "linear-gradient(180deg, #94a3b8 0%, #475569 100%)", shadow: "#1e293b" }, // 10m (Slate)
  { bg: "linear-gradient(180deg, #e879f9 0%, #c026d3 100%)", shadow: "#701a75" }, // 100m (Fuchsia)
];

// --- COMPONENTS ---

const Bead: React.FC<{ 
  active: boolean; 
  type: 'heaven' | 'earth';
  styleIndex: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  isDesktop: boolean;
  isCompact: boolean;
}> = ({ active, type, styleIndex, onPointerDown, onPointerMove, onPointerUp, isDesktop, isCompact }) => {
  
  let h = isDesktop ? DESKTOP_BEAD_H : MOBILE_BEAD_H;
  let w = isDesktop ? DESKTOP_BEAD_W : MOBILE_BEAD_W;
  let gap = isDesktop ? DESKTOP_GAP : MOBILE_GAP;

  if (isCompact) {
    w = COMPACT_BEAD_W;
    gap = COMPACT_GAP;
  }

  const translateY = type === 'heaven'
    ? (active ? gap : 0)
    : (active ? -gap : 0);

  const color = COLUMN_STYLES[styleIndex % COLUMN_STYLES.length];

  return (
    <div 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      className="relative z-20 cursor-pointer select-none flex items-center justify-center transition-transform duration-200 cubic-bezier(0.2, 0.8, 0.2, 1)"
      style={{
        width: w,
        height: h,
        transform: `translateY(${translateY}px)`,
        touchAction: 'none' // CRITICAL for touch dragging support
      }}
    >
      <div 
        className="w-full h-full rounded-[8px] md:rounded-[12px] relative overflow-hidden pointer-events-none"
        style={{
          background: color.bg,
          boxShadow: `
            inset 0 2px 4px rgba(255,255,255,0.4),
            inset 0 -3px 4px rgba(0,0,0,0.2),
            0 2px 4px ${color.shadow}
          `
        }}
      >
         <div className="absolute top-1 left-2 right-2 h-[30%] bg-gradient-to-b from-white/60 to-transparent rounded-t-[6px]"></div>
         <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/10 -translate-y-1/2"></div>
      </div>
    </div>
  );
};

const Rod: React.FC<{
  label: string;
  value: number;
  colIndex: number; 
  styleIndex: number; 
  onUpdate: (updater: (prev: number) => number) => void;
  isDesktop: boolean;
  isCompact: boolean;
  forceLandscape: boolean;
}> = ({ label, value, colIndex, styleIndex, onUpdate, isDesktop, isCompact, forceLandscape }) => {
  const heavenActive = value >= 5;
  const earthCount = value % 5;
  
  const heavenDragRef = useRef<{ id: number, startVal: number, hasTriggered: boolean } | null>(null);
  const earthDragRef = useRef<{ id: number, startVal: number, initialValue: number, hasTriggered: boolean } | null>(null);

  // MAPPING LOGIC:
  // If forceLandscape is true, the user has rotated the device. 
  // Visual "Vertical" movement on the abacus corresponds to Physical "Horizontal" movement (X axis) on the device.
  // Visual "Down" (towards bottom of Abacus) = Physical "Right" (Increasing X).
  // Visual "Up" (towards top of Abacus) = Physical "Left" (Decreasing X).
  const getCoord = (e: React.PointerEvent) => {
    return forceLandscape ? e.clientX : e.clientY;
  };

  const updateWithSound = (updater: (prev: number) => number) => {
    onUpdate(prev => {
      const next = updater(prev);
      if (next !== prev) audioService.play('bead');
      return next;
    });
  };

  // --- Heaven Logic ---
  const handleHeavenPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation(); // Stop event from bubbling to container which might cause scroll
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    heavenDragRef.current = { 
      id: e.pointerId, 
      startVal: getCoord(e), 
      hasTriggered: false 
    };
  };

  const handleHeavenMove = (e: React.PointerEvent) => {
    if (!heavenDragRef.current || heavenDragRef.current.id !== e.pointerId || heavenDragRef.current.hasTriggered) return;
    
    const currentVal = getCoord(e);
    const delta = currentVal - heavenDragRef.current.startVal;
    
    // Drag Down (Visual) -> Activate
    // Normal: Delta > 0. Rotated: Delta > 0 (Right).
    if (!heavenActive && delta > DRAG_THRESHOLD) {
      updateWithSound(v => v >= 5 ? v : v + 5);
      heavenDragRef.current.hasTriggered = true;
    }
    // Drag Up (Visual) -> Deactivate
    // Normal: Delta < 0. Rotated: Delta < 0 (Left).
    else if (heavenActive && delta < -DRAG_THRESHOLD) {
      updateWithSound(v => v >= 5 ? v - 5 : v);
      heavenDragRef.current.hasTriggered = true;
    }
  };

  const handleHeavenUp = (e: React.PointerEvent) => {
    if (!heavenDragRef.current) return;
    // Click fallback
    if (!heavenDragRef.current.hasTriggered && Math.abs(getCoord(e) - heavenDragRef.current.startVal) < DRAG_THRESHOLD) {
      updateWithSound(v => v >= 5 ? v - 5 : v + 5);
    }
    heavenDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // --- Earth Logic ---
  const handleEarthDown = (e: React.PointerEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    earthDragRef.current = { 
      id: e.pointerId, 
      startVal: getCoord(e), 
      initialValue: earthCount,
      hasTriggered: false 
    };
  };

  const handleEarthMove = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current || earthDragRef.current.id !== e.pointerId || earthDragRef.current.hasTriggered) return;
    
    const delta = getCoord(e) - earthDragRef.current.startVal;
    
    // Drag Up (Visual) -> Activate
    // Normal: Delta < 0. Rotated: Delta < 0 (Left).
    if (delta < -DRAG_THRESHOLD) { 
       const currentVal = earthDragRef.current.initialValue;
       if (index >= currentVal) {
          updateWithSound(prev => {
             const h = prev >= 5 ? 5 : 0;
             return h + (index + 1);
          });
          earthDragRef.current.hasTriggered = true;
       }
    } 
    // Drag Down (Visual) -> Deactivate
    // Normal: Delta > 0. Rotated: Delta > 0 (Right).
    else if (delta > DRAG_THRESHOLD) { 
       const currentVal = earthDragRef.current.initialValue;
       if (index < currentVal) {
          updateWithSound(prev => {
             const h = prev >= 5 ? 5 : 0;
             return h + index;
          });
          earthDragRef.current.hasTriggered = true;
       }
    }
  };

  const handleEarthUp = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current) return;
    // Click fallback
    if (!earthDragRef.current.hasTriggered && Math.abs(getCoord(e) - earthDragRef.current.startVal) < DRAG_THRESHOLD) {
      updateWithSound(prev => {
         const h = prev >= 5 ? 5 : 0;
         const currentE = prev % 5;
         if (index < currentE) {
           return h + index; 
         } else {
           return h + (index + 1);
         }
      });
    }
    earthDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Dimensions logic
  let beadH = isDesktop ? DESKTOP_BEAD_H : MOBILE_BEAD_H;
  let gap = isDesktop ? DESKTOP_GAP : MOBILE_GAP;
  let spacerH = isDesktop ? DESKTOP_SPACER : MOBILE_SPACER;

  if (isCompact) {
    gap = COMPACT_GAP;
  }

  const heavenH = beadH + gap;
  const earthH = (beadH * 4) + gap;
  
  // Font sizes for labels
  const labelClass = isDesktop ? 'text-lg' : (isCompact ? 'text-[10px]' : 'text-sm');

  return (
    <div className={`flex flex-col items-center relative z-10 w-full`}>
      <div className={`text-[#5D4037] font-black mb-1 opacity-70 ${labelClass}`}>{label}</div>
      
      <div className="relative flex flex-col items-center">
         <div className="absolute top-0 bottom-2 w-1.5 md:w-2 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 rounded-full z-0"></div>

         <div style={{ height: heavenH }} className="w-full relative z-10 flex justify-center items-start pt-0">
            <Bead 
              active={heavenActive} 
              type="heaven" 
              styleIndex={styleIndex} 
              isDesktop={isDesktop}
              isCompact={isCompact}
              onPointerDown={handleHeavenPointerDown}
              onPointerMove={handleHeavenMove}
              onPointerUp={handleHeavenUp}
            />
         </div>

         <div style={{ height: spacerH }} className="w-full z-0"></div>

         <div style={{ height: earthH }} className="w-full relative z-10 flex flex-col justify-end items-center gap-0">
            {[0, 1, 2, 3].map(i => (
              <Bead 
                key={i}
                active={i < earthCount}
                type="earth"
                styleIndex={styleIndex}
                isDesktop={isDesktop}
                isCompact={isCompact}
                onPointerDown={(e) => handleEarthDown(e, i)}
                onPointerMove={(e) => handleEarthMove(e, i)}
                onPointerUp={(e) => handleEarthUp(e, i)}
              />
            ))}
         </div>
      </div>
    </div>
  );
};

export const AbacusVisual: React.FC<AbacusVisualProps> = ({ 
  problem, 
  showValue, 
  onChange, 
  digitCount = 3, 
  labels = ['百', '十', '个'],
  forceLandscape = false
}) => {
  const [values, setValues] = useState<number[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setValues(new Array(digitCount).fill(0));
  }, [digitCount]);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    if (problem) {
        setValues(new Array(digitCount).fill(0));
        if (onChange) onChange(0);
    }
  }, [problem, digitCount]);

  useEffect(() => {
     let total = 0;
     for(let i = 0; i < values.length; i++) {
        const power = values.length - 1 - i;
        total += values[i] * Math.pow(10, power);
     }
     if (onChange) onChange(total);
  }, [values, onChange]);

  const updateRod = (index: number, updater: (prev: number) => number) => {
    setValues(prev => {
      const newValues = [...prev];
      newValues[index] = updater(newValues[index]);
      return newValues;
    });
  };

  const currentTotal = values.reduce((acc, val, idx) => {
      const power = values.length - 1 - idx;
      return acc + val * Math.pow(10, power);
  }, 0);
  const formattedTotal = currentTotal.toLocaleString();

  const reset = () => { 
    setValues(new Array(digitCount).fill(0)); 
    audioService.play('click'); 
  };

  // Determine layout mode
  // If showing many digits (9), we never want 'compact' if we are in a wide view (Desktop or Forced Landscape)
  // because we have plenty of width. Compact is only for 9 digits in Portrait Mobile.
  // Since this component is now mostly used in wide modes for 9-digits, we disable compact if landscape.
  const isLandscapeMode = isDesktop || forceLandscape;
  const isCompact = digitCount > 5 && !isLandscapeMode;

  // Geometry calculations for Beam
  let beadH = isDesktop ? DESKTOP_BEAD_H : MOBILE_BEAD_H;
  let gap = isDesktop ? DESKTOP_GAP : MOBILE_GAP;
  let spacerH = isDesktop ? DESKTOP_SPACER : MOBILE_SPACER;
  
  if (isCompact) {
      gap = COMPACT_GAP;
  }

  const heavenH = beadH + gap;
  const paddingTop = 8; 
  const labelH = isDesktop ? 32 : (isCompact ? 20 : 24);
  const beamH = isDesktop ? 24 : 20;
  const beamTop = paddingTop + labelH + heavenH + (spacerH - beamH) / 2 - 3;

  return (
    <div className={`flex flex-col items-center justify-center select-none touch-none w-full h-full`}>
      
      {/* OUTER FRAME */}
      <div className={`
        relative 
        bg-[#8B5A2B] 
        rounded-[20px] 
        shadow-xl
        border-4 border-[#6D4123]
        flex items-center
        ${isLandscapeMode ? 'w-full h-auto px-4 py-2 max-w-6xl' : 'inline-block p-2 md:p-4'}
        ${isCompact ? 'p-1 md:p-3' : ''}
      `}>
         <div className="absolute inset-0 rounded-[16px] opacity-30 pointer-events-none" 
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000000 0, #000000 1px, transparent 1px, transparent 10px)' }}></div>

         {/* INNER CANVAS */}
         <div className={`
           bg-[#FFF8E1] rounded-[10px] pb-2 pt-2 border border-[#D7CCC8] shadow-inner relative flex 
           ${isLandscapeMode ? 'w-full justify-between gap-1' : 'justify-center'}
           ${isCompact ? 'px-1 gap-0.5' : (isLandscapeMode ? 'px-2' : 'px-2 gap-1 md:gap-4')}
         `}>
            
            {/* THE BEAM */}
            <div 
               className="absolute left-0 right-0 bg-[#5D4037] z-30 shadow-md flex items-center justify-around border-y border-[#3E2723]"
               style={{ top: beamTop, height: beamH }}
            >
               {/* Decorative dots on beam */}
               {Array.from({length: Math.ceil(digitCount/3) + 1}).map((_, i) => (
                   <div key={i} className="w-1.5 h-1.5 bg-white/50 rounded-full mx-auto"></div>
               ))}
            </div>

            {values.map((val, idx) => (
               <Rod 
                 key={idx}
                 label={labels[idx] || ''} 
                 value={val} 
                 colIndex={idx}
                 styleIndex={values.length - 1 - idx} // Reverse style index so Unit is always Yellow/0
                 onUpdate={(u) => updateRod(idx, u)} 
                 isDesktop={isDesktop}
                 isCompact={isCompact}
                 forceLandscape={forceLandscape}
               />
            ))}
         
         </div>

         {/* Reset Button */}
         <button 
          onClick={reset}
          className={`
            absolute bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform z-40
            ${isLandscapeMode ? '-right-4 bottom-4 w-12 h-12' : '-top-3 -right-3 w-10 h-10'}
          `}
         >
           <RotateCcw size={isLandscapeMode ? 24 : 18} />
         </button>

      </div>

      {/* Value Display (Standard Mode Only) */}
      {showValue && !forceLandscape && (
        <div className="mt-4 bg-white/90 px-6 py-2 rounded-full shadow-sm text-2xl font-black text-candy-text border border-candy-pink min-w-[120px] text-center">
          {formattedTotal}
        </div>
      )}
    </div>
  );
};
