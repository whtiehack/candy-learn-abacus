export enum ViewState {
  HOME = 'HOME',
  LEVEL_SELECT = 'LEVEL_SELECT',
  GAME = 'GAME',
  REWARDS = 'REWARDS',
  SETTINGS = 'SETTINGS'
}

export type Difficulty = 'digit1_upto10' | 'digit1_upto20' | 'digit2' | 'chain3' | 'chain4';

export interface GameSettings {
  useAbacus: boolean;
  showAbacusValue: boolean; // Control visibility of total value
  allowTens: boolean; // Deprecated in favor of Difficulty modes, kept for type compatibility if needed or removed
  dailyLimit: number;
  soundEnabled: boolean;
  difficulty: Difficulty; // Selected difficulty
}

export interface DailyRecord {
  date: string;
  count: number;
}

export interface GameData {
  candies: number;
  stickersUnlocked: string[];
  totalCorrect: number;
  streak: number;
  settings: GameSettings;
  dailyRecords: DailyRecord[];
}

export interface MathProblem {
  id: string;
  expression: string; // e.g., "3 + 5" or "2 + 2 + 1"
  answer: number;
  choices: number[];
}

export interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
  requirementText: string;
  unlockCondition: (data: GameData) => boolean;
}