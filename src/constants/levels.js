// Level progression system
// Based on cumulative total days forged across all challenges

export const LEVELS = [
  { id: "initiate",    label: "INITIATE",    minDays: 0,   color: "#56524D" },
  { id: "committed",   label: "COMMITTED",   minDays: 7,   color: "#CD7F32" },
  { id: "consistent",  label: "CONSISTENT",  minDays: 21,  color: "#2E8B57" },
  { id: "disciplined", label: "DISCIPLINED", minDays: 45,  color: "#DC2626" },
  { id: "forged",      label: "FORGED",      minDays: 75,  color: "#0F52BA" },
  { id: "elite",       label: "ELITE",       minDays: 100, color: "#7851A9" },
  { id: "legendary",   label: "LEGENDARY",   minDays: 150, color: "#FFC125" },
];

/**
 * Get the level for a given number of days
 * @param {number} days - Total days forged
 * @returns {Object} Level object with id, label, minDays, color
 */
export const getLevel = (days) => {
  return [...LEVELS].reverse().find(l => days >= l.minDays) || LEVELS[0];
};

/**
 * Get the next level after the current one
 * @param {number} days - Total days forged
 * @returns {Object|null} Next level object or null if at max
 */
export const getNextLevel = (days) => {
  return LEVELS.find(l => l.minDays > days) || null;
};

/**
 * Get days remaining until next level
 * @param {number} days - Total days forged
 * @returns {number} Days until next level, 0 if at max
 */
export const getDaysToNextLevel = (days) => {
  const next = getNextLevel(days);
  return next ? next.minDays - days : 0;
};
