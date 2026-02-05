import React, { useState, useEffect } from 'react';
import { loadGameData } from './services/storageService';
import { GameData, ViewState } from './types';
import { HomeView } from './views/HomeView';
import { GameView } from './views/GameView';
import { RewardsView } from './views/RewardsView';
import { SettingsView } from './views/SettingsView';
import { LevelSelectView } from './views/LevelSelectView';
import { FreeModeView } from './views/FreeModeView';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [gameData, setGameData] = useState<GameData | null>(null);

  useEffect(() => {
    const data = loadGameData();
    setGameData(data);
  }, []);

  useEffect(() => {
    if (gameData) {
      audioService.setGlobalEnabled(gameData.settings.soundEnabled);
    }
  }, [gameData]);

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
      case ViewState.FREE_MODE:
        // Free Mode handles its own layout/rotation
        return <FreeModeView changeView={setCurrentView} />;
      default:
        return <HomeView changeView={setCurrentView} candies={gameData.candies} />;
    }
  };

  // Special handling for Free Mode to bypass the standard container restrictions
  if (currentView === ViewState.FREE_MODE) {
    return (
      <div className="h-full w-full overflow-hidden bg-[#FFF0F5] font-sans text-candy-text select-none">
         {renderView()}
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-[#FFF0F5] flex items-center justify-center font-sans text-candy-text select-none">
      
      {/* Container */}
      <div className="
        w-full h-full 
        md:max-w-[480px] md:h-[85vh] md:max-h-[850px]
        bg-white md:bg-white
        md:rounded-[40px] md:shadow-2xl md:border-8 md:border-white 
        relative flex flex-col overflow-hidden
      ">
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden w-full h-full">
          <div className="flex-1 flex flex-col h-full w-full p-3 pt-safe pb-safe md:p-6">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
