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
    // Mobile: Full screen, white/glass bg. Desktop: Centered card with pink background.
    // Changed h-[100dvh] to h-full because body is now fixed height 100%
    <div className="h-full w-full overflow-hidden bg-[#FFF0F5] md:bg-candy-pink/30 flex items-center justify-center font-sans text-candy-text select-none">
      
      {/* Container: On mobile it fills screen. On Desktop it's a fixed card. */}
      <div className="
        w-full h-full 
        md:max-w-[480px] md:h-[85vh] md:max-h-[850px]
        bg-white/90 md:bg-white/80 backdrop-blur-md 
        md:rounded-[40px] md:shadow-2xl md:border-4 md:border-white 
        relative flex flex-col overflow-hidden
      ">
        
        {/* Decorative Background Blobs (Visible on both, but constrained to container) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 opacity-50">
          <div className="absolute top-[-10%] right-[-20%] w-[60%] pt-[60%] bg-candy-mint rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-[-10%] left-[-20%] w-[60%] pt-[60%] bg-candy-yellow rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>

        <main className="flex-1 flex flex-col relative z-10 overflow-hidden w-full h-full">
          <div className="flex-1 flex flex-col h-full w-full p-4 pt-safe pb-safe md:p-6">
            {renderView()}
          </div>
        </main>

      </div>
    </div>
  );
};

export default App;