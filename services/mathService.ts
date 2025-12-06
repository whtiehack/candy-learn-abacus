import { MathProblem, GameSettings, Difficulty } from '../types';

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateProblem = (settings: GameSettings): MathProblem => {
  const difficulty = settings.difficulty;
  
  switch (difficulty) {
    case 'digit1_upto10':
      return generateDigit1Problem(10);
    case 'digit1_upto20':
      return generateDigit1Problem(20);
    case 'digit2':
      return generateDigit2Problem();
    case 'chain3':
      return generateChainProblem(3);
    case 'chain4':
      return generateChainProblem(4);
    default:
      return generateDigit1Problem(10);
  }
};

// 1-Digit Add/Sub.
// If maxResult == 10: 1-digit operands, Sum <= 10.
// If maxResult == 20: 1-digit operands (for add), Sum <= 18 (9+9).
//                     For sub, Minuend can be up to 18 (e.g. 15-8).
const generateDigit1Problem = (maxResult: number): MathProblem => {
  const isAddition = Math.random() > 0.5;
  let numA, numB, answer;

  if (isAddition) {
    // A + B
    if (maxResult === 10) {
      answer = getRandomInt(2, 10);
      numA = getRandomInt(1, answer - 1);
      numB = answer - numA;
    } else {
      // Allow > 10
      numA = getRandomInt(2, 9);
      // Ensure possibility of > 10 but strictly 1-digit operands
      // Max sum is 9+9=18
      const minB = 1; 
      const maxB = 9;
      numB = getRandomInt(minB, maxB);
      answer = numA + numB;
    }
    
    return {
      id: Date.now().toString(),
      expression: `${numA} + ${numB}`,
      answer,
      choices: generateChoices(answer, maxResult === 10 ? 10 : 20)
    };
  } else {
    // A - B
    // A can be up to maxResult
    const maxA = maxResult === 10 ? 10 : 18; 
    numA = getRandomInt(2, maxA);
    // B must be 1-digit? Usually "1-digit sub" means 8-5. 
    // "20以内加减" usually implies 15-8. Here B is single digit.
    const maxB = Math.min(numA - 1, 9); // Ensure result >= 1 and B is single digit
    numB = getRandomInt(1, maxB);
    answer = numA - numB;

    return {
      id: Date.now().toString(),
      expression: `${numA} - ${numB}`,
      answer,
      choices: generateChoices(answer, maxA)
    };
  }
};

// 2-Digit Add/Sub
const generateDigit2Problem = (): MathProblem => {
  const isAddition = Math.random() > 0.5;
  let numA, numB, answer;

  if (isAddition) {
    // 10-99 + 10-99. 
    // Limit result to < 100? Or allow up to 198?
    // Let's allow > 100 since we have hundreds rod.
    numA = getRandomInt(10, 90);
    numB = getRandomInt(10, 99);
    // Maybe keep it simple occasionally? 
    answer = numA + numB;
    return {
      id: Date.now().toString(),
      expression: `${numA} + ${numB}`,
      answer,
      choices: generateChoices(answer, 200)
    };
  } else {
    // A - B
    numA = getRandomInt(20, 99);
    numB = getRandomInt(10, numA - 1); // Ensure positive result
    answer = numA - numB;
    return {
      id: Date.now().toString(),
      expression: `${numA} - ${numB}`,
      answer,
      choices: generateChoices(answer, 100)
    };
  }
};

const generateChainProblem = (count: number): MathProblem => {
  // Mixed Add/Sub chain: A + B - C ...
  let currentSum = 0;
  const parts: string[] = [];
  
  // First number (1-9)
  let num = getRandomInt(1, 9);
  currentSum = num;
  parts.push(num.toString());
  
  for (let i = 1; i < count; i++) {
    // Decide operator: 50% chance for subtract if currentSum allows it
    let operator = Math.random() > 0.5 ? '+' : '-';
    
    // If currentSum is 0, must add
    if (currentSum === 0) operator = '+';

    let nextNum = 0;
    
    if (operator === '+') {
       nextNum = getRandomInt(1, 9);
       currentSum += nextNum;
    } else {
       // Subtraction: 
       // 1. Operand must be 1-digit (1-9)
       // 2. Result must not be negative (currentSum - nextNum >= 0)
       // So max allowed subtractor is min(9, currentSum)
       const maxSub = Math.min(9, currentSum);
       
       if (maxSub < 1) {
           // Should be covered by currentSum === 0 check, but safe fallback
           operator = '+';
           nextNum = getRandomInt(1, 9);
           currentSum += nextNum;
       } else {
           nextNum = getRandomInt(1, maxSub);
           currentSum -= nextNum;
       }
    }

    parts.push(operator);
    parts.push(nextNum.toString());
  }

  return {
    id: Date.now().toString(),
    expression: parts.join(' '),
    answer: currentSum,
    choices: generateChoices(currentSum, 50)
  };
};

const generateChoices = (answer: number, rangeLimit: number): number[] => {
  const choices = new Set<number>();
  choices.add(answer);

  while (choices.size < 3) {
    const range = Math.max(5, Math.floor(rangeLimit / 5));
    const offset = getRandomInt(-range, range);
    const fake = answer + offset;
    
    if (fake >= 0 && fake !== answer && fake <= rangeLimit * 1.5) {
      choices.add(fake);
    }
  }
  return shuffleArray(Array.from(choices));
};