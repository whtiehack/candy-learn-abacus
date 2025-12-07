import React, { useEffect, useState } from 'react';
import { ViewState, GameData } from '../types';
import { STICKERS } from '../constants';
import { Button } from '../components/Button';
import { saveGameData } from '../services/storageService';
import { ArrowLeft, Lock, Star, Trophy, Sparkles, Gift } from 'lucide-react';

interface RewardsViewProps {
  changeView: (view: ViewState) => void;
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
}

const CountUp: React.FC<{ end: number; duration?: number }> = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      
      setCount(Math.floor(end * easeOut));

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return <span>{count}</span>;
};

export const RewardsView: React.FC<RewardsViewProps> = ({ changeView, gameData, setGameData }) => {
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

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
      setShowConfetti(true);
      const updatedData = {
        ...gameData,
        stickersUnlocked: [...gameData.stickersUnlocked, ...newlyUnlockedIds]
      };
      setGameData(updatedData);
      saveGameData(updatedData);
      
      // Hide confetti after a few seconds
      setTimeout(() => setShowConfetti(false), 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {/* Simple Confetti Effect for New Unlocks */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute text-2xl animate-fall-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            >
              {['✨', '🎉', '🌟', '💖'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {/* Navbar */}
      <div className="flex items-center mb-4 z-10 flex-shrink-0">
        <button onClick={() => changeView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-candy-text mr-4 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-candy-text tracking-wide flex items-center gap-2">
           我的宝藏 <Gift className="text-candy-darkPink animate-bounce-short" />
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-visible pb-8 px-2 md:px-4 custom-scrollbar touch-pan-y">
        
        {/* Stats Card */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           <div className="bg-gradient-to-br from-candy-yellow to-orange-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center border-b-4 border-orange-200 transform hover:scale-105 transition-transform duration-300">
              <span className="text-3xl mb-1 animate-wiggle">🍬</span>
              <span className="text-xs text-orange-800 font-bold uppercase tracking-wider">糖果总数</span>
              <span className="text-2xl font-black text-candy-text">
                <CountUp end={gameData.candies} />
              </span>
           </div>
           <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center border-b-4 border-indigo-200 transform hover:scale-105 transition-transform duration-300">
              <span className="text-3xl mb-1 animate-pulse">🏆</span>
              <span className="text-xs text-indigo-800 font-bold uppercase tracking-wider">答对总数</span>
              <span className="text-2xl font-black text-candy-text">
                <CountUp end={gameData.totalCorrect} />
              </span>
           </div>
        </div>

        {/* Candy Tree Section - Magic Garden Theme */}
        <div className="relative overflow-hidden bg-gradient-to-b from-sky-200 to-green-200 rounded-[2rem] p-0 shadow-lg mb-8 border-4 border-white transform transition-transform hover:scale-[1.01] duration-500 group">
           {/* Decorative Background Elements */}
           <div className="absolute top-4 right-4 text-yellow-300 animate-spin-slow text-5xl opacity-80 group-hover:scale-125 transition-transform duration-700">☀️</div>
           <div className="absolute top-8 left-8 text-white text-4xl opacity-60 animate-float" style={{animationDelay: '1s'}}>☁️</div>
           <div className="absolute top-16 right-20 text-white text-3xl opacity-50 animate-float" style={{animationDelay: '2s'}}>☁️</div>
           
           <div className="relative z-10 p-5 flex flex-col items-center">
              <div className="bg-white/80 backdrop-blur-md px-4 py-1 rounded-full mb-4 shadow-sm border border-white/50">
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
                     <div className="absolute bottom-16 w-40 h-40 bg-green-500 rounded-full shadow-lg z-20 flex items-center justify-center origin-bottom transition-transform duration-1000 hover:scale-105 hover:rotate-1">
                        <div className="w-36 h-36 bg-green-400 rounded-full border-4 border-green-300/50"></div>
                     </div>
                     <div className="absolute bottom-24 left-[-20px] w-24 h-24 bg-green-500 rounded-full z-10 animate-pulse-glow" style={{animationDuration: '4s'}}></div>
                     <div className="absolute bottom-24 right-[-20px] w-24 h-24 bg-green-500 rounded-full z-10 animate-pulse-glow" style={{animationDuration: '5s'}}></div>
                     
                     {/* Hanging Candies */}
                     <div className="absolute inset-0 z-30 pointer-events-none">
                        {Array.from({ length: Math.min(gameData.candies, 20) }).map((_, i) => (
                          <div 
                            key={i} 
                            className="absolute text-xl animate-float drop-shadow-md hover:scale-150 transition-transform cursor-default"
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
              
              <div className="bg-white/90 px-3 py-1 rounded-lg text-xs font-bold text-green-800 mt-2 shadow-sm border border-green-100">
                每答对1题，树上就多一颗糖果哦！
              </div>
           </div>
        </div>

        {/* Stickers Collection */}
        <div className="flex items-center gap-2 mb-4 px-1">
           <h3 className="text-xl font-bold text-candy-text flex items-center gap-2">
             贴纸收集册 <Sparkles className="text-yellow-400 w-5 h-5" />
           </h3>
           <span className="bg-candy-pink text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
             {gameData.stickersUnlocked.length} / {STICKERS.length}
           </span>
        </div>
        
        {/* Added extra padding to container (gap-4 + p-1) to ensure "NEW" badges don't clip */}
        <div className="grid grid-cols-2 gap-5 px-1 pb-4">
          {STICKERS.map((sticker, idx) => {
            const isUnlocked = gameData.stickersUnlocked.includes(sticker.id);
            const isNew = newUnlocks.includes(sticker.id);

            return (
              <div 
                key={sticker.id}
                style={{ animationDelay: `${idx * 100}ms` }}
                className={`
                  relative aspect-square rounded-[1.5rem] p-3 flex flex-col items-center justify-between text-center transition-all duration-300 animate-pop-in
                  ${isUnlocked 
                    ? 'bg-white shadow-lg border-4 border-white shine-effect transform hover:-translate-y-1 hover:shadow-xl' 
                    : 'bg-gray-100/80 border-2 border-dashed border-gray-300 shadow-inner opacity-80'
                  }
                  ${isNew ? 'ring-4 ring-yellow-300 ring-offset-2' : ''}
                `}
              >
                {isNew && (
                  <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full animate-bounce shadow-lg z-30 border-2 border-white rotate-12">
                    NEW!
                  </div>
                )}
                
                <div className="flex-1 w-full flex items-center justify-center relative overflow-visible">
                  {isUnlocked ? (
                    <>
                       {/* Background Glow for unlocked */}
                       <div className="absolute inset-0 bg-gradient-to-t from-candy-pink/20 to-transparent rounded-full scale-75 blur-xl"></div>
                       <img src={sticker.imageUrl} alt={sticker.name} className="w-24 h-24 object-contain drop-shadow-md relative z-10 animate-float" style={{ animationDuration: '4s' }} />
                    </>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-300 rounded-full blur-lg opacity-20"></div>
                      <Lock className="text-gray-300 w-10 h-10" />
                    </div>
                  )}
                </div>

                <div className="w-full relative z-10">
                  {isUnlocked ? (
                    <div className="font-bold text-candy-text text-sm bg-candy-yellow/30 rounded-lg py-1 px-2 w-full truncate border border-candy-yellow/20">
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
           <div className="mt-4 mb-4 text-center text-sm text-candy-text/60 bg-white/60 p-4 rounded-xl border border-dashed border-candy-pink/30 mx-1">
              <Sparkles className="inline-block w-4 h-4 mr-1 align-text-bottom text-yellow-500" />
              继续做题来解锁更多可爱的贴纸吧！
           </div>
        )}

      </div>
    </div>
  );
};