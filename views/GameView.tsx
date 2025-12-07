import React, { useState, useEffect } from 'react';
import { ViewState, GameData, MathProblem } from '../types';
import { Button } from '../components/Button';
import { AbacusVisual } from '../components/AbacusVisual';
import { generateProblem } from '../services/mathService';
import { saveGameData, updateDailyRecord, getTodayRecord } from '../services/storageService';
import { DIFFICULTY_REWARDS } from '../constants';
import { ArrowLeft, XCircle, Calculator } from 'lucide-react';

interface GameViewProps {
  changeView: (view: ViewState) => void;
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
}

type CelebrationType = 'confetti' | 'candy-rain' | 'rocket' | 'magic';

// Sub-component for Celebration Overlay
const CelebrationOverlay: React.FC<{ show: boolean; rewardAmount: number; type: CelebrationType }> = ({ show, rewardAmount, type }) => {
  if (!show) return null;

  const renderContent = () => {
    switch (type) {
      case 'candy-rain':
        return (
          <>
            {/* Falling Candies */}
            {[...Array(15)].map((_, i) => (
              <div 
                key={i}
                className={`absolute text-4xl ${i % 2 === 0 ? 'animate-fall-slow' : 'animate-fall-fast'}`}
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  top: `-${Math.random() * 20}%`,
                  animationDelay: `${Math.random() * 1}s` 
                }}
              >
                🍬
              </div>
            ))}
            <div className="relative z-10 flex flex-col items-center animate-pop-in">
              <div className="text-8xl mb-2 drop-shadow-xl">🍭</div>
              <div className="bg-white/90 border-4 border-candy-pink rounded-3xl px-8 py-4 shadow-xl">
                 <h2 className="text-4xl font-black text-candy-darkPink">甜蜜蜜!</h2>
              </div>
            </div>
          </>
        );
      case 'rocket':
        return (
          <>
            <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm animate-pop-in"></div>
            {/* Stars */}
            {[...Array(10)].map((_, i) => (
               <div key={i} className="absolute text-yellow-300 animate-pulse" style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, fontSize: `${Math.random()*20 + 10}px` }}>⭐</div>
            ))}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-9xl animate-fly-up">🚀</div>
            <div className="relative z-10 flex flex-col items-center animate-pop-in delay-300">
               <h2 className="text-5xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">一飞冲天!</h2>
            </div>
          </>
        );
      case 'magic':
         return (
          <>
             <div className="absolute inset-0 bg-purple-500/10 backdrop-blur-sm"></div>
             <div className="absolute text-9xl animate-pulse-glow" style={{ top: '20%', left: '10%' }}>🌈</div>
             <div className="absolute text-8xl animate-bounce-short" style={{ bottom: '20%', right: '10%' }}>🦄</div>
             <div className="relative z-10 flex flex-col items-center animate-pop-in">
                <div className="text-8xl mb-2">✨</div>
                <div className="bg-white/90 border-4 border-purple-300 rounded-3xl px-8 py-4 shadow-xl">
                  <h2 className="text-4xl font-black text-purple-500">魔法时刻!</h2>
                </div>
             </div>
          </>
         );
      case 'confetti':
      default:
        // Original implementation
        return (
            <>
              <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce-short delay-100">⭐</div>
              <div className="absolute top-1/3 right-1/4 text-4xl animate-bounce-short delay-200">🎈</div>
              <div className="absolute bottom-1/3 left-1/3 text-4xl animate-bounce-short delay-300">🍬</div>
              <div className="absolute top-20 right-10 text-5xl animate-spin-slow text-yellow-400">✨</div>
              <div className="absolute bottom-20 left-10 text-5xl animate-spin-slow text-pink-400">🌸</div>

              <div className="relative z-10 flex flex-col items-center animate-pop-in scale-125">
                <div className="text-8xl mb-4 drop-shadow-xl filter">🎉</div>
                <div className="bg-white border-4 border-candy-yellow rounded-3xl px-8 py-4 shadow-[0_10px_0_rgba(0,0,0,0.1)] transform rotate-2">
                  <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 tracking-wider">
                    太棒啦!
                  </h2>
                </div>
              </div>
            </>
        );
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Base Backdrop (overridden by specific variants if needed) */}
      {type !== 'rocket' && type !== 'magic' && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm animate-pop-in"></div>}
      
      {renderContent()}

      {/* Common Reward Text */}
      <div className="absolute bottom-1/4 z-20 animate-pop-in delay-200">
         <div className="text-2xl font-bold text-candy-text bg-white/80 px-4 py-2 rounded-full shadow-md backdrop-blur-sm border border-white">
           答对啦 +{rewardAmount} 🍬
        </div>
      </div>
    </div>
  );
};

export const GameView: React.FC<GameViewProps> = ({ changeView, gameData, setGameData }) => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentAbacusValue, setCurrentAbacusValue] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<CelebrationType>('confetti');

  const todayCount = getTodayRecord(gameData).count;
  const isOverLimit = todayCount >= gameData.settings.dailyLimit;
  const useAbacusInput = gameData.settings.useAbacus;
  
  // Calculate potential reward for current difficulty
  const currentReward = DIFFICULTY_REWARDS[gameData.settings.difficulty] || 1;

  // Initialize first problem
  useEffect(() => {
    if (!problem && !isOverLimit) {
      setProblem(generateProblem(gameData.settings));
      setCurrentAbacusValue(0);
    }
  }, [gameData.settings, problem, isOverLimit]);

  const handleSuccess = () => {
    const types: CelebrationType[] = ['confetti', 'candy-rain', 'rocket', 'magic'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    setCelebrationType(randomType);

    setShowCelebration(true);
    setFeedbackMessage("太棒了!"); 
    
    const newData = {
      ...gameData,
      candies: gameData.candies + currentReward,
      totalCorrect: gameData.totalCorrect + 1,
      streak: gameData.streak + 1
    };
    
    const updatedDataWithRecord = updateDailyRecord(newData, 1);
    setGameData(updatedDataWithRecord);
    saveGameData(updatedDataWithRecord);

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setFeedbackMessage("");
      setShowCelebration(false);
      setProblem(generateProblem(gameData.settings));
      setCurrentAbacusValue(0);
    }, 2000);
  };

  const handleFailure = () => {
    setFeedbackMessage("加油，再试一次! 💪");
    setGameData(prev => ({ ...prev, streak: 0 }));
    
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setFeedbackMessage("");
    }, 1000);
  };

  const handleChoiceAnswer = (choice: number) => {
    if (selectedAnswer !== null) return; 

    setSelectedAnswer(choice);
    const correct = choice === problem?.answer;
    setIsCorrect(correct);

    if (correct) {
      handleSuccess();
    } else {
      handleFailure();
    }
  };

  const handleAbacusSubmit = () => {
    if (isCorrect === true) return;

    const correct = currentAbacusValue === problem?.answer;
    setIsCorrect(correct);

    if (correct) {
      handleSuccess();
    } else {
      handleFailure();
    }
  };

  if (isOverLimit) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-pop-in">
        <div className="text-6xl animate-bounce">🐰</div>
        <h2 className="text-3xl font-bold text-candy-text">今日练习圆满完成!</h2>
        <p className="text-xl text-gray-600 px-8">你的小眼睛需要休息啦，明天再来玩吧！</p>
        <Button onClick={() => changeView(ViewState.HOME)} size="lg">返回主页</Button>
      </div>
    );
  }

  if (!problem) return <div>加载中...</div>;

  return (
    <div className="flex flex-col h-full w-full relative">
      <CelebrationOverlay show={showCelebration} rewardAmount={currentReward} type={celebrationType} />

      {/* Header: Compact on mobile */}
      <div className="flex justify-between items-center mb-2 px-1 flex-shrink-0">
        <button onClick={() => changeView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-candy-text hover:bg-gray-50 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-candy-text font-bold text-sm bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white whitespace-nowrap">
          今日: {todayCount} / {gameData.settings.dailyLimit}
        </div>
        <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-candy-darkPink font-bold border border-candy-pink/30 flex items-center gap-1">
          <span className="text-xl">🍬</span> {gameData.candies}
        </div>
      </div>

      {/* Main Game Area: Scrollable if content is too tall, but tries to fit */}
      <div className="flex-1 flex flex-col items-center w-full min-h-0 overflow-y-auto overflow-x-hidden pb-2">
        
        {/* Question Display: Responsive Text Size */}
        <div className={`
          flex-shrink-0 w-full
          relative p-4 md:p-6 rounded-[1.5rem] bg-white/50 backdrop-blur-sm shadow-sm border-2 border-white
          text-4xl md:text-6xl font-black text-candy-text my-2 md:my-4 
          flex flex-wrap items-center justify-center gap-2
          transition-all duration-300
          ${isCorrect === false ? 'animate-wiggle border-red-200 bg-red-50/50' : ''}
          ${isCorrect === true ? 'scale-105 border-green-200 bg-green-50/50' : ''}
        `}>
           {/* Render Expression String */}
           <div className="flex flex-wrap justify-center gap-x-2 gap-y-0 items-center">
             {problem.expression.split(' ').map((part, i) => (
                <span key={i} className={['+', '-', 'x', '/'].includes(part) ? "text-candy-darkPink" : ""}>{part}</span>
             ))}
           </div>
           
           <span className="text-candy-darkPink">=</span>
           <div className={`
             min-w-[3rem] px-2 h-14 md:h-24 rounded-xl border-b-4 bg-white shadow-inner
             flex items-center justify-center transition-colors duration-300
             ${isCorrect === true ? 'text-green-500 border-green-200' : 'text-candy-darkPink border-candy-pink/30'}
           `}>
             {isCorrect === true ? problem.answer : '?'}
           </div>
        </div>

        {/* Visual Aid Area: Takes available space but can shrink */}
        {useAbacusInput && (
          <div className="w-full flex justify-center flex-shrink-0 mb-2 px-1">
             <AbacusVisual 
                key={problem.id} 
                problem={problem} 
                showValue={gameData.settings.showAbacusValue}
                onChange={setCurrentAbacusValue}
             />
          </div>
        )}

        {/* Feedback: Absolute or fixed height to prevent jump */}
        <div className="h-8 flex-shrink-0 flex items-center justify-center mb-1 w-full">
          {!showCelebration && feedbackMessage && (
            <div className={`text-lg md:text-xl font-bold flex items-center gap-2 px-4 py-1 rounded-full bg-white/80 shadow-sm ${isCorrect === false ? 'text-orange-500' : 'text-green-500'}`}>
              {isCorrect === false && <XCircle size={18}/>}
              {feedbackMessage}
            </div>
          )}
        </div>

        {/* Spacer to push controls to bottom */}
        <div className="flex-1"></div>

        {/* Controls Area: Stick to bottom */}
        <div className="w-full mt-auto flex-shrink-0 pb-2">
          {useAbacusInput ? (
            <div className="flex flex-col items-center gap-3 px-4">
               <p className="text-xs md:text-sm text-candy-text/60 bg-white/40 px-3 py-1 rounded-full text-center">拨动算珠得出答案，然后点击下方按钮</p>
               <Button 
                 variant="primary" 
                 size="lg" 
                 onClick={handleAbacusSubmit}
                 disabled={isCorrect === true}
                 className={`
                    w-full py-4 md:py-6 text-xl md:text-3xl shadow-xl 
                    bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600
                    border-b-8 border-pink-700 
                    active:border-b-0 active:translate-y-2
                    text-white font-black tracking-wider rounded-2xl
                    ${isCorrect === true ? 'opacity-50 cursor-not-allowed filter grayscale' : 'animate-pulse-glow'}
                 `}
                 icon={<Calculator className="w-6 h-6 md:w-8 md:h-8" />}
               >
                 确认答案
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {problem.choices.map((choice, idx) => (
                <Button
                  key={`${problem.id}-${choice}-${idx}`}
                  variant={
                    selectedAnswer === choice 
                      ? (isCorrect ? 'secondary' : 'danger')
                      : 'neutral'
                  }
                  size="md" // Smaller button size on mobile
                  disabled={selectedAnswer !== null}
                  onClick={() => handleChoiceAnswer(choice)}
                  className={`text-2xl md:text-3xl py-4 md:py-6 rounded-xl md:rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.05)] ${
                    selectedAnswer !== choice ? 'hover:-translate-y-1 hover:shadow-md' : ''
                  } w-full`}
                >
                  {choice}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};