import React, { useState, useEffect, useRef } from 'react';
import { MathProblem } from '../types';
import { RotateCcw } from 'lucide-react';
import { audioService } from '../services/audioService';

interface AbacusVisualProps {
  problem: MathProblem;
  showValue: boolean;
  onChange?: (value: number) => void;
}

// Configuration for touch sensitivity
const DRAG_THRESHOLD = 8; // Pixels to move before registering a drag
const TAP_THRESHOLD = 5;  // Maximum movement to still count as a tap

// Color configurations for columns (Montessori/Candy style)
const COLUMN_STYLES = [
  { // Hundreds
    bead: "bg-gradient-to-br from-cyan-300 via-cyan-400 to-cyan-600 shadow-cyan-800/40",
    activeBead: "brightness-110 contrast-125" 
  },
  { // Tens
    bead: "bg-gradient-to-br from-pink-300 via-rose-400 to-rose-600 shadow-rose-900/40",
    activeBead: "brightness-110 contrast-125"
  },
  { // Units
    bead: "bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-amber-800/40",
    activeBead: "brightness-110 contrast-125"
  }
];

// Reusable Bead Component
const Bead: React.FC<{ 
  active: boolean; 
  type: 'heaven' | 'earth';
  colorStyle: typeof COLUMN_STYLES[0];
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}> = ({ active, type, colorStyle, onPointerDown, onPointerMove, onPointerUp }) => {
  
  // Translation Logic:
  // Heaven: Inactive (Up) -> Active (Down towards beam)
  // Earth: Inactive (Down) -> Active (Up towards beam)
  // Distance is roughly bead height + gap.
  const translateClass = type === 'heaven'
    ? (active ? 'translate-y-[calc(100%+0.25rem)]' : 'translate-y-0') 
    : (active ? 'translate-y-[calc(-100%-0.25rem)]' : 'translate-y-0'); 

  return (
    <div 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      className={`
        relative z-20
        w-16 h-10 md:w-24 md:h-14 
        rounded-full 
        cursor-pointer 
        transition-transform duration-200 cubic-bezier(0.25, 1, 0.5, 1)
        flex items-center justify-center 
        touch-none select-none
        shadow-[2px_3px_5px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]
        ${colorStyle.bead}
        ${active ? colorStyle.activeBead : ''}
        ${translateClass}
      `}
      style={{ touchAction: 'none' }}
    >
       {/* Specular Highlight (The Shiny Reflection) */}
       <div className="absolute top-1.5 left-3 w-4 h-2 md:w-8 md:h-3 bg-white/60 blur-[1px] rounded-full skew-x-[-20deg]"></div>
       
       {/* Center Hole Visualization */}
       <div className="absolute w-full h-1 bg-black/10"></div>
    </div>
  );
};

// Rod Component
const Rod: React.FC<{
  label: string;
  value: number;
  colIndex: number;
  onUpdate: (updater: (prev: number) => number) => void;
}> = ({ label, value, colIndex, onUpdate }) => {
  const heavenActive = value >= 5;
  const earthCount = value % 5;
  
  // Choose color based on column index (0=Hundreds, 1=Tens, 2=Units)
  const styleIndex = colIndex % COLUMN_STYLES.length;
  const colorStyle = COLUMN_STYLES[styleIndex];

  const heavenDragRef = useRef<{ id: number, startY: number, initialActive: boolean } | null>(null);
  const earthDragRef = useRef<{ id: number, startY: number, initialValue: number } | null>(null);

  const updateWithSound = (updater: (prev: number) => number) => {
    onUpdate(prev => {
      const next = updater(prev);
      if (next !== prev) {
        audioService.play('bead');
      }
      return next;
    });
  };

  // --- Heaven Interaction ---
  const handleHeavenPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    heavenDragRef.current = { id: e.pointerId, startY: e.clientY, initialActive: heavenActive };
  };

  const handleHeavenPointerMove = (e: React.PointerEvent) => {
    if (!heavenDragRef.current || heavenDragRef.current.id !== e.pointerId) return;
    const deltaY = e.clientY - heavenDragRef.current.startY;
    const wasActive = heavenDragRef.current.initialActive;

    // Pull Down to Activate (Add 5), Push Up to Deactivate (Sub 5)
    if (!wasActive && deltaY > DRAG_THRESHOLD) {
      updateWithSound(prev => (prev >= 5 ? prev : prev + 5)); 
    } else if (wasActive && deltaY < -DRAG_THRESHOLD) {
      updateWithSound(prev => (prev >= 5 ? prev - 5 : prev)); 
    }
  };

  const handleHeavenPointerUp = (e: React.PointerEvent) => {
    if (!heavenDragRef.current || heavenDragRef.current.id !== e.pointerId) return;
    const deltaY = Math.abs(e.clientY - heavenDragRef.current.startY);
    if (deltaY < TAP_THRESHOLD) {
      updateWithSound(prev => (prev >= 5 ? prev - 5 : prev + 5));
    }
    heavenDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // --- Earth Interaction ---
  const handleEarthPointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    earthDragRef.current = { id: e.pointerId, startY: e.clientY, initialValue: earthCount };
  };

  const handleEarthPointerMove = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current || earthDragRef.current.id !== e.pointerId) return;
    const deltaY = e.clientY - earthDragRef.current.startY;

    // Move Up (Negative Y) -> Activate (Add)
    // Move Down (Positive Y) -> Deactivate (Subtract)
    if (deltaY < -DRAG_THRESHOLD) {
      updateWithSound(prev => {
        const h = prev >= 5 ? 5 : 0;
        // If touching a bead below current active count, move it up
        if (index + 1 > prev % 5) return h + (index + 1);
        return prev;
      });
    } else if (deltaY > DRAG_THRESHOLD) {
      updateWithSound(prev => {
        const h = prev >= 5 ? 5 : 0;
        // If touching a bead currently active, move it down
        if (index < prev % 5) return h + index; 
        return prev;
      });
    }
  };

  const handleEarthPointerUp = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current || earthDragRef.current.id !== e.pointerId) return;
    const deltaY = Math.abs(e.clientY - earthDragRef.current.startY);
    
    // Tap Logic
    if (deltaY < TAP_THRESHOLD) {
       updateWithSound(prev => {
          const h = prev >= 5 ? 5 : 0;
          const currentE = prev % 5;
          // If tapping an inactive bead (below gap), move it up
          // If tapping an active bead (above gap), move it down
          if (index < currentE) {
            // It's currently active, deactivate it and ones below it
            return h + index;
          } else {
            // It's inactive, activate it and ones above it
            return h + (index + 1);
          }
       });
    }
    earthDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col items-center mx-1 flex-1 min-w-[4rem] relative z-10">
      
      {/* Column Label */}
      <div className="text-amber-900/60 font-black mb-1 text-sm md:text-lg select-none">{label}</div>
      
      {/* The Rod (Metal Bar) */}
      <div className="absolute top-8 bottom-4 w-1.5 md:w-2 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 rounded-full z-0 shadow-inner"></div>

      {/* Heaven Deck */}
      <div className="h-[90px] md:h-[130px] w-full flex justify-center items-start pt-1 md:pt-2 relative z-10">
         <Bead 
           type="heaven" 
           active={heavenActive} 
           colorStyle={colorStyle}
           onPointerDown={handleHeavenPointerDown}
           onPointerMove={handleHeavenPointerMove}
           onPointerUp={handleHeavenPointerUp}
         />
      </div>

      {/* The Beam (Separator) - Part of Rod component for z-indexing, or visual only? 
          Better to let parent handle the main beam, but we need spacing here. 
          We'll use a spacer here and let parent draw the wood beam. */}
      <div className="h-4 md:h-6 w-full my-1 relative z-20 flex items-center justify-center">
         {/* Beam Marker Dot */}
         <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full opacity-60 shadow-sm"></div>
      </div>

      {/* Earth Deck */}
      <div className="h-[200px] md:h-[280px] w-full flex flex-col justify-end items-center gap-1 md:gap-1.5 pb-2 relative z-10">
        {[0, 1, 2, 3].map(i => (
           <Bead 
             key={i}
             type="earth"
             active={i < earthCount}
             colorStyle={colorStyle}
             onPointerDown={(e) => handleEarthPointerDown(e, i)}
             onPointerMove={(e) => handleEarthPointerMove(e, i)}
             onPointerUp={(e) => handleEarthPointerUp(e, i)}
           />
        ))}
      </div>
    </div>
  );
};

export const AbacusVisual: React.FC<AbacusVisualProps> = ({ problem, showValue, onChange }) => {
  const [values, setValues] = useState<[number, number, number]>([0, 0, 0]);

  // Reset when problem changes
  useEffect(() => {
    setValues([0, 0, 0]);
    if (onChange) onChange(0);
  }, [problem.id]);

  // Report changes
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

  const reset = () => {
    setValues([0, 0, 0]);
    audioService.play('click'); 
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Abacus Frame Container */}
      <div className="
        relative 
        bg-[#8B5A2B] /* Dark Wood Base Color */
        p-3 md:p-5 
        rounded-2xl 
        shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(255,255,255,0.2),inset_0_-2px_5px_rgba(0,0,0,0.4)] 
        border-[6px] border-[#6D4123]
        flex flex-col items-center justify-center 
        max-w-full touch-none select-none
      ">
        {/* Wood Texture Overlay */}
        <div className="absolute inset-0 rounded-xl opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>

        {/* Inner Frame Area (Lighter Wood) */}
        <div className="
          relative w-full 
          bg-[#F0D5B0] /* Lighter Inner Wood */
          rounded-lg 
          shadow-inner 
          flex justify-center gap-1 md:gap-4
          px-2 md:px-6
          pt-2 pb-2
          border border-[#C19A6B]
        ">
          
          {/* The Horizontal Beam Background (Spans full width) */}
          <div className="absolute top-[116px] md:top-[166px] left-0 right-0 h-4 md:h-6 bg-[#5D3A1A] z-10 shadow-md flex items-center border-y border-[#3E240D]"></div>

          <Rod label="百" value={values[0]} colIndex={0} onUpdate={(u) => updateRod(0, u)} />
          <Rod label="十" value={values[1]} colIndex={1} onUpdate={(u) => updateRod(1, u)} />
          <Rod label="个" value={values[2]} colIndex={2} onUpdate={(u) => updateRod(2, u)} />
          
        </div>

        {/* Reset Button (Integrated into Frame) */}
        <button 
          onClick={reset}
          className="
            absolute -top-3 -right-3 
            bg-gradient-to-b from-red-400 to-red-600 
            text-white 
            w-10 h-10 md:w-12 md:h-12 
            rounded-full 
            shadow-lg border-2 border-white/50
            flex items-center justify-center
            active:scale-95 transition-transform
            z-30
          "
          title="清空算盘"
        >
          <RotateCcw size={18} strokeWidth={3} />
        </button>
      </div>
      
      {/* Value Display */}
      <div className={`
        mt-3 px-6 py-2 
        bg-white/90 backdrop-blur-sm 
        rounded-full shadow-sm border border-candy-pink/30
        text-xl md:text-2xl text-candy-text font-black 
        transition-all duration-300
        ${showValue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
        {currentTotal}
      </div>
    </div>
  );
};
