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
  
  // Increased translation distance because beads are taller now
  const translateClass = type === 'heaven'
    ? (active ? 'translate-y-[32px] md:translate-y-[38px]' : 'translate-y-0') 
    : (active ? 'translate-y-[-32px] md:translate-y-[-38px]' : 'translate-y-0'); 

  return (
    <div 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp} 
      className={`
        relative 
        w-14 h-8 md:w-20 md:h-10 
        rounded-full shadow-inner border border-white/30 
        cursor-pointer z-10 transition-transform duration-200 ease-out
        flex items-center justify-center touch-none select-none
        ${colorClass}
        ${translateClass}
      `}
    >
       <div className="w-full h-full rounded-full bg-black/10 absolute top-0 left-0 scale-90 blur-[1px] pointer-events-none"></div>
       {/* Highlight adjustments for larger beads */}
       <div className="w-8 h-3 md:w-12 md:h-4 bg-white/30 rounded-full absolute top-1.5 left-3 blur-[2px] pointer-events-none"></div>
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
    const threshold = 15; // Slightly increased threshold for larger movement

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
    const threshold = 15; 

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
          newEarth = Math.max(0, Math.min(4, newEarth));
          return currentHeaven + newEarth;
       });
    }

    earthDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    // Widened Rod Container
    <div className="flex flex-col items-center mx-2 md:mx-4 relative flex-1 min-w-[4.5rem] md:min-w-[6rem] touch-none">
      <div className="text-gray-500 font-bold mb-2 text-sm md:text-base select-none pointer-events-none">{label}</div>
      {/* Thicker central rod line */}
      <div className="absolute top-8 bottom-8 w-1.5 bg-amber-800/60 z-0 pointer-events-none rounded-full"></div>
      
      <div className="bg-candy-mint/20 border-2 border-candy-mint rounded-xl p-1 md:p-1.5 relative z-0 flex flex-col items-center select-none touch-none">
        {/* Heaven Deck - Taller and Wider */}
        <div className="
           h-[70px] w-[68px] md:h-[90px] md:w-[90px] 
           flex justify-center items-start 
           bg-white/40 rounded-t-lg mb-1 border-b-[6px] border-amber-800 relative
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
        
        {/* Earth Deck - Taller and Wider */}
        <div className="
           h-[180px] w-[68px] md:h-[220px] md:w-[90px] 
           flex flex-col justify-end items-center 
           bg-white/40 rounded-b-lg gap-1.5 pb-2 relative
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
  const [values, setValues] = useState<[number, number, number]>([0, 0, 0]);

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

  const reset = () => {
    setValues([0, 0, 0]);
  };

  return (
    <div className="w-full flex flex-col items-center mb-4 md:mb-8">
      {/* Container with increased gap and padding */}
      <div className="relative bg-white p-4 md:p-6 rounded-3xl shadow-xl border-4 border-candy-mint flex items-end justify-center gap-2 md:gap-6 max-w-full touch-none">
        <Rod label="百" value={values[0]} onUpdate={(updater) => updateRod(0, updater)} />
        <Rod label="十" value={values[1]} onUpdate={(updater) => updateRod(1, updater)} />
        <Rod label="个" value={values[2]} onUpdate={(updater) => updateRod(2, updater)} />
        
        {/* Reset Button - Moved slightly to not overlap larger beads */}
        <button 
          onClick={reset}
          className="absolute -top-4 -right-2 md:-right-4 bg-red-400 text-white p-2 md:p-3 rounded-full shadow-md hover:bg-red-500 transition-colors z-20"
          title="清空算盘"
        >
          <RotateCcw size={18} className="md:w-6 md:h-6" />
        </button>
      </div>
      
      <div className={`mt-2 md:mt-4 h-6 md:h-8 flex items-center justify-center text-sm md:text-lg text-candy-text/60 font-bold transition-opacity ${showValue ? 'opacity-100' : 'opacity-0'}`}>
        {showValue ? `当前数值: ${currentTotal}` : '数值已隐藏'}
      </div>
    </div>
  );
};