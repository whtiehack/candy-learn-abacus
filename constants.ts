import { GameData, GameSettings, Sticker, Difficulty } from './types';

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

export const DIFFICULTY_REWARDS: Record<Difficulty, number> = {
  'digit1_upto10': 1,
  'digit1_upto20': 2,
  'digit2': 3,
  'chain3': 3,
  'chain4': 4
};

// SVG Stickers (Data URIs for performance and portability)
// Colors: Pink #F48FB1, Mint #80CBC4, Yellow #FFF176, Blue #90CAF9

const stickerSvgs = {
  sprout: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23E8F5E9'/><path d='M50 85 Q50 50 30 40' stroke='%234CAF50' stroke-width='4' fill='none' stroke-linecap='round'/><ellipse cx='30' cy='40' rx='15' ry='10' fill='%2366BB6A' transform='rotate(-15 30 40)'/><ellipse cx='70' cy='50' rx='15' ry='10' fill='%2381C784' transform='rotate(15 70 50)'/><path d='M50 85 Q50 60 70 50' stroke='%234CAF50' stroke-width='4' fill='none' stroke-linecap='round'/><circle cx='42' cy='65' r='2.5' fill='%232E7D32'/><circle cx='58' cy='65' r='2.5' fill='%232E7D32'/><path d='M46 72 Q50 75 54 72' stroke='%232E7D32' stroke-width='2' fill='none' stroke-linecap='round'/></svg>`,
  
  owl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23E3F2FD'/><path d='M30 40 Q25 20 40 30 Q50 20 60 30 Q75 20 70 40' fill='%2390CAF9'/><ellipse cx='50' cy='60' rx='30' ry='35' fill='%2390CAF9'/><circle cx='40' cy='55' r='10' fill='white'/><circle cx='60' cy='55' r='10' fill='white'/><circle cx='40' cy='55' r='3' fill='%231565C0'/><circle cx='60' cy='55' r='3' fill='%231565C0'/><path d='M48 65 L52 65 L50 70 Z' fill='%23FFB74D'/><path d='M30 75 Q20 60 25 50' stroke='%2364B5F6' stroke-width='3' fill='none' stroke-linecap='round'/><path d='M70 75 Q80 60 75 50' stroke='%2364B5F6' stroke-width='3' fill='none' stroke-linecap='round'/><path d='M40 55 L60 55' stroke='%231565C0' stroke-width='1.5' stroke-opacity='0.5'/></svg>`,
  
  fire: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23FFF3E0'/><path d='M50 20 Q70 40 70 65 Q70 85 50 85 Q30 85 30 65 Q30 40 50 20' fill='%23FF7043'/><path d='M50 35 Q60 50 60 65 Q60 75 50 75 Q40 75 40 65 Q40 50 50 35' fill='%23FFAB91'/><circle cx='45' cy='60' r='2.5' fill='%23BF360C'/><circle cx='55' cy='60' r='2.5' fill='%23BF360C'/><path d='M48 65 Q50 68 52 65' stroke='%23BF360C' stroke-width='2' fill='none' stroke-linecap='round'/></svg>`,
  
  jar: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23FCE4EC'/><path d='M35 35 L65 35 L70 80 L30 80 Z' fill='%23F48FB1' opacity='0.4'/><rect x='32' y='30' width='36' height='6' rx='2' fill='%23F06292'/><circle cx='45' cy='55' r='7' fill='%23FFEB3B'/><circle cx='55' cy='70' r='7' fill='%2380CBC4'/><circle cx='40' cy='72' r='6' fill='%23CE93D8'/><circle cx='60' cy='50' r='6' fill='%23FFCC80'/><circle cx='50' cy='62' r='5' fill='%2381D4FA'/><path d='M30 80 Q50 85 70 80' fill='%23F48FB1' opacity='0.4'/></svg>`,
  
  crown: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23FFF8E1'/><path d='M28 65 L28 45 L40 55 L50 30 L60 55 L72 45 L72 65 Q50 78 28 65' fill='%23FFD54F' stroke='%23FF6F00' stroke-width='2.5' stroke-linejoin='round'/><circle cx='28' cy='45' r='4' fill='%23F44336'/><circle cx='50' cy='30' r='4' fill='%232196F3'/><circle cx='72' cy='45' r='4' fill='%234CAF50'/><path d='M35 65 L65 65' stroke='%23FF6F00' stroke-width='2' stroke-dasharray='3,3'/></svg>`,
  
  rocket: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23E8EAF6'/><path d='M50 20 Q65 40 65 70 L35 70 Q35 40 50 20' fill='%23FF5252'/><circle cx='50' cy='50' r='12' fill='%23E3F2FD' stroke='%2390CAF9' stroke-width='2'/><path d='M35 70 L25 80 L35 75' fill='%233F51B5'/><path d='M65 70 L75 80 L65 75' fill='%233F51B5'/><path d='M42 70 Q50 95 58 70' fill='%23FFC107'/></svg>`
};

export const STICKERS: Sticker[] = [
  {
    id: 's1',
    name: '小小萌芽',
    imageUrl: stickerSvgs.sprout, 
    requirementText: '累计答对 10 题',
    unlockCondition: (data) => data.totalCorrect >= 10
  },
  {
    id: 's2',
    name: '智慧猫头鹰',
    imageUrl: stickerSvgs.owl, 
    requirementText: '累计答对 50 题',
    unlockCondition: (data) => data.totalCorrect >= 50
  },
  {
    id: 's3',
    name: '火力全开',
    imageUrl: stickerSvgs.fire, 
    requirementText: '连续答对 5 题',
    unlockCondition: (data) => data.streak >= 5
  },
  {
    id: 's4',
    name: '糖果罐子',
    imageUrl: stickerSvgs.jar, 
    requirementText: '收集 100 颗糖果',
    unlockCondition: (data) => data.candies >= 100
  },
  {
    id: 's5',
    name: '荣耀皇冠',
    imageUrl: stickerSvgs.crown, 
    requirementText: '累计答对 100 题',
    unlockCondition: (data) => data.totalCorrect >= 100
  },
  {
    id: 's6',
    name: '太空探索',
    imageUrl: stickerSvgs.rocket, 
    requirementText: '尝试两位数或连加模式',
    unlockCondition: (data) => (data.settings.difficulty === 'digit2' || data.settings.difficulty === 'chain3') && data.totalCorrect > 0
  }
];