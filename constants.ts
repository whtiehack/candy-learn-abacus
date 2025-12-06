import { GameData, GameSettings, Sticker } from './types';

export const DEFAULT_SETTINGS: GameSettings = {
  useAbacus: true,
  showAbacusValue: true, 
  allowTens: false,
  dailyLimit: 20,
  soundEnabled: true,
  difficulty: 'digit1_upto10',
};

export const INITIAL_GAME_DATA: GameData = {
  candies: 0,
  stickersUnlocked: [],
  totalCorrect: 0,
  streak: 0,
  settings: DEFAULT_SETTINGS,
  dailyRecords: [],
};

export const STICKERS: Sticker[] = [
  {
    id: 's1',
    name: '初学乍练',
    imageUrl: 'https://picsum.photos/id/1062/150/150', 
    requirementText: '累计答对 10 题',
    unlockCondition: (data) => data.totalCorrect >= 10
  },
  {
    id: 's2',
    name: '算术小天才',
    imageUrl: 'https://picsum.photos/id/1025/150/150', 
    requirementText: '累计答对 50 题',
    unlockCondition: (data) => data.totalCorrect >= 50
  },
  {
    id: 's3',
    name: '连对大师',
    imageUrl: 'https://picsum.photos/id/1074/150/150', 
    requirementText: '连续答对 5 题',
    unlockCondition: (data) => data.streak >= 5
  },
  {
    id: 's4',
    name: '勤奋宝宝',
    imageUrl: 'https://picsum.photos/id/1084/150/150', 
    requirementText: '收集 100 颗糖果',
    unlockCondition: (data) => data.candies >= 100
  },
  {
    id: 's5',
    name: '超级运算',
    imageUrl: 'https://picsum.photos/id/237/150/150', 
    requirementText: '累计答对 100 题',
    unlockCondition: (data) => data.totalCorrect >= 100
  },
  {
    id: 's6',
    name: '挑战能手',
    imageUrl: 'https://picsum.photos/id/65/150/150', 
    requirementText: '尝试两位数或连加模式',
    unlockCondition: (data) => (data.settings.difficulty === 'digit2' || data.settings.difficulty === 'chain3') && data.totalCorrect > 0
  }
];