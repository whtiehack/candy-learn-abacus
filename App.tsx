import React, { useState, useEffect } from 'react';
import { loadGameData } from './services/storageService';
import { GameData, ViewState } from './types';
import { HomeView } from './views/HomeView';
import { GameView } from './views/GameView';
import { RewardsView } from './views/RewardsView';
import { SettingsView } from './views/SettingsView';
import { LevelSelectView } from './views/LevelSelectView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [gameData, setGameData] = useState<GameData | null>(null);

  // Load data on mount
  useEffect(() => {
    const data = loadGameData();
    setGameData(data);
  }, []);

  if (!gameData) return null; 

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView changeView={setCurrentView} candies={gameData.candies} />;
      case ViewState.LEVEL_SELECT:
        return <LevelSelectView changeView={setCurrentView} gameData={gameData} setGameData={setGameData} />;
      case ViewState.GAME:
        return <GameView changeView={setCurrentView} gameData={gameData} setGameData={setGameData} />;
      case ViewState.REWARDS:
        return <RewardsView changeView={setCurrentView} gameData={gameData} setGameData={setGameData} />;
      case ViewState.SETTINGS:
        return <SettingsView changeView={setCurrentView} gameData={gameData} setGameData={setGameData} />;
      default:
        return <HomeView changeView={setCurrentView} candies={gameData.candies} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-candy-pink/30 flex items-center justify-center p-4 font-sans text-candy-text select-none">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-[40px] shadow-2xl overflow-hidden h-[85vh] relative flex flex-col border-4 border-white">
        
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 opacity-50">
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-candy-mint rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-candy-yellow rounded-full blur-3xl"></div>
        </div>

        <main className="flex-1 p-6 relative z-10 overflow-hidden">
          {renderView()}
        </main>

      </div>
    </div>
  );
};

export default App;