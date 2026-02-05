import React from 'react';
import { ViewState } from '../types';
import { AbacusVisual } from '../components/AbacusVisual';
import { Button } from '../components/Button';
import { RotateCcw, LogOut } from 'lucide-react';

interface FreeModeViewProps {
  changeView: (view: ViewState) => void;
}

export const FreeModeView: React.FC<FreeModeViewProps> = ({ changeView }) => {
  // Chinese Units for 9 digits: 亿, 千万, 百万, 十万, 万, 千, 百, 十, 个
  const LABELS_9 = ['亿', '千万', '百万', '十万', '万', '千', '百', '十', '个'];

  return (
    <div className="fixed inset-0 bg-[#FFF0F5] z-[9999] overflow-hidden">
        {/* 
            VIRTUAL LANDSCAPE CONTAINER 
            We rotate the container 90deg to force landscape UI on portrait phones.
            Origin: Top Left. 
            Translate X: 100% (to move it back into view after rotation).
        */}
        <div 
            className="w-[100vh] h-[100vw] absolute top-0 left-full origin-top-left transform rotate-90 flex flex-col items-center justify-center bg-gradient-to-br from-candy-pink/10 to-candy-mint/10"
        >
            {/* Header Area (in Landscape) */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                     <Button 
                        variant="neutral" 
                        size="sm" 
                        onClick={() => changeView(ViewState.HOME)}
                        className="opacity-80 hover:opacity-100 shadow-md"
                     >
                        <LogOut size={16} className="mr-1"/> 退出
                     </Button>
                </div>
                
                <div className="text-center opacity-30 pointer-events-none">
                    <h1 className="text-4xl font-black text-candy-text tracking-[0.2em]">自由练习</h1>
                </div>

                <div className="pointer-events-auto opacity-0">
                    {/* Placeholder for symmetry */}
                    <Button variant="neutral" size="sm">Help</Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="scale-[0.85] md:scale-100 transform transition-transform duration-300">
                <AbacusVisual 
                    showValue={true} 
                    digitCount={9} 
                    labels={LABELS_9}
                    forceLandscape={true} // Crucial for touch mapping
                />
            </div>

            <div className="absolute bottom-4 text-xs text-candy-text/40">
                请横持手机体验 9 档大算盘 • 自由拨珠无限制
            </div>
        </div>
    </div>
  );
};
