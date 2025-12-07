import React, { useState, useEffect } from 'react';
import { ViewState, GameData, MathProblem } from '../types';
import { Button } from '../components/Button';
import { AbacusVisual } from '../components/AbacusVisual';
import { generateProblem } from '../services/mathService';
import { saveGameData, updateDailyRecord, getTodayRecord } from '../services/storageService';
import { DIFFICULTY_REWARDS } from '../constants';
import { ArrowLeft, XCircle, CheckCircle2 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface GameViewProps {
  changeView: (view: ViewState) => void;
  gameData: GameData;
  setGameData: React.Dispatch<React.SetStateAction<GameData>>;
}

export const GameView: React.FC<GameViewProps> = ({ changeView, gameData, setGameData }) => {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentAbacusValue, setCurrentAbacusValue] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const todayCount = getTodayRecord(gameData).count;
  const isOverLimit = todayCount >= gameData.settings.dailyLimit;
  const useAbacusInput = gameData.settings.useAbacus;
  
  const currentReward = DIFFICULTY_REWARDS[gameData.settings.difficulty] || 1;

  useEffect(() => {
    if (!problem && !isOverLimit) {
      setProblem(generateProblem(gameData.settings));
      setCurrentAbacusValue(0);
    }
  }, [gameData.settings, problem, isOverLimit]);

  const handleSuccess = () => {
    audioService.play('success'); 
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
    }, 1500);
  };

  const handleFailure = () => {
    audioService.play('wrong');
    setFeedbackMessage("加油，再试一次!");
    setGameData(prev => ({ ...prev, streak: 0 }));
    setShakeError(true);
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setFeedbackMessage("");
      setShakeError(false);
    }, 1000);
  };

  const handleChoiceAnswer = (choice: number) => {
    if (selectedAnswer !== null) return; 

    setSelectedAnswer(choice);
    const correct = choice === problem?.answer;
    setIsCorrect(correct);

    if (correct) handleSuccess();
    else handleFailure();
  };

  const handleAbacusSubmit = () => {
    if (isCorrect === true) return;

    const correct = currentAbacusValue === problem?.answer;
    setIsCorrect(correct);

    if (correct) handleSuccess();
    else handleFailure();
  };

  if (isOverLimit) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-pop-in">
        <div className="text-6xl animate-bounce">🐰</div>
        <h2 className="text-3xl font-bold text-candy-text">今日练习圆满完成!</h2>
        <Button onClick={() => changeView(ViewState.HOME)} size="lg">返回主页</Button>
      </div>
    );
  }

  if (!problem) return <div>加载中...</div>;

  return (
    <div className="flex flex-col h-full w-full relative">
      
      {/* Celebration Overlay - Removed backdrop-blur for performance */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-white/80">
           <div className="text-8xl animate-bounce mb-4 drop-shadow-lg">🎉</div>
           <div className="bg-white border-4 border-candy-yellow rounded-full px-8 py-3 shadow-xl transform rotate-3 animate-pop-in">
             <h2 className="text-4xl font-black text-candy-darkPink">答对啦! +{currentReward}🍬</h2>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-1 py-1 flex-shrink-0">
        <button onClick={() => changeView(ViewState.HOME)} className="p-2 bg-white rounded-full shadow-sm text-candy-text border border-gray-100">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-3">
            <div className="text-candy-text font-bold text-sm bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
              {todayCount} / {gameData.settings.dailyLimit} 题
            </div>
            <div className="bg-candy-pink text-white px-3 py-1 rounded-full shadow-sm font-bold flex items-center gap-1">
              <span>🍬</span> {gameData.candies}
            </div>
        </div>
      </div>

      {/* Question Card */}
      <div className={`
        flex-shrink-0 w-full mt-2 mb-2
        relative p-2 md:p-4 rounded-2xl bg-white shadow-sm border border-gray-100
        flex items-center justify-center gap-2 md:gap-4
        transition-colors duration-300
        ${isCorrect === false ? 'border-red-200 bg-red-50' : ''}
        ${shakeError ? 'animate-shake' : ''}
      `}>
         <div className="text-4xl md:text-5xl font-black text-candy-text flex items-center gap-2">
           {problem.expression.split(' ').map((part, i) => (
              <span key={i} className={['+', '-', 'x', '/'].includes(part) ? "text-candy-darkPink" : ""}>{part}</span>
           ))}
           <span className="text-candy-darkPink">=</span>
         </div>
         <div className={`
           min-w-[3.5rem] h-12 md:h-14 rounded-xl border-b-4 bg-gray-50 shadow-inner
           flex items-center justify-center text-3xl font-bold
           ${isCorrect === true ? 'text-green-500' : 'text-candy-pink'}
           ${isCorrect === false ? 'text-red-400' : ''}
         `}>
           {isCorrect === true ? problem.answer : '?'}
         </div>
         
         {/* Simple X overlay on card when wrong */}
         {shakeError && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <XCircle className="w-16 h-16 text-red-400/80 animate-pop-in" />
             </div>
         )}
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 overflow-hidden py-2 relative">
        {useAbacusInput && (
          <div className="w-full h-full flex flex-col justify-center">
             <AbacusVisual 
                key={problem.id} 
                problem={problem} 
                showValue={gameData.settings.showAbacusValue}
                onChange={setCurrentAbacusValue}
             />
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex-shrink-0 w-full pb-2 md:pb-6 px-1">
        <div className="h-6 flex items-center justify-center mb-2">
           {feedbackMessage && !showCelebration && (
             <span className={`font-bold animate-pulse ${isCorrect === false ? 'text-red-500' : 'text-green-600'}`}>
               {feedbackMessage}
             </span>
           )}
           {useAbacusInput && !feedbackMessage && !showCelebration && (
             <span className="text-xs text-gray-400">拨动算珠计算，点击下方按钮提交</span>
           )}
        </div>

        {useAbacusInput ? (
             <Button 
               variant="primary" 
               size="lg" 
               onClick={handleAbacusSubmit}
               disabled={isCorrect === true}
               className={`
                  w-full py-4 text-2xl shadow-lg
                  bg-gradient-to-b from-candy-darkPink to-pink-500 
                  border-b-4 border-pink-700 
                  text-white font-black tracking-wider rounded-2xl
                  flex items-center justify-center gap-2
                  transition-all active:scale-95
                  ${isCorrect === true ? 'opacity-0 pointer-events-none' : ''}
               `}
             >
               <CheckCircle2 size={24} strokeWidth={3} />
               确认答案
             </Button>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {problem.choices.map((choice, idx) => (
              <Button
                key={`${problem.id}-${choice}-${idx}`}
                variant={selectedAnswer === choice ? (isCorrect ? 'secondary' : 'danger') : 'neutral'}
                size="md"
                disabled={selectedAnswer !== null}
                onClick={() => handleChoiceAnswer(choice)}
                className={`text-2xl py-4 rounded-xl shadow-sm w-full font-black h-20 ${
                    selectedAnswer === choice && !isCorrect ? 'animate-shake' : ''
                }`}
              >
                {choice}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};