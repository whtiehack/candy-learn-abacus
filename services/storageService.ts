import { GameData, DailyRecord } from '../types';
import { INITIAL_GAME_DATA } from '../constants';

const STORAGE_KEY = 'candy_abacus_data_v1';

export const loadGameData = (): GameData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Merge with initial to ensure new fields (migrations) are present
      return { ...INITIAL_GAME_DATA, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load game data", e);
  }
  return INITIAL_GAME_DATA;
};

export const saveGameData = (data: GameData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save game data", e);
  }
};

export const getTodayRecord = (data: GameData): DailyRecord => {
  const todayStr = new Date().toISOString().split('T')[0];
  let record = data.dailyRecords.find(r => r.date === todayStr);
  
  if (!record) {
    record = { date: todayStr, count: 0 };
  }
  return record;
};

export const updateDailyRecord = (data: GameData, increment: number): GameData => {
  const todayStr = new Date().toISOString().split('T')[0];
  const existingIndex = data.dailyRecords.findIndex(r => r.date === todayStr);
  
  let newRecords = [...data.dailyRecords];
  if (existingIndex >= 0) {
    newRecords[existingIndex] = {
      ...newRecords[existingIndex],
      count: newRecords[existingIndex].count + increment
    };
  } else {
    newRecords.push({ date: todayStr, count: increment });
  }

  // Keep only last 30 days to save space
  if (newRecords.length > 30) {
    newRecords = newRecords.slice(newRecords.length - 30);
  }

  return { ...data, dailyRecords: newRecords };
};