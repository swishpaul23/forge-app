// General utility/helper functions

/**
 * Calculate percentage
 * @param {number} a - Numerator
 * @param {number} b - Denominator
 * @returns {number} Rounded percentage
 */
export const pct = (a, b) => {
  if (b === 0) return 0;
  return Math.round((a / b) * 100);
};

/**
 * Get cell level class based on score
 * Used for consistency grid coloring
 * @param {number|null} score - Day score (0-100)
 * @returns {string} CSS class name
 */
export const getCellLevel = (score) => {
  if (score === null) return "level-0";
  if (score === 0) return "level-0";
  if (score < 25) return "level-1";
  if (score < 50) return "level-2";
  if (score < 75) return "level-3";
  return "level-4";
};

/**
 * Convert base64url VAPID key to Uint8Array for push notifications
 * @param {string} base64String - Base64url encoded string
 * @returns {Uint8Array}
 */
export const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

/**
 * Build empty wall data structure
 * @param {boolean} withMockData - Whether to include mock data
 * @returns {Object} Wall data
 */
export const buildWall = (withMockData = false) => {
  const generateCellsForMonth = () => {
    return Array.from({ length: 28 + Math.floor(Math.random() * 4) }, () => ({
      done: withMockData ? Math.random() > 0.35 : false,
    }));
  };
  
  return {
    months: [
      { name: "Jan", cells: generateCellsForMonth() },
      { name: "Feb", cells: generateCellsForMonth() },
      { name: "Mar", cells: generateCellsForMonth() },
      { name: "Apr", cells: generateCellsForMonth() },
      { name: "May", cells: generateCellsForMonth() },
      { name: "Jun", cells: generateCellsForMonth() },
    ],
  };
};

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

/**
 * Clamp a number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Generate a simple unique ID
 * @returns {string} Unique ID
 */
export const uid = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};
