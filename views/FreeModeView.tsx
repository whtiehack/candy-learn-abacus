import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { AbacusVisual } from '../components/AbacusVisual';
import { Button } from '../components/Button';
import { LogOut, RotateCw } from 'lucide-react';

interface FreeModeViewProps {
  changeView: (view: ViewState) => void;
}

export const FreeModeView: React.FC<FreeModeViewProps> = ({ changeView }) => {
  // Chinese Units for 9 digits
  const LABELS_9 = ['亿', '千万', '百万', '十万', '万', '千', '百', '十', '个'];
  
  const [currentValue, setCurrentValue] = useState(0);
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if width is less than height (Portrait)
      setIsPortrait(window.innerWidth < window.innerHeight);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleExit = () => {
    changeView(ViewState.HOME);
  };

  // --- RENDER CONTENT ---
  // We extract the inner content because it looks the same in both modes,
  // just the container wrapping it changes.
  const Content = () => (
    <div className="flex flex-col h-full w-full relative bg-gradient-to-br from-candy-pink/10 to-candy-mint/10">
      
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 md:px-8 md:py-4 flex-shrink-0 z-20">
          <Button 
              variant="neutral" 
              size="sm" 
              onClick={handleExit}
              className="opacity-90 hover:opacity-100 shadow-sm bg-white/80 backdrop-blur-sm"
          >
              <LogOut size={18} className="mr-1"/> 退出
          </Button>
          
          {/* Value Display */}
          <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-2xl shadow-sm border-2 border-candy-mint min-w-[180px] text-center mx-4">
             <span className="text-3xl md:text-4xl font-black text-candy-text tracking-widest font-mono">
               {currentValue.toLocaleString()}
             </span>
          </div>

          {/* Placeholder or Help */}
          <div className="w-20 flex justify-end">
             {/* Could add a reset button here if needed, but abacus has one */}
          </div>
      </div>

      {/* Abacus Container */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-2 pb-2 md:px-8 md:pb-6 relative overflow-hidden">
          <AbacusVisual 
              showValue={false} 
              digitCount={9} 
              labels={LABELS_9}
              forceLandscape={isPortrait} // Only change coordinate mapping if we are rotating via CSS
              onChange={setCurrentValue}
          />

          <div className="absolute bottom-2 text-[10px] md:text-xs text-candy-text/30 font-bold tracking-widest pointer-events-none select-none">
               9档位 • 亿级运算 • 自由演练
          </div>
      </div>
    </div>
  );

  // --- LAYOUT LOGIC ---

  if (isPortrait) {
    // FORCE LANDSCAPE MODE (Virtual Rotation)
    // We rotate the container 90deg CW.
    // Dimensions are swapped: Width = 100vh, Height = 100vw.
    return (
      <div className="fixed inset-0 bg-[#FFF0F5] z-[9999] overflow-hidden touch-none">
         <div 
            className="origin-top-left absolute top-0 left-full transform rotate-90 touch-none"
            style={{ width: '100vh', height: '100vw' }}
         >
            <Content />
         </div>
      </div>
    );
  } else {
    // NATIVE LANDSCAPE / DESKTOP MODE
    // Standard full screen rendering
    return (
      <div className="fixed inset-0 bg-[#FFF0F5] z-[9999] overflow-hidden flex flex-col touch-none">
         <Content />
      </div>
    );
  }
};
