import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { Play, Settings, Trophy, Palette } from 'lucide-react';

interface HomeViewProps {
  changeView: (view: ViewState) => void;
  candies: number;
}

export const HomeView: React.FC<HomeViewProps> = ({ changeView, candies }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 md:space-y-8 animate-fade-in w-full">
      <div className="text-center space-y-2 md:space-y-4 flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-black text-candy-text tracking-wider drop-shadow-sm leading-tight">
          糖果的<br/>
          <span className="text-candy-darkPink">珠心算小屋</span>
        </h1>
        <div className="relative inline-block mt-2 md:mt-4">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center border-4 border-candy-mint shadow-xl">
             <svg viewBox="0 0 100 100" className="w-24 h-24 md:w-28 md:h-28 text-candy-pink">
                <circle cx="50" cy="50" r="40" fill="currentColor" />
                <circle cx="35" cy="40" r="5" fill="white" />
                <circle cx="65" cy="40" r="5" fill="white" />
                <path d="M 40 60 Q 50 70 60 60" stroke="white" strokeWidth="3" fill="none" />
                <path d="M 20 20 L 30 40 L 40 20 Z" fill="currentColor" />
                <path d="M 60 20 L 70 40 L 80 20 Z" fill="currentColor" />
             </svg>
          </div>
          <div className="absolute -top-2 -right-2 bg-candy-yellow text-candy-text text-xs font-bold px-3 py-1 rounded-full shadow-md border border-white transform rotate-12 whitespace-nowrap">
             拥有的糖果: {candies} 🍬
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3 md:space-y-4 flex-1 flex flex-col justify-center">
        <Button 
          variant="primary" 
          size="xl" 
          onClick={() => changeView(ViewState.LEVEL_SELECT)}
          icon={<Play fill="currentColor" />}
          className="w-full py-4 md:py-6 text-xl md:text-3xl"
        >
          开始游戏
        </Button>
        
        <Button 
          variant="secondary" // Reusing secondary style but maybe we can customize color via className
          size="lg" 
          onClick={() => changeView(ViewState.FREE_MODE)}
          icon={<Palette />}
          className="w-full bg-cyan-200 hover:bg-cyan-300 border-cyan-400 text-cyan-900"
        >
          自由练习 (9档)
        </Button>

        <Button 
          variant="secondary" 
          size="lg" 
          onClick={() => changeView(ViewState.REWARDS)}
          icon={<Trophy />}
          className="w-full"
        >
          我的奖励
        </Button>

        <Button 
          variant="neutral" 
          size="md" 
          onClick={() => changeView(ViewState.SETTINGS)}
          icon={<Settings />}
          className="w-full opacity-80"
        >
          家长设置
        </Button>
      </div>
      
      {/* Footer spacer */}
      <div className="h-4"></div>
    </div>
  );
};
