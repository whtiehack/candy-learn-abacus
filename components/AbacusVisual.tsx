import React, { useState, useEffect, useRef } from 'react';
import { MathProblem } from '../types';
import { RotateCcw } from 'lucide-react';

interface AbacusVisualProps {
  problem: MathProblem;
  showValue: boolean;
  onChange?: (value: number) => void;
}

// Single Abacus Bead Component
const Bead: React.FC<{ 
  active: boolean; 
  type: 'heaven' | 'earth';
  colorClass: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}> = ({ active, type, colorClass, onPointerDown, onPointerMove, onPointerUp }) => {
  
  // Visual position calculation
  // Heaven: Active = Down (closer to beam), Inactive = Up
  // Earth: Active = Up (closer to beam), Inactive = Down
  const translateClass = type === 'heaven'
    ? (active ? 'translate-y-[20px] md:translate-y-[24px]' : 'translate-y-0') 
    : (active ? 'translate-y-[-20px] md:translate-y-[-24px]' : 'translate-y-0'); 

  return (
    <div 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp} // Optional: release if leaving bounds, but capture usually handles this
      className={`
        relative 
        w-10 h-6 md:w-12 md:h-8 
        rounded-full shadow-inner border border-white/30 
        cursor-pointer z-10 transition-transform duration-200 ease-out
        flex items-center justify-center touch-none select-none
        ${colorClass}
        ${translateClass}
      `}
    >
       <div className="w-full h-full rounded-full bg-black/10 absolute top-0 left-0 scale-90 blur-[1px] pointer-events-none"></div>
       <div className="w-6 h-2 md:w-8 md:h-3 bg-white/30 rounded-full absolute top-1 left-2 blur-[2px] pointer-events-none"></div>
    </div>
  );
};

// Single Rod (Column) Component
const Rod: React.FC<{
  label: string;
  value: number;
  onChange: (newVal: number) => void;
}> = ({ label, value, onChange }) => {
  const heavenActive = value >= 5;
  const earthCount = value % 5;

  // Refs to track drag state independently for each bead/interaction
  const dragStartRef = useRef<{ id: number, startY: number, activeAtStart: boolean, earthIndex?: number } | null>(null);

  // --- Heaven Bead Logic ---
  const handleHeavenPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      activeAtStart: heavenActive
    };
  };

  const handleHeavenPointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || dragStartRef.current.id !== e.pointerId) return;
    
    const deltaY = e.clientY - dragStartRef.current.startY;
    const threshold = 10; // Sensitivity px

    // Dragging DOWN -> Activate (Value +5)
    if (deltaY > threshold && !heavenActive) {
      onChange(value + 5);
      // Reset start to prevent oscillating if user keeps dragging back and forth rapidly without lifting
      dragStartRef.current.startY = e.clientY; 
    }
    // Dragging UP -> Deactivate (Value -5)
    else if (deltaY < -threshold && heavenActive) {
      onChange(value - 5);
      dragStartRef.current.startY = e.clientY;
    }
  };

  const handleHeavenPointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current || dragStartRef.current.id !== e.pointerId) return;
    
    // Check if it was a simple tap (no movement)
    const deltaY = Math.abs(e.clientY - dragStartRef.current.startY);
    if (deltaY < 5) {
      // Toggle on tap
      if (heavenActive) onChange(value - 5);
      else onChange(value + 5);
    }
    
    dragStartRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };


  // --- Earth Bead Logic ---
  // index 0 = top visual earth bead (closest to beam), index 3 = bottom
  const handleEarthPointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      activeAtStart: index < earthCount,
      earthIndex: index
    };
  };

  const handleEarthPointerMove = (e: React.PointerEvent, index: number) => {
    if (!dragStartRef.current || dragStartRef.current.id !== e.pointerId) return;

    const deltaY = e.clientY - dragStartRef.current.startY;
    const threshold = 10; 

    // Sliding UP -> Push beads UP (Activate)
    // If I touch bead at 'index', and slide UP, I want at least 'index + 1' beads active.
    if (deltaY < -threshold) {
       const targetCount = index + 1;
       // Only change if we are increasing value (pushing up)
       // We keep the heaven value (value >= 5 ? 5 : 0) and add the new earth count
       const base = value >= 5 ? 5 : 0;
       if (earthCount < targetCount) {
         onChange(base + targetCount);
         dragStartRef.current.startY = e.clientY;
       }
    }
    // Sliding DOWN -> Push beads DOWN (Deactivate)
    // If I touch bead at 'index' and slide DOWN, I want 'index' beads active (removing the one I touched and those below it?)
    // Actually, usually you grab the top-most active bead to pull down.
    // Logic: If I slide down on bead 'index', I want the count to become 'index'.
    else if (deltaY > threshold) {
       const targetCount = index;
       const base = value >= 5 ? 5 : 0;
       if (earthCount > targetCount) {
         onChange(base + targetCount);
         dragStartRef.current.startY = e.clientY;
       }
    }
  };

  const handleEarthPointerUp = (e: React.PointerEvent, index: number) => {
    if (!dragStartRef.current || dragStartRef.current.id !== e.pointerId) return;

    // Tap Logic
    const deltaY = Math.abs(e.clientY - dragStartRef.current.startY);
    if (deltaY < 5) {
       const base = value >= 5 ? 5 : 0;
       // If tapping an inactive bead -> activate up to this one
       if (index >= earthCount) {
         onChange(base + index + 1);
       } 
       // If tapping an active bead
       else {
         // Standard behavior: tapping the bottom-most active bead deactivates it?
         // Or tapping any active bead sets count to that bead's index?
         // Let's implement: Tapping specific bead toggles state relative to stack.
         
         // If tapping the top-most inactive bead (earthCount), add 1.
         // If tapping the bottom-most active bead (earthCount - 1), remove 1.
         
         if (index === earthCount) {
            onChange(base + earthCount + 1);
         } else if (index === earthCount - 1) {
            onChange(base + earthCount - 1);
         } else {
            // Fallback: If clicking deep into active stack, cut stack there? 
            // Let's keep it simple: Click moves stack to pointer
            if (index < earthCount) {
               // Deactivate beads below this one? No, usually drag down.
               // Let's just make tap on active bead = deactivate stack down to here.
               onChange(base + index); 
            } else {
               onChange(base + index + 1);
            }
         }
       }
    }

    dragStartRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col items-center mx-1 relative flex-1 min-w-[3.5rem] touch-none">
      <div className="text-gray-500 font-bold mb-1 text-xs md:text-sm select-none pointer-events-none">{label}</div>
      <div className="absolute top-6 bottom-6 w-1 bg-amber-800/60 z-0 pointer-events-none"></div>
      
      <div className="bg-candy-mint/20 border-2 border-candy-mint rounded-lg p-0.5 md:p-1 relative z-0 flex flex-col items-center select-none touch-none">
        {/* Heaven Deck */}
        <div className="
           h-[50px] w-12 md:h-[64px] md:w-14 
           flex justify-center items-start 
           bg-white/40 rounded-t-md mb-0.5 border-b-4 border-amber-800 relative
        ">
           <Bead 
             type="heaven" 
             active={heavenActive} 
             colorClass="bg-candy-darkPink"
             onPointerDown={handleHeavenPointerDown}
             onPointerMove={handleHeavenPointerMove}
             onPointerUp={handleHeavenPointerUp}
           />
        </div>
        
        {/* Earth Deck */}
        <div className="
           h-[130px] w-12 md:h-[160px] md:w-14 
           flex flex-col justify-end items-center 
           bg-white/40 rounded-b-md gap-1 pb-1 relative
        ">
           {[0, 1, 2, 3].map(i => (
             <Bead 
               key={i} 
               type="earth" 
               active={i < earthCount} 
               colorClass="bg-candy-yellow"
               onPointerDown={(e) => handleEarthPointerDown(e, i)}
               onPointerMove={(e) => handleEarthPointerMove(e, i)}
               onPointerUp={(e) => handleEarthPointerUp(e, i)}
             />
           ))}
        </div>
      </div>
    </div>
  );
};

export const AbacusVisual: React.FC<AbacusVisualProps> = ({ problem, showValue, onChange }) => {
  // State for 3 rods: [Hundreds, Tens, Units]
  const [values, setValues] = useState<[number, number, number]>([0, 0, 0]);

  // Reset when problem changes
  useEffect(() => {
    setValues([0, 0, 0]);
    if (onChange) onChange(0);
  }, [problem, onChange]);

  const updateRod = (index: 0 | 1 | 2, val: number) => {
    setValues(prev => {
      const newValues = [...prev] as [number, number, number];
      newValues[index] = val;
      
      // Calculate total inside the setter to ensure latest state usage
      const total = newValues[0] * 100 + newValues[1] * 10 + newValues[2];
      // Defer the onChange call slightly or call it directly. 
      // Since onChange usually updates parent state which might re-render, 
      // it's safer to call it outside the reducer, but here we need atomic updates.
      // Calling it here is okay as long as parent doesn't force hard reset of this component props immediately.
      if (onChange) onChange(total);
      
      return newValues;
    });
  };

  const currentTotal = values[0] * 100 + values[1] * 10 + values[2];

  const reset = () => {
    setValues([0, 0, 0]);
    if (onChange) onChange(0);
  };

  return (
    <div className="w-full flex flex-col items-center mb-2 md:mb-6">
      <div className="relative bg-white p-2 md:p-4 rounded-2xl md:rounded-3xl shadow-xl border-4 border-candy-mint flex items-end justify-center gap-1 md:gap-2 max-w-full touch-none">
        <Rod label="百" value={values[0]} onChange={(v) => updateRod(0, v)} />
        <Rod label="十" value={values[1]} onChange={(v) => updateRod(1, v)} />
        <Rod label="个" value={values[2]} onChange={(v) => updateRod(2, v)} />
        
        {/* Reset Button */}
        <button 
          onClick={reset}
          className="absolute -top-3 -right-3 bg-red-400 text-white p-1.5 md:p-2 rounded-full shadow-md hover:bg-red-500 transition-colors z-20"
          title="清空算盘"
        >
          <RotateCcw size={14} className="md:w-4 md:h-4" />
        </button>
      </div>
      
      <div className={`mt-1 md:mt-2 h-5 md:h-6 flex items-center justify-center text-xs md:text-sm text-candy-text/60 font-bold transition-opacity ${showValue ? 'opacity-100' : 'opacity-0'}`}>
        {showValue ? `当前数值: ${currentTotal}` : '数值已隐藏'}
      </div>
    </div>
  );
};