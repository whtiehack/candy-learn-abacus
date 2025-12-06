import React, { useState } from 'react';
import { ViewState, GameData } from '../types';
import { Button } from '../components/Button';
import { saveGameData } from '../services/storageService';
import { INITIAL_GAME_DATA } from '../constants';
import { ArrowLeft, Trash2, Volume2, VolumeX, Calculator, Calendar, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface SettingsViewProps {
  changeView: (view: ViewState) => void;
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ changeView, gameData, setGameData }) => {
  const [confirmReset, setConfirmReset] = useState(false);
  
  const toggleSetting = (key: keyof typeof gameData.settings) => {
    const updated = {
      ...gameData,
      settings: {
        ...gameData.settings,
        [key]: !gameData.settings[key]
      }
    };
    setGameData(updated);
    saveGameData(updated);
  };

  const updateDailyLimit = (val: number) => {
    const updated = {
      ...gameData,
      settings: {
        ...gameData.settings,
        dailyLimit: val
      }
    };
    setGameData(updated);
    saveGameData(updated);
  };

  const handleReset = () => {
    if (confirmReset) {
      const freshData = JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
      setGameData(freshData);
      saveGameData(freshData);
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-6">
        <button onClick={() => changeView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-candy-text mr-4">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold text-candy-text">家长设置</h2>
      </div>

      <div className="space-y-6 bg-white rounded-3xl p-6 shadow-sm border border-candy-pink/20 flex-1 overflow-y-auto">
        
        {/* Toggle Abacus */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-500"><Calculator size={20} /></div>
             <div>
               <h4 className="font-bold text-gray-700">显示虚拟算盘</h4>
               <p className="text-xs text-gray-400">辅助孩子理解数量关系</p>
             </div>
          </div>
          <button 
            onClick={() => toggleSetting('useAbacus')}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${gameData.settings.useAbacus ? 'bg-candy-mint' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${gameData.settings.useAbacus ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Toggle Abacus Value */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-500">
                {gameData.settings.showAbacusValue ? <Eye size={20} /> : <EyeOff size={20} />}
             </div>
             <div>
               <h4 className="font-bold text-gray-700">显示算盘数值</h4>
               <p className="text-xs text-gray-400">关闭可增加读数难度</p>
             </div>
          </div>
          <button 
            onClick={() => toggleSetting('showAbacusValue')}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${gameData.settings.showAbacusValue ? 'bg-candy-mint' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${gameData.settings.showAbacusValue ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

         {/* Toggle Sound */}
         <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                {gameData.settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
             </div>
             <div>
               <h4 className="font-bold text-gray-700">音效开关</h4>
             </div>
          </div>
          <button 
            onClick={() => toggleSetting('soundEnabled')}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${gameData.settings.soundEnabled ? 'bg-candy-mint' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${gameData.settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Range Option */}
        <div className="py-2 border-b border-gray-100">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-green-100 rounded-lg text-green-500"><Calendar size={20} /></div>
             <div>
               <h4 className="font-bold text-gray-700">每日题量限制: {gameData.settings.dailyLimit}</h4>
             </div>
          </div>
          <input 
            type="range" 
            min="5" 
            max="50" 
            step="5"
            value={gameData.settings.dailyLimit}
            onChange={(e) => updateDailyLimit(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-candy-pink"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5题</span>
            <span>50题</span>
          </div>
        </div>

        <div className="pt-8 pb-4">
           <Button 
             variant={confirmReset ? "danger" : "neutral"} 
             size="sm" 
             onClick={handleReset} 
             icon={confirmReset ? <AlertTriangle size={16}/> : <Trash2 size={16}/>} 
             className={`w-full transition-all duration-300 border-2 ${confirmReset ? 'bg-red-500 text-white border-red-600 scale-105' : 'text-gray-500 border-gray-200 hover:text-red-500 hover:border-red-200'}`}
           >
             {confirmReset ? "再次点击确认清空数据!" : "重置所有游戏进度"}
           </Button>
           <p className="text-center text-xs text-gray-400 mt-3">v1.3.0 Candy's Abacus</p>
        </div>

      </div>
    </div>
  );
};