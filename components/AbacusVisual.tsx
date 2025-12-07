import React, { useState, useEffect, useRef } from 'react';
import { MathProblem } from '../types';
import { RotateCcw } from 'lucide-react';
import { audioService } from '../services/audioService';

interface AbacusVisualProps {
  problem: MathProblem;
  showValue: boolean;
  onChange?: (value: number) => void;
}

// 触控判定阈值 (px)
const TAP_THRESHOLD = 10; 
const DRAG_THRESHOLD = 10;

// Single Abacus Bead Component
const Bead: React.FC<{ 
  active: boolean; 
  type: 'heaven' | 'earth';
  colorClass: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}> = ({ active, type, colorClass, onPointerDown, onPointerMove, onPointerUp }) => {
  
  // 增加位移距离，视觉反馈更明显
  // 天珠向下移动，地珠向上移动
  const translateClass = type === 'heaven'
    ? (active ? 'translate-y-[35px] md:translate-y-[45px]' : 'translate-y-0') 
    : (active ? 'translate-y-[-35px] md:translate-y-[-45px]' : 'translate-y-0'); 

  return (
    <div 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp} // Cancel 视为 Up，防止卡住
      onPointerLeave={onPointerUp} 
      className={`
        relative 
        w-14 h-9 md:w-20 md:h-12 
        rounded-full shadow-lg border border-white/40 
        cursor-pointer z-10 transition-transform duration-100 ease-out
        flex items-center justify-center touch-none select-none
        ${colorClass}
        ${translateClass}
        active:brightness-110
      `}
      style={{ touchAction: 'none' }} // 再次强制禁用浏览器默认手势
    >
       {/* 高光效果，增加立体感 */}
       <div className="w-full h-full rounded-full bg-black/5 absolute top-0 left-0 scale-95 blur-[1px] pointer-events-none"></div>
       <div className="w-8 h-3 md:w-12 md:h-4 bg-white/40 rounded-full absolute top-1.5 left-3 blur-[2px] pointer-events-none"></div>
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

  const heavenDragRef = useRef<{ id: number, startY: number, initialActive: boolean } | null>(null);
  const earthDragRef = useRef<{ id: number, startY: number, initialValue: number } | null>(null);

  // Helper to update and play sound only if value changes
  const updateWithSound = (updater: (prev: number) => number) => {
    onUpdate(prev => {
      const next = updater(prev);
      if (next !== prev) {
        audioService.play('bead');
      }
      return next;
    });
  };

  // --- Heaven Bead Logic (Upper Deck) ---
  const handleHeavenPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    heavenDragRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      initialActive: heavenActive
    };
  };

  const handleHeavenPointerMove = (e: React.PointerEvent) => {
    if (!heavenDragRef.current || heavenDragRef.current.id !== e.pointerId) return;
    const deltaY = e.clientY - heavenDragRef.current.startY;
    const wasActive = heavenDragRef.current.initialActive;

    // 拖拽判定
    if (!wasActive && deltaY > DRAG_THRESHOLD) {
      updateWithSound(prev => (prev >= 5 ? prev : prev + 5)); // 向下拉：激活
    } else if (wasActive && deltaY < -DRAG_THRESHOLD) {
      updateWithSound(prev => (prev >= 5 ? prev - 5 : prev)); // 向上推：取消
    }
  };

  const handleHeavenPointerUp = (e: React.PointerEvent) => {
    if (!heavenDragRef.current || heavenDragRef.current.id !== e.pointerId) return;
    const deltaY = Math.abs(e.clientY - heavenDragRef.current.startY);
    
    // 如果移动距离很小，视为点击 (Toggle)
    if (deltaY < TAP_THRESHOLD) {
      updateWithSound(prev => (prev >= 5 ? prev - 5 : prev + 5));
    }
    
    heavenDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };


  // --- Earth Bead Logic (Lower Deck) ---
  const handleEarthPointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    earthDragRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      initialValue: earthCount
    };
  };

  const handleEarthPointerMove = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current || earthDragRef.current.id !== e.pointerId) return;
    const deltaY = e.clientY - earthDragRef.current.startY;

    // 拖拽逻辑：模拟物理算盘
    if (deltaY < -DRAG_THRESHOLD) {
      // 向上推 -> 增加数值
      // 比如推第2颗珠子(index=1)，目标值就是2
      updateWithSound(prev => {
        const h = prev >= 5 ? 5 : 0;
        // 只有当目标位置大于当前值时才更新，避免来回抖动
        if (index + 1 > prev % 5) return h + (index + 1);
        return prev;
      });
    } else if (deltaY > DRAG_THRESHOLD) {
      // 向下拉 -> 减少数值
      updateWithSound(prev => {
        const h = prev >= 5 ? 5 : 0;
        // 拉第2颗珠子(index=1)，意味着只保留index 0，数值变为1?
        // 不，通常拉动的是最下面那颗悬浮的珠子。
        // 为了简化，拖动判定为：只要向下拉，就试图让这颗珠子回到下方
        if (index < prev % 5) return h + index; 
        return prev;
      });
    }
  };

  const handleEarthPointerUp = (e: React.PointerEvent, index: number) => {
    if (!earthDragRef.current || earthDragRef.current.id !== e.pointerId) return;
    const deltaY = Math.abs(e.clientY - earthDragRef.current.startY);
    
    // 点击逻辑 (Tap Logic) - 这是最常用的交互
    if (deltaY < TAP_THRESHOLD) {
       updateWithSound(prev => {
          const h = prev >= 5 ? 5 : 0;
          const currentE = prev % 5;
          
          // 智能判断意图：
          // 如果点击的珠子已经是激活状态 (index < currentE)，说明想把它拨下来 -> 设为 index
          // 如果点击的珠子是未激活状态 (index >= currentE)，说明想把它拨上去 -> 设为 index + 1
          
          if (index < currentE) {
            // 点击的是已经拨上去的珠子，意图是取消它
            // 例如当前是3 (0,1,2都在上面)，点击2，变成2。点击1，变成1。点击0，变成0。
            return h + index;
          } else {
            // 点击的是下面的珠子，意图是拨上去
            // 例如当前是0，点击0，变成1。点击2，变成3。
            return h + (index + 1);
          }
       });
    }

    earthDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col items-center mx-1 md:mx-3 relative flex-1 min-w-[4rem] md:min-w-[6rem] touch-none">
      <div className="text-gray-500 font-bold mb-1 text-sm md:text-base select-none pointer-events-none">{label}</div>
      
      {/* 贯穿轴 (Rod Stick) */}
      <div className="absolute top-8 bottom-4 w-1.5 md:w-2 bg-amber-800/80 z-0 pointer-events-none rounded-full shadow-inner"></div>
      
      <div className="bg-candy-mint/10 border border-candy-mint/30 rounded-xl p-1 relative z-0 flex flex-col items-center select-none touch-none w-full">
        
        {/* Heaven Deck (天珠区) */}
        <div className="
           h-[75px] w-full md:h-[100px] 
           flex justify-center items-start 
           bg-white/30 rounded-t-lg relative z-10
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
        
        {/* Beam (横梁 - 关键修改：增加间隔) */}
        <div className="
            w-[110%] h-5 md:h-6 
            bg-amber-900 rounded shadow-md border-y border-amber-950/50
            relative z-20 my-1 md:my-2
            flex items-center justify-center
        ">
            {/* 梁上的装饰点 */}
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full mx-0.5"></div>
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full mx-0.5"></div>
        </div>
        
        {/* Earth Deck (地珠区) */}
        <div className="
           h-[180px] w-full md:h-[240px]
           flex flex-col justify-end items-center 
           bg-white/30 rounded-b-lg gap-2 md:gap-3 pb-2 relative z-10
        ">
           {/* Index 0 is visually top (physically closest to beam when active) */}
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
    audioService.play('click'); 
  };

  return (
    <div className="w-full flex flex-col items-center mb-2 md:mb-6">
      {/* 算盘外框 */}
      <div className="relative bg-amber-100 p-2 md:p-4 rounded-xl shadow-2xl border-4 border-amber-800 flex items-end justify-center gap-1 md:gap-4 max-w-full touch-none select-none">
        
        {/* 算盘背景纹理 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-50 rounded-lg pointer-events-none"></div>

        <Rod label="百" value={values[0]} onUpdate={(updater) => updateRod(0, updater)} />
        <Rod label="十" value={values[1]} onUpdate={(updater) => updateRod(1, updater)} />
        <Rod label="个" value={values[2]} onUpdate={(updater) => updateRod(2, updater)} />
        
        <button 
          onClick={reset}
          className="absolute -top-3 -right-2 md:-right-6 bg-red-400 text-white p-2 md:p-3 rounded-full shadow-lg hover:bg-red-500 transition-colors z-30 border-2 border-white"
          title="清空算盘"
        >
          <RotateCcw size={16} className="md:w-6 md:h-6" />
        </button>
      </div>
      
      <div className={`mt-2 h-6 md:h-8 flex items-center justify-center text-sm md:text-xl text-candy-text font-bold transition-opacity ${showValue ? 'opacity-100' : 'opacity-0'}`}>
        {showValue ? `当前数值: ${currentTotal}` : '数值已隐藏'}
      </div>
    </div>
  );
};