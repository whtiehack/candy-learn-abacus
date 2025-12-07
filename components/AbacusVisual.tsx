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
  
  const translateClass = type === 'heaven'
    ? (active ? 'translate-y-[20px] md:translate-y-[24px]' : 'translate-y-0') 
    : (active ? 'translate-y-[-20px] md:translate-y-[-24px]' : 'translate-y-0'); 

  return (
    <div 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp} 
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
  onUpdate: (updater: (prev: number) => number) => void;
}> = ({ label, value, onUpdate }) => {
  const heavenActive = value >= 5;
  const earthCount = value % 5;

  // Separate refs for Heaven and Earth to support simultaneous interaction (Pinch)
  const heavenDragRef = useRef<{ id: number, startY: number } | null>(null);
  const earthDragRef = useRef<{ id: number, startY: number } | null>(null);

  // --- Heaven Bead Logic ---
  const handleHeavenPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    heavenDragRef.current = {
      id: e.pointerId,
      startY: e.clientY
    };
  };

  const handleHeavenPointerMove = (e: React.PointerEvent) => {
    if (!heavenDragRef.current || heavenDragRef.current.id !== e.pointerId) return;
    
    const deltaY = e.clientY - heavenDragRef.current.startY;
    const threshold = 10; 

    // Dragging DOWN -> Activate (+5)
    if (deltaY > threshold) {
      onUpdate(prev => (prev >= 5 ? prev : prev + 5));
      heavenDragRef.current.startY = e.clientY; 
    }
    // Dragging UP -> Deactivate (-5)
    else if (deltaY < -threshold) {
      onUpdate(prev => (prev >= 5 ? prev - 5 : prev));
      heavenDragRef.current.startY = e.clientY;
    }
  };

  const handleHeavenPointerUp = (e: React.PointerEvent) => {
    if (!heavenDragRef.current || heavenDragRef.current.id !== e.pointerId) return;
    
    const deltaY = Math.abs(e.clientY - heavenDragRef.current.startY);
    if (deltaY < 5) {
      // Toggle on tap
      onUpdate(prev => (prev >= 5 ? prev - 5 : prev + 5));
    }
    
    heavenDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };


  // --- Earth Bead Logic ---
  const handleEarthPointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    earthDragRef.current = {
      id: e.pointerId,
      startY: e.clientY
    };
  };

  const handleEarthPointerMove = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current || earthDragRef.current.id !== e.pointerId) return;

    const deltaY = e.clientY - earthDragRef.current.startY;
    const threshold = 10; 

    // Sliding UP -> Push beads UP (Activate)
    if (deltaY < -threshold) {
       const targetCount = index + 1;
       onUpdate(prev => {
         const currentHeaven = prev >= 5 ? 5 : 0;
         const currentEarth = prev % 5;
         if (currentEarth < targetCount) {
           return currentHeaven + targetCount;
         }
         return prev;
       });
       earthDragRef.current.startY = e.clientY;
    }
    // Sliding DOWN -> Push beads DOWN (Deactivate)
    else if (deltaY > threshold) {
       const targetCount = index;
       onUpdate(prev => {
         const currentHeaven = prev >= 5 ? 5 : 0;
         const currentEarth = prev % 5;
         if (currentEarth > targetCount) {
           return currentHeaven + targetCount;
         }
         return prev;
       });
       earthDragRef.current.startY = e.clientY;
    }
  };

  const handleEarthPointerUp = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current || earthDragRef.current.id !== e.pointerId) return;

    // Tap Logic
    const deltaY = Math.abs(e.clientY - earthDragRef.current.startY);
    if (deltaY < 5) {
       onUpdate(prev => {
          const currentHeaven = prev >= 5 ? 5 : 0;
          const currentEarth = prev % 5;
          let newEarth = currentEarth;

          if (index === currentEarth) {
            newEarth = currentEarth + 1;
          } else if (index === currentEarth - 1) {
            newEarth = currentEarth - 1;
          } else {
            if (index < currentEarth) {
               newEarth = index;
            } else {
               newEarth = index + 1;
            }
          }
          // Clamp
          newEarth = Math.max(0, Math.min(4, newEarth));
          return currentHeaven + newEarth;
       });
    }

    earthDragRef.current = null;
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
    // Notify parent of reset (async safe)
    if (onChange) onChange(0);
  }, [problem.id]); // Only reset if ID changes

  // Sync state to parent whenever values change
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
  };

  return (
    <div className="w-full flex flex-col items-center mb-2 md:mb-6">
      <div className="relative bg-white p-2 md:p-4 rounded-2xl md:rounded-3xl shadow-xl border-4 border-candy-mint flex items-end justify-center gap-1 md:gap-2 max-w-full touch-none">
        <Rod label="百" value={values[0]} onUpdate={(updater) => updateRod(0, updater)} />
        <Rod label="十" value={values[1]} onUpdate={(updater) => updateRod(1, updater)} />
        <Rod label="个" value={values[2]} onUpdate={(updater) => updateRod(2, updater)} />
        
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