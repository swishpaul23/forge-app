import React from 'react';
import { NAV } from '../../constants/navigation';

/**
 * Navigation - Side navigation bar
 */
const Navigation = ({ page, setPage, onDW }) => {
  return (
    <nav className="nav-sidebar">
      <div className="nav-logo">
        <span className="nav-logo-text">FORGE</span>
      </div>
      <div className="nav-items">
        {NAV.map(item => (
          <div
            key={item.id}
            id={`tut-${item.id}`}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            title={item.tip}
          >
            {item.icon}
            <span className="nav-tooltip">{item.tip}</span>
          </div>
        ))}
      </div>
      <div className="nav-bottom">
        <button
          id="tut-deepwork"
          className="btn btn-a nav-dw-btn"
          onClick={onDW}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Deep Work
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
