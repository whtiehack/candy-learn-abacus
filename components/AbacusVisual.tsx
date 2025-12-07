import React, { useState, useEffect, useRef } from 'react';
import { MathProblem } from '../types';
import { RotateCcw } from 'lucide-react';
import { audioService } from '../services/audioService';

interface AbacusVisualProps {
  problem: MathProblem;
  showValue: boolean;
  onChange?: (value: number) => void;
}

// --- CONSTANTS FOR LAYOUT & PHYSICS ---
// Adjusted dimensions based on feedback:
// 1. Reduced Bead Height (36 -> 32) to look less "long/tall".
// 2. Reduced Gap (60 -> 42) to tighten the vertical space.
// 3. Restored Labels.

const MOBILE_BEAD_H = 32;
const MOBILE_BEAD_W = 60;
const MOBILE_GAP = 42; 
const MOBILE_SPACER = 28; 

const DESKTOP_BEAD_H = 44;
const DESKTOP_BEAD_W = 80;
const DESKTOP_GAP = 60;
const DESKTOP_SPACER = 36;

const DRAG_THRESHOLD = 5;

// High Contrast, "Toy-Like" Colors
const COLUMN_STYLES = [
  { // Hundreds - Blue
    bg: "linear-gradient(180deg, #22d3ee 0%, #0891b2 100%)",
    shadow: "#155e75"
  },
  { // Tens - Pink
    bg: "linear-gradient(180deg, #f472b6 0%, #db2777 100%)",
    shadow: "#be185d"
  },
  { // Units - Yellow
    bg: "linear-gradient(180deg, #facc15 0%, #ca8a04 100%)",
    shadow: "#a16207"
  }
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
}> = ({ active, type, styleIndex, onPointerDown, onPointerMove, onPointerUp, isDesktop }) => {
  
  const h = isDesktop ? DESKTOP_BEAD_H : MOBILE_BEAD_H;
  const w = isDesktop ? DESKTOP_BEAD_W : MOBILE_BEAD_W;
  const gap = isDesktop ? DESKTOP_GAP : MOBILE_GAP;

  // Translation Logic
  // Heaven: Inactive (0) -> Active (Move DOWN by gap)
  // Earth: Inactive (0) -> Active (Move UP by gap)
  const translateY = type === 'heaven'
    ? (active ? gap : 0)
    : (active ? -gap : 0);

  const color = COLUMN_STYLES[styleIndex % 3];

  return (
    <div 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      className="relative z-20 cursor-pointer touch-none select-none flex items-center justify-center transition-transform duration-200 cubic-bezier(0.2, 0.8, 0.2, 1)"
      style={{
        width: w,
        height: h,
        transform: `translateY(${translateY}px)`,
        touchAction: 'none' // Critical for handling drags on mobile
      }}
    >
      {/* Bead Visual - Solid Opaque Colors */}
      <div 
        className="w-full h-full rounded-[8px] md:rounded-[12px] relative overflow-hidden"
        style={{
          background: color.bg,
          boxShadow: `
            inset 0 2px 4px rgba(255,255,255,0.4),
            inset 0 -3px 4px rgba(0,0,0,0.2),
            0 2px 4px ${color.shadow}
          `
        }}
      >
         {/* Highlight */}
         <div className="absolute top-1 left-2 right-2 h-[30%] bg-gradient-to-b from-white/60 to-transparent rounded-t-[6px]"></div>
         {/* Center Hole Indication */}
         <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/10 -translate-y-1/2"></div>
      </div>
    </div>
  );
};

const Rod: React.FC<{
  label: string;
  value: number;
  colIndex: number;
  onUpdate: (updater: (prev: number) => number) => void;
  isDesktop: boolean;
}> = ({ label, value, colIndex, onUpdate, isDesktop }) => {
  const heavenActive = value >= 5;
  const earthCount = value % 5;
  
  const heavenDragRef = useRef<{ id: number, startY: number, initialActive: boolean } | null>(null);
  const earthDragRef = useRef<{ id: number, startY: number, initialValue: number } | null>(null);

  const updateWithSound = (updater: (prev: number) => number) => {
    onUpdate(prev => {
      const next = updater(prev);
      if (next !== prev) audioService.play('bead');
      return next;
    });
  };

  // --- Heaven Logic ---
  const handleHeavenPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    heavenDragRef.current = { id: e.pointerId, startY: e.clientY, initialActive: heavenActive };
  };

  const handleHeavenMove = (e: React.PointerEvent) => {
    if (!heavenDragRef.current || heavenDragRef.current.id !== e.pointerId) return;
    const delta = e.clientY - heavenDragRef.current.startY;
    if (!heavenDragRef.current.initialActive && delta > DRAG_THRESHOLD) updateWithSound(v => v >= 5 ? v : v + 5);
    else if (heavenDragRef.current.initialActive && delta < -DRAG_THRESHOLD) updateWithSound(v => v >= 5 ? v - 5 : v);
  };

  const handleHeavenUp = (e: React.PointerEvent) => {
    if (!heavenDragRef.current) return;
    if (Math.abs(e.clientY - heavenDragRef.current.startY) < 5) {
      updateWithSound(v => v >= 5 ? v - 5 : v + 5);
    }
    heavenDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // --- Earth Logic ---
  const handleEarthDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    earthDragRef.current = { id: e.pointerId, startY: e.clientY, initialValue: earthCount };
  };

  const handleEarthMove = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current || earthDragRef.current.id !== e.pointerId) return;
    const delta = e.clientY - earthDragRef.current.startY;
    
    // Drag Up (Negative Y) -> Add
    if (delta < -DRAG_THRESHOLD) {
      updateWithSound(prev => {
        const h = prev >= 5 ? 5 : 0;
        const target = index + 1;
        if (target > prev % 5) return h + target;
        return prev;
      });
    } 
    // Drag Down (Positive Y) -> Subtract
    else if (delta > DRAG_THRESHOLD) {
      updateWithSound(prev => {
        const h = prev >= 5 ? 5 : 0;
        const target = index;
        if (target < prev % 5) return h + target;
        return prev;
      });
    }
  };

  const handleEarthUp = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current) return;
    if (Math.abs(e.clientY - earthDragRef.current.startY) < 5) {
      updateWithSound(prev => {
         const h = prev >= 5 ? 5 : 0;
         const currentE = prev % 5;
         const isBeadActive = index < currentE;
         if (isBeadActive) {
           return h + index;
         } else {
           return h + (index + 1);
         }
      });
    }
    earthDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Dimensions
  const beadH = isDesktop ? DESKTOP_BEAD_H : MOBILE_BEAD_H;
  const gap = isDesktop ? DESKTOP_GAP : MOBILE_GAP;
  const spacerH = isDesktop ? DESKTOP_SPACER : MOBILE_SPACER;

  const heavenH = beadH + gap;
  const earthH = (beadH * 4) + gap;

  return (
    <div className="flex flex-col items-center relative z-10 mx-1 md:mx-2">
      {/* Label Restored */}
      <div className="text-[#5D4037] font-black mb-1 opacity-70 text-sm md:text-lg">{label}</div>
      
      {/* ROD CONTAINER */}
      <div className="relative flex flex-col items-center">
         
         {/* Vertical Metal Rod (Z-0: Behind Beads) */}
         {/* Adjusted top to align with label bottom roughly */}
         <div className="absolute top-0 bottom-2 w-1.5 md:w-2 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-400 rounded-full z-0"></div>

         {/* HEAVEN DECK (Z-10) */}
         <div style={{ height: heavenH }} className="w-full relative z-10 flex justify-center items-start pt-0">
            <Bead 
              active={heavenActive} 
              type="heaven" 
              styleIndex={colIndex} 
              isDesktop={isDesktop}
              onPointerDown={handleHeavenPointerDown}
              onPointerMove={handleHeavenMove}
              onPointerUp={handleHeavenUp}
            />
         </div>

         {/* SPACER FOR BEAM */}
         <div style={{ height: spacerH }} className="w-full z-0"></div>

         {/* EARTH DECK (Z-10) */}
         <div style={{ height: earthH }} className="w-full relative z-10 flex flex-col justify-end items-center gap-0">
            {[0, 1, 2, 3].map(i => (
              <Bead 
                key={i}
                active={i < earthCount}
                type="earth"
                styleIndex={colIndex}
                isDesktop={isDesktop}
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

export const AbacusVisual: React.FC<AbacusVisualProps> = ({ problem, showValue, onChange }) => {
  const [values, setValues] = useState<[number, number, number]>([0, 0, 0]);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    setValues([0, 0, 0]);
    if (onChange) onChange(0);
  }, [problem.id]);

  useEffect(() => {
     const total = values[0] * 100 + values[1] * 10 + values[2];
     if (onChange) onChange(total);
  }, [values, onChange]);

  const updateRod = (index: 0 | 1 | 2, updater: (prev: number) => number) => {
    setValues(prev => {
      const newValues = [...prev] as [number, number, number];
      newValues[index] = updater(newValues[index]);
      return newValues;
    });
  };

  const currentTotal = values[0] * 100 + values[1] * 10 + values[2];
  const reset = () => { setValues([0, 0, 0]); audioService.play('click'); };

  // --- BEAM POSITION CALCULATION ---
  const beadH = isDesktop ? DESKTOP_BEAD_H : MOBILE_BEAD_H;
  const gap = isDesktop ? DESKTOP_GAP : MOBILE_GAP;
  const spacerH = isDesktop ? DESKTOP_SPACER : MOBILE_SPACER;
  
  // Height of Heaven Deck including travel gap
  const heavenH = beadH + gap;
  
  // Container Padding Top (pt-2 = 8px)
  const paddingTop = 8; 

  // Label Height + Margin:
  // Mobile: text-sm (line-height 20px) + mb-1 (4px) = 24px
  // Desktop: text-lg (line-height 28px) + mb-1 (4px) = 32px
  const labelH = isDesktop ? 32 : 24;
  
  // Beam Height
  const beamH = isDesktop ? 24 : 20;

  // Beam should be vertically centered within the spacer area
  // Top = PaddingTop + LabelHeight + HeavenHeight + (SpacerHeight - BeamHeight) / 2
  // Manual tweak: -3px to move beam up slightly as requested
  const beamTop = paddingTop + labelH + heavenH + (spacerH - beamH) / 2 - 3;

  return (
    <div className="flex flex-col items-center justify-center select-none touch-none w-full">
      
      {/* OUTER FRAME */}
      <div className="
        relative inline-block
        bg-[#8B5A2B] 
        p-2 md:p-4 rounded-[20px] 
        shadow-xl
        border-4 border-[#6D4123]
      ">
         {/* Wood Texture CSS */}
         <div className="absolute inset-0 rounded-[16px] opacity-30 pointer-events-none" 
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000000 0, #000000 1px, transparent 1px, transparent 10px)' }}></div>

         {/* INNER CANVAS */}
         {/* Revert to pt-2 to allow labels to fit naturally without extra padding */}
         <div className="bg-[#FFF8E1] rounded-[10px] px-2 pb-2 pt-2 border border-[#D7CCC8] shadow-inner relative flex justify-center gap-1 md:gap-4">
            
            {/* THE BEAM (Z-30: On top of beads) */}
            <div 
               className="absolute left-0 right-0 bg-[#5D4037] z-30 shadow-md flex items-center justify-around border-y border-[#3E2723]"
               style={{ 
                 top: beamTop, 
                 height: beamH
               }}
            >
               {/* Beam Dots */}
               <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
               <div className="w-2 h-2 bg-white/80 rounded-full"></div>
               <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
            </div>

            <Rod label="百" value={values[0]} colIndex={0} onUpdate={(u) => updateRod(0, u)} isDesktop={isDesktop} />
            <Rod label="十" value={values[1]} colIndex={1} onUpdate={(u) => updateRod(1, u)} isDesktop={isDesktop} />
            <Rod label="个" value={values[2]} colIndex={2} onUpdate={(u) => updateRod(2, u)} isDesktop={isDesktop} />
         
         </div>

         {/* Reset Button */}
         <button 
          onClick={reset}
          className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform z-40"
         >
           <RotateCcw size={18} />
         </button>

      </div>

      {/* Value Display */}
      {showValue && (
        <div className="mt-4 bg-white/90 px-6 py-2 rounded-full shadow-sm text-2xl font-black text-candy-text border border-candy-pink">
          {currentTotal}
        </div>
      )}
    </div>
  );
};
