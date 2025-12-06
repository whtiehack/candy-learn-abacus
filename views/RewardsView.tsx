import React, { useEffect, useState } from 'react';
import { ViewState, GameData } from '../types';
import { STICKERS } from '../constants';
import { Button } from '../components/Button';
import { saveGameData } from '../services/storageService';
import { ArrowLeft, Lock, Star, Trophy, Sparkles } from 'lucide-react';

interface RewardsViewProps {
  changeView: (view: ViewState) => void;
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ changeView, gameData, setGameData }) => {
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);

  // Check for new unlocks on mount
  useEffect(() => {
    const newlyUnlockedIds: string[] = [];
    const currentUnlocked = new Set(gameData.stickersUnlocked);

    STICKERS.forEach(sticker => {
      if (!currentUnlocked.has(sticker.id) && sticker.unlockCondition(gameData)) {
        newlyUnlockedIds.push(sticker.id);
      }
    });

    if (newlyUnlockedIds.length > 0) {
      setNewUnlocks(newlyUnlockedIds);
      const updatedData = {
        ...gameData,
        stickersUnlocked: [...gameData.stickersUnlocked, ...newlyUnlockedIds]
      };
      setGameData(updatedData);
      saveGameData(updatedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center mb-4 z-10">
        <button onClick={() => changeView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-candy-text mr-4 hover:bg-gray-50">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-candy-text tracking-wide">我的宝藏</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 pr-1 custom-scrollbar">
        
        {/* Stats Card */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           <div className="bg-gradient-to-br from-candy-yellow to-orange-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center border-b-4 border-orange-200">
              <span className="text-3xl mb-1">🍬</span>
              <span className="text-xs text-orange-800 font-bold uppercase tracking-wider">糖果总数</span>
              <span className="text-2xl font-black text-candy-text">{gameData.candies}</span>
           </div>
           <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center border-b-4 border-indigo-200">
              <span className="text-3xl mb-1">🏆</span>
              <span className="text-xs text-indigo-800 font-bold uppercase tracking-wider">答对总数</span>
              <span className="text-2xl font-black text-candy-text">{gameData.totalCorrect}</span>
           </div>
        </div>

        {/* Candy Tree Section - Magic Garden Theme */}
        <div className="relative overflow-hidden bg-gradient-to-b from-sky-200 to-green-200 rounded-[2rem] p-0 shadow-lg mb-8 border-4 border-white transform transition-transform hover:scale-[1.02] duration-500">
           {/* Decorative Background Elements */}
           <div className="absolute top-4 right-4 text-yellow-300 animate-spin-slow text-5xl opacity-80">☀️</div>
           <div className="absolute top-8 left-8 text-white text-4xl opacity-60 animate-float" style={{animationDelay: '1s'}}>☁️</div>
           <div className="absolute top-16 right-20 text-white text-3xl opacity-50 animate-float" style={{animationDelay: '2s'}}>☁️</div>
           
           <div className="relative z-10 p-5 flex flex-col items-center">
              <div className="bg-white/80 backdrop-blur-md px-4 py-1 rounded-full mb-4 shadow-sm">
                <h3 className="text-lg font-bold text-green-700 flex items-center gap-2">
                  <span className="text-xl">🌳</span> 糖果树花园
                </h3>
              </div>
              
              <div className="relative h-60 w-full flex items-center justify-center">
                  {/* Tree Visual */}
                  <div className="relative w-40 h-56 flex flex-col items-center justify-end">
                     {/* Trunk */}
                     <div className="w-10 h-24 bg-amber-700 rounded-lg relative z-10">
                        <div className="absolute top-4 left-2 w-2 h-10 bg-amber-800/30 rounded-full"></div>
                     </div>
                     
                     {/* Foliage */}
                     <div className="absolute bottom-16 w-40 h-40 bg-green-500 rounded-full shadow-lg z-20 flex items-center justify-center">
                        <div className="w-36 h-36 bg-green-400 rounded-full border-4 border-green-300/50"></div>
                     </div>
                     <div className="absolute bottom-24 left-[-20px] w-24 h-24 bg-green-500 rounded-full z-10"></div>
                     <div className="absolute bottom-24 right-[-20px] w-24 h-24 bg-green-500 rounded-full z-10"></div>
                     
                     {/* Hanging Candies */}
                     <div className="absolute inset-0 z-30 pointer-events-none">
                        {Array.from({ length: Math.min(gameData.candies, 20) }).map((_, i) => (
                          <div 
                            key={i} 
                            className="absolute text-xl animate-float drop-shadow-md"
                            style={{
                               top: `${10 + (i * 19) % 50}%`,
                               left: `${15 + (i * 23) % 70}%`,
                               animationDuration: `${3 + (i % 2)}s`,
                               animationDelay: `${i * 0.2}s`
                            }}
                          >
                            🍬
                          </div>
                        ))}
                     </div>
                  </div>
                  
                  {/* Floor */}
                  <div className="absolute bottom-0 w-full h-4 bg-green-600/20 rounded-full blur-md"></div>
              </div>
              
              <div className="bg-white/90 px-3 py-1 rounded-lg text-xs font-bold text-green-800 mt-2 shadow-sm">
                每答对1题，树上就多一颗糖果哦！
              </div>
           </div>
        </div>

        {/* Stickers Collection */}
        <div className="flex items-center gap-2 mb-4">
           <h3 className="text-xl font-bold text-candy-text">贴纸收集册</h3>
           <span className="bg-candy-pink text-white text-xs font-bold px-2 py-0.5 rounded-full">
             {gameData.stickersUnlocked.length} / {STICKERS.length}
           </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {STICKERS.map(sticker => {
            const isUnlocked = gameData.stickersUnlocked.includes(sticker.id);
            const isNew = newUnlocks.includes(sticker.id);

            return (
              <div 
                key={sticker.id}
                className={`
                  relative aspect-square rounded-[1.5rem] p-3 flex flex-col items-center justify-between text-center transition-all duration-300
                  ${isUnlocked 
                    ? 'bg-white shadow-lg border-2 border-white shine-effect transform hover:-translate-y-1 hover:shadow-xl' 
                    : 'bg-gray-100/80 border-2 border-dashed border-gray-300 shadow-inner'
                  }
                `}
              >
                {isNew && (
                  <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce shadow-md z-20 border-2 border-white">
                    NEW!
                  </div>
                )}
                
                <div className="flex-1 w-full flex items-center justify-center relative">
                  {isUnlocked ? (
                    <>
                       {/* Background Glow for unlocked */}
                       <div className="absolute inset-0 bg-gradient-to-t from-candy-pink/10 to-transparent rounded-full scale-75 blur-xl"></div>
                       <img src={sticker.imageUrl} alt={sticker.name} className="w-24 h-24 object-contain drop-shadow-md relative z-10 animate-pop-in" />
                    </>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-300 rounded-full blur-lg opacity-20"></div>
                      <Lock className="text-gray-300 w-12 h-12" />
                    </div>
                  )}
                </div>

                <div className="w-full">
                  {isUnlocked ? (
                    <div className="font-bold text-candy-text text-sm bg-candy-yellow/30 rounded-lg py-1 px-2 w-full truncate">
                      {sticker.name}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-[10px] leading-tight px-1 h-8 flex items-center justify-center bg-gray-200/50 rounded-lg">
                      {sticker.requirementText}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State / Hint */}
        {STICKERS.length > gameData.stickersUnlocked.length && (
           <div className="mt-6 text-center text-sm text-candy-text/50 bg-white/50 p-4 rounded-xl border border-dashed border-candy-pink/30">
              <Sparkles className="inline-block w-4 h-4 mr-1 align-text-bottom" />
              继续做题来解锁更多可爱的贴纸吧！
           </div>
        )}

      </div>
    </div>
  );
};