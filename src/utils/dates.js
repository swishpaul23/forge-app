// Date utility functions

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 * Day changes at midnight local time
 */
export const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Alias for backwards compatibility
export const getChallengeDate = getTodayStr;

/**
 * Format current date for display
 * e.g., "Monday, January 15"
 */
export const fmtDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
};

/**
 * Format date string for cell tooltip
 * e.g., "JAN/15"
 */
export const fmtCellDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.toLocaleString("en-US", { month: "short" }).toUpperCase()}/${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Format date string for full display
 * e.g., "Mon, Jan 15"
 */
export const fmtFullDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

/**
 * Get time-based greeting
 */
export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Still at it";
};

/**
 * Calculate day number in a challenge
 * @param {string} startDate - Challenge start date (YYYY-MM-DD)
 * @returns {number} Current day number (1-indexed)
 */
export const getDayNum = (startDate) => {
  if (!startDate) return 1;
  const start = new Date(startDate + "T12:00:00");
  const today = new Date(getTodayStr() + "T12:00:00");
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((today - start) / msPerDay) + 1;
};

/**
 * Get array of dates between start and end
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {string[]} Array of date strings
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};
