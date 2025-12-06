import React from 'react';
import { ViewState, GameData, Difficulty } from '../types';
import { Button } from '../components/Button';
import { saveGameData } from '../services/storageService';
import { ArrowLeft, Zap, Layers, Activity, Star, Hash } from 'lucide-react';

interface LevelSelectViewProps {
  changeView: (view: ViewState) => void;
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
}

export const LevelSelectView: React.FC<LevelSelectViewProps> = ({ changeView, gameData, setGameData }) => {
  
  const selectDifficulty = (diff: Difficulty) => {
    const updated = {
      ...gameData,
      settings: {
        ...gameData.settings,
        difficulty: diff
      }
    };
    setGameData(updated);
    saveGameData(updated);
    changeView(ViewState.GAME);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4">
        <button onClick={() => changeView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-candy-text mr-4">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold text-candy-text">选择挑战难度</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
        
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={() => selectDifficulty('digit1_upto10')}
          className="w-full py-6 text-xl flex flex-col items-start gap-1 h-auto"
        >
           <div className="flex items-center gap-2 font-bold">
             <Star size={24} />
             <span>10以内加减</span>
           </div>
           <span className="text-sm opacity-70 font-normal">1位数运算，结果不超过10 (如: 3 + 5)</span>
        </Button>

        <Button 
          variant="secondary" 
          size="lg" 
          onClick={() => selectDifficulty('digit1_upto20')}
          className="w-full py-6 text-xl flex flex-col items-start gap-1 h-auto"
        >
           <div className="flex items-center gap-2 font-bold">
             <Activity size={24} />
             <span>20以内加减 (进位)</span>
           </div>
           <span className="text-sm opacity-70 font-normal">1位数运算，结果可超10 (如: 8 + 7)</span>
        </Button>

        <Button 
          variant="primary" 
          size="lg" 
          onClick={() => selectDifficulty('digit2')}
          className="w-full py-6 text-xl flex flex-col items-start gap-1 h-auto"
        >
           <div className="flex items-center gap-2 font-bold">
             <Hash size={24} />
             <span>两位数加减</span>
           </div>
           <span className="text-sm opacity-70 font-normal">挑战大数字 (如: 23 + 45)</span>
        </Button>

        <Button 
          variant="neutral" 
          size="lg" 
          onClick={() => selectDifficulty('chain3')}
          className="w-full py-6 text-xl flex flex-col items-start gap-1 h-auto bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800"
        >
           <div className="flex items-center gap-2 font-bold">
             <Layers size={24} />
             <span>1位数3连加减</span>
           </div>
           <span className="text-sm opacity-70 font-normal">三个数混合运算 (如: 8 + 5 - 3)</span>
        </Button>

        <Button 
          variant="danger" 
          size="lg" 
          onClick={() => selectDifficulty('chain4')}
          className="w-full py-6 text-xl flex flex-col items-start gap-1 h-auto"
        >
           <div className="flex items-center gap-2 font-bold">
             <Zap size={24} />
             <span>1位数4连加减</span>
           </div>
           <span className="text-sm opacity-70 font-normal">四个数混合运算 (如: 9 - 2 + 5 - 4)</span>
        </Button>

      </div>
    </div>
  );
};