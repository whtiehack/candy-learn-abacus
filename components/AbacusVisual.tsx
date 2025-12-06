import React, { useState, useEffect } from 'react';
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
  onClick: () => void; 
  type: 'heaven' | 'earth';
  colorClass: string;
}> = ({ active, onClick, type, colorClass }) => {
  const translateClass = type === 'heaven'
    ? (active ? 'translate-y-[24px]' : 'translate-y-0') 
    : (active ? 'translate-y-[-24px]' : 'translate-y-0'); 

  return (
    <div 
      onClick={onClick}
      className={`
        relative w-12 h-8 rounded-full shadow-inner border border-white/30 
        cursor-pointer z-10 transition-transform duration-300 ease-out
        flex items-center justify-center
        ${colorClass}
        ${translateClass}
      `}
    >
       <div className="w-full h-full rounded-full bg-black/10 absolute top-0 left-0 scale-90 blur-[1px]"></div>
       <div className="w-8 h-3 bg-white/30 rounded-full absolute top-1 left-2 blur-[2px]"></div>
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

  const toggleHeaven = () => {
    if (heavenActive) onChange(value - 5);
    else onChange(value + 5);
  };

  const setEarth = (index: number) => {
    if (index < earthCount) {
      onChange((heavenActive ? 5 : 0) + index);
    } else {
      onChange((heavenActive ? 5 : 0) + index + 1);
    }
  };

  return (
    <div className="flex flex-col items-center mx-1 relative">
      <div className="text-gray-500 font-bold mb-1 text-sm">{label}</div>
      <div className="absolute top-8 bottom-8 w-1 bg-amber-800/60 z-0"></div>
      <div className="bg-candy-mint/20 border-2 border-candy-mint rounded-lg p-1 relative z-0">
        <div className="h-[64px] w-14 flex justify-center items-start bg-white/40 rounded-t-md mb-0.5 border-b-4 border-amber-800 relative">
           <Bead type="heaven" active={heavenActive} onClick={toggleHeaven} colorClass="bg-candy-darkPink" />
        </div>
        <div className="h-[160px] w-14 flex flex-col justify-end items-center bg-white/40 rounded-b-md gap-1 pb-1 relative">
           {[0, 1, 2, 3].map(i => (
             <Bead key={i} type="earth" active={i < earthCount} onClick={() => setEarth(i)} colorClass="bg-candy-yellow" />
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
    const newValues = [...values] as [number, number, number];
    newValues[index] = val;
    setValues(newValues);
    
    // Calculate total immediately for parent
    const total = newValues[0] * 100 + newValues[1] * 10 + newValues[2];
    if (onChange) onChange(total);
  };

  const currentTotal = values[0] * 100 + values[1] * 10 + values[2];

  const reset = () => {
    setValues([0, 0, 0]);
    if (onChange) onChange(0);
  };

  return (
    <div className="w-full flex flex-col items-center mb-6">
      <div className="relative bg-white p-4 rounded-3xl shadow-xl border-4 border-candy-mint flex items-end gap-2">
        <Rod label="百" value={values[0]} onChange={(v) => updateRod(0, v)} />
        <Rod label="十" value={values[1]} onChange={(v) => updateRod(1, v)} />
        <Rod label="个" value={values[2]} onChange={(v) => updateRod(2, v)} />
        
        {/* Reset Button */}
        <button 
          onClick={reset}
          className="absolute -top-3 -right-3 bg-red-400 text-white p-2 rounded-full shadow-md hover:bg-red-500 transition-colors"
          title="清空算盘"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      
      <div className={`mt-2 h-6 flex items-center justify-center text-sm text-candy-text/60 font-bold transition-opacity ${showValue ? 'opacity-100' : 'opacity-0'}`}>
        {showValue ? `算盘当前数值: ${currentTotal}` : '数值已隐藏'}
      </div>
    </div>
  );
};