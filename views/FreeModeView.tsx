import React, { useState } from 'react';
import { ViewState } from '../types';
import { AbacusVisual } from '../components/AbacusVisual';
import { Button } from '../components/Button';
import { LogOut } from 'lucide-react';

interface FreeModeViewProps {
  changeView: (view: ViewState) => void;
}

export const FreeModeView: React.FC<FreeModeViewProps> = ({ changeView }) => {
  // Chinese Units for 9 digits: 亿, 千万, 百万, 十万, 万, 千, 百, 十, 个
  const LABELS_9 = ['亿', '千万', '百万', '十万', '万', '千', '百', '十', '个'];
  
  const [currentValue, setCurrentValue] = useState(0);

  return (
    <div className="fixed inset-0 bg-[#FFF0F5] z-[9999] overflow-hidden">
        {/* 
            VIRTUAL LANDSCAPE CONTAINER 
            We rotate the container 90deg to force landscape UI on portrait phones.
            Origin: Top Left. 
            Translate X: 100% (to move it back into view after rotation).
        */}
        <div 
            className="w-[100vh] h-[100vw] absolute top-0 left-full origin-top-left transform rotate-90 flex flex-col items-stretch bg-gradient-to-br from-candy-pink/10 to-candy-mint/10"
        >
            {/* Header Area (in Landscape) */}
            <div className="flex justify-between items-center px-6 py-4 flex-shrink-0 z-20">
                <Button 
                    variant="neutral" 
                    size="sm" 
                    onClick={() => changeView(ViewState.HOME)}
                    className="opacity-90 hover:opacity-100 shadow-sm"
                >
                    <LogOut size={18} className="mr-1"/> 退出
                </Button>
                
                {/* Big Value Display in Header */}
                <div className="bg-white px-8 py-2 rounded-2xl shadow-sm border-2 border-candy-mint min-w-[200px] text-center">
                   <span className="text-4xl font-black text-candy-text tracking-widest font-mono">
                     {currentValue.toLocaleString()}
                   </span>
                </div>

                <div className="opacity-0 pointer-events-none w-20">
                    {/* Placeholder for center alignment */}
                </div>
            </div>

            {/* Main Content - Takes remaining space */}
            <div className="flex-1 w-full flex flex-col items-center justify-center px-4 md:px-12 pb-6 relative">
                
                {/* The Abacus fills this container */}
                <AbacusVisual 
                    showValue={false} 
                    digitCount={9} 
                    labels={LABELS_9}
                    forceLandscape={true} 
                    onChange={setCurrentValue}
                />

                <div className="absolute bottom-2 text-[10px] md:text-xs text-candy-text/30 font-bold tracking-widest pointer-events-none">
                     9档位 • 亿级运算 • 自由演练
                </div>
            </div>
        </div>
    </div>
  );
};
