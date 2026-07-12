// Level progression system
// Based on cumulative total days forged across all challenges

export type Level = { id: string; label: string; minDays: number; color: string };

export const LEVELS: Level[] = [
  { id: "initiate",    label: "INITIATE",    minDays: 0,   color: "#56524D" },
  { id: "committed",   label: "COMMITTED",   minDays: 7,   color: "#CD7F32" },
  { id: "consistent",  label: "CONSISTENT",  minDays: 21,  color: "#2E8B57" },
  { id: "disciplined", label: "DISCIPLINED", minDays: 45,  color: "#DC2626" },
  { id: "forged",      label: "FORGED",      minDays: 75,  color: "#0F52BA" },
  { id: "elite",       label: "ELITE",       minDays: 100, color: "#7851A9" },
  { id: "legendary",   label: "LEGENDARY",   minDays: 150, color: "#FFC125" },
];

/** Get the level for a given number of days */
export const getLevel = (days: number): Level => {
  return [...LEVELS].reverse().find(l => days >= l.minDays) || LEVELS[0];
};

/** Get the next level after the current one */
export const getNextLevel = (days: number): Level | null => {
  return LEVELS.find(l => l.minDays > days) || null;
};

/** Get days remaining until next level */
export const getDaysToNextLevel = (days: number): number => {
  const next = getNextLevel(days);
  return next ? next.minDays - days : 0;
};
