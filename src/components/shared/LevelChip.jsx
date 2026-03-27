import React from 'react';
import { LEVELS, getLevel, getNextLevel, getDaysToNextLevel } from '../../constants/levels';

/**
 * LevelChip - Displays current level with hover tooltip showing all levels
 */
const LevelChip = ({ totalDaysForged }) => {
  const level = getLevel(totalDaysForged);
  const nextLevel = getNextLevel(totalDaysForged);
  const daysToNext = getDaysToNextLevel(totalDaysForged);

  return (
    <div className="lvl-chip-wrap">
      <div
        className="lvl-chip"
        style={{
          background: `${level.color}18`,
          border: `1px solid ${level.color}40`,
          color: level.color,
        }}
      >
        {level.label}
      </div>
      <div className="lvl-tooltip">
        <div className="lvl-tooltip-title">Level Progression</div>
        {LEVELS.map(l => (
          <div
            key={l.id}
            className={`lvl-tooltip-row ${l.id === level.id ? 'current' : ''}`}
          >
            <span
              className="lvl-tooltip-dot"
              style={{ background: l.color }}
            />
            <span className="lvl-tooltip-label">{l.label}</span>
            <span className="lvl-tooltip-days">{l.minDays}d</span>
          </div>
        ))}
        {nextLevel && (
          <div className="lvl-tooltip-next">
            {daysToNext} days to {nextLevel.label}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelChip;
