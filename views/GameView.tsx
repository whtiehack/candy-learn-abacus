import React, { useState, useEffect } from 'react';
import { ViewState, GameData, MathProblem } from '../types';
import { Button } from '../components/Button';
import { AbacusVisual } from '../components/AbacusVisual';
import { generateProblem } from '../services/mathService';
import { saveGameData, updateDailyRecord, getTodayRecord } from '../services/storageService';
import { ArrowLeft, CheckCircle2, XCircle, Calculator, Star, PartyPopper } from 'lucide-react';

interface GameViewProps {
  changeView: (view: ViewState) => void;
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
}

// Sub-component for Celebration Overlay
const CelebrationOverlay: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm animate-pop-in"></div>
      
      {/* Confetti / Decorations (CSS positioned) */}
      <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce-short delay-100">⭐</div>
      <div className="absolute top-1/3 right-1/4 text-4xl animate-bounce-short delay-200">🎈</div>
      <div className="absolute bottom-1/3 left-1/3 text-4xl animate-bounce-short delay-300">🍬</div>
      <div className="absolute top-20 right-10 text-5xl animate-spin-slow text-yellow-400">✨</div>
      <div className="absolute bottom-20 left-10 text-5xl animate-spin-slow text-pink-400">🌸</div>

      {/* Main Message */}
      <div className="relative z-10 flex flex-col items-center animate-pop-in scale-125">
        <div className="text-8xl mb-4 drop-shadow-xl filter">🎉</div>
        <div className="bg-white border-4 border-candy-yellow rounded-3xl px-8 py-4 shadow-[0_10px_0_rgba(0,0,0,0.1)] transform rotate-2">
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 tracking-wider">
            太棒啦!
          </h2>
        </div>
        <div className="mt-4 text-2xl font-bold text-candy-text animate-pulse">
           答对啦 +1 🍬
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

  const todayCount = getTodayRecord(gameData).count;
  const isOverLimit = todayCount >= gameData.settings.dailyLimit;
  const useAbacusInput = gameData.settings.useAbacus;

  // Initialize first problem
  useEffect(() => {
    if (!problem && !isOverLimit) {
      setProblem(generateProblem(gameData.settings));
      setCurrentAbacusValue(0);
    }
  }, [gameData.settings, problem, isOverLimit]);

  const handleSuccess = () => {
    // Show celebration
    setShowCelebration(true);
    setFeedbackMessage("太棒了!"); // Keep text feedback for screen readers or fallback
    
    // Update Data
    const newData = {
      ...gameData,
      candies: gameData.candies + 1,
      totalCorrect: gameData.totalCorrect + 1,
      streak: gameData.streak + 1
    };
    
    const updatedDataWithRecord = updateDailyRecord(newData, 1);
    setGameData(updatedDataWithRecord);
    saveGameData(updatedDataWithRecord);

    // Delay next problem to show animation
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setFeedbackMessage("");
      setShowCelebration(false);
      setProblem(generateProblem(gameData.settings));
      setCurrentAbacusValue(0);
    }, 1800); // Slightly longer delay to enjoy the animation
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

  // Handle Multiple Choice Click
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

  // Handle Abacus Submission
  const handleAbacusSubmit = () => {
    if (isCorrect === true) return; // Prevent double submit

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
    <div className="flex flex-col h-full w-full max-w-lg mx-auto relative">
      <CelebrationOverlay show={showCelebration} />

      {/* Header */}
      <div className="flex justify-between items-center mb-2 px-2">
        <button onClick={() => changeView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-candy-text hover:bg-gray-50 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-candy-text font-bold text-sm bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white">
          今日进度: {todayCount} / {gameData.settings.dailyLimit}
        </div>
        <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-candy-darkPink font-bold border border-candy-pink/30 flex items-center gap-1">
          <span className="text-xl">🍬</span> {gameData.candies}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-start w-full overflow-y-auto pb-4 custom-scrollbar">
        
        {/* Question Display */}
        <div className={`
          relative p-6 rounded-[2rem] bg-white/50 backdrop-blur-sm shadow-sm border-2 border-white
          text-5xl md:text-6xl font-black text-candy-text my-4 
          flex flex-wrap items-center justify-center gap-2 md:gap-4 
          transition-all duration-300
          ${isCorrect === false ? 'animate-wiggle border-red-200 bg-red-50/50' : ''}
          ${isCorrect === true ? 'scale-105 border-green-200 bg-green-50/50' : ''}
        `}>
           {/* Render Expression String */}
           <div className="flex gap-3 items-center">
             {problem.expression.split(' ').map((part, i) => (
                <span key={i} className={['+', '-', 'x', '/'].includes(part) ? "text-candy-darkPink" : ""}>{part}</span>
             ))}
           </div>
           
           <span className="text-candy-darkPink">=</span>
           <div className={`
             min-w-[3rem] px-2 h-20 md:h-24 rounded-xl border-b-4 bg-white shadow-inner
             flex items-center justify-center transition-colors duration-300
             ${isCorrect === true ? 'text-green-500 border-green-200' : 'text-candy-darkPink border-candy-pink/30'}
           `}>
             {isCorrect === true ? problem.answer : '?'}
           </div>
        </div>

        {/* Visual Aid / Input Method */}
        {useAbacusInput && (
          <div className="w-full flex justify-center scale-90 origin-top md:scale-100 mb-2">
             <AbacusVisual 
                key={problem.id} 
                problem={problem} 
                showValue={gameData.settings.showAbacusValue}
                onChange={setCurrentAbacusValue}
             />
          </div>
        )}

        {/* Feedback Area - Only visible if not in celebration mode (to avoid clutter) */}
        {!showCelebration && (
          <div className="h-8 flex items-center justify-center mb-2">
            {feedbackMessage && (
              <div className={`text-xl font-bold flex items-center gap-2 px-4 py-1 rounded-full bg-white/80 shadow-sm ${isCorrect === false ? 'text-orange-500' : 'text-green-500'}`}>
                {isCorrect === false && <XCircle size={20}/>}
                {feedbackMessage}
              </div>
            )}
          </div>
        )}

        {/* Interaction Area */}
        <div className="w-full px-4 mt-auto">
          {useAbacusInput ? (
            <div className="flex flex-col items-center gap-3">
               <p className="text-sm text-candy-text/60 bg-white/40 px-3 py-1 rounded-full">拨动算珠得出答案，然后点击确认</p>
               <Button 
                 variant="primary" 
                 size="xl" 
                 onClick={handleAbacusSubmit}
                 disabled={isCorrect === true}
                 className="w-full py-6 text-2xl shadow-lg shadow-candy-pink/30"
                 icon={<Calculator />}
               >
                 确认答案
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {problem.choices.map((choice, idx) => (
                <Button
                  key={`${problem.id}-${choice}-${idx}`}
                  variant={
                    selectedAnswer === choice 
                      ? (isCorrect ? 'secondary' : 'danger')
                      : 'neutral'
                  }
                  size="lg"
                  disabled={selectedAnswer !== null}
                  onClick={() => handleChoiceAnswer(choice)}
                  className={`text-3xl py-6 rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.05)] ${
                    selectedAnswer !== choice ? 'hover:-translate-y-1 hover:shadow-md' : ''
                  }`}
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