import React, { useState, useMemo } from 'react';
import { getLevel } from '../../constants/levels';

// ============================================================
// HELPERS
// ============================================================
const fmtMemberSince = (dateStr) => {
  if (!dateStr) return 'MEMBER';
  const d = new Date(dateStr);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `MEMBER SINCE ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

// ============================================================
// HEATMAP COMPONENT
// ============================================================
const ActivityHeatmap = ({ checkins = [], weeks = 12 }) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const today = new Date();
  const cells = [];
  
  // Build lookup of checkin dates
  const checkinMap = useMemo(() => {
    const map = {};
    checkins.forEach(c => {
      const dateKey = c.date || c.created_at?.split('T')[0];
      if (dateKey) {
        map[dateKey] = c.score || c.pct || 100;
      }
    });
    return map;
  }, [checkins]);
  
  // Format date for tooltip
  const fmtTooltipDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };
  
  // Generate cells for last N weeks (7 rows x N columns)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7) + 1);
  // Align to Monday
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + diff);
  
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + (week * 7) + day);
      const dateKey = cellDate.toISOString().split('T')[0];
      const isToday = dateKey === today.toISOString().split('T')[0];
      const isFuture = cellDate > today;
      const score = checkinMap[dateKey];
      
      let bg = 'var(--bg-2)'; // empty/missed
      if (isFuture) {
        bg = 'var(--bg-1)';
      } else if (isToday) {
        bg = 'var(--accent)';
      } else if (score !== undefined) {
        if (score >= 80) bg = 'var(--ok)';
        else if (score >= 50) bg = 'rgba(93, 191, 138, 0.6)';
        else if (score > 0) bg = 'rgba(93, 191, 138, 0.35)';
      }
      
      cells.push({ key: dateKey, bg, isToday, isFuture, score });
    }
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingRight: 4 }}>
          {['M', '', 'W', '', 'F', '', 'S'].map((label, i) => (
            <div key={i} style={{
              height: 12, display: 'flex', alignItems: 'center',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--text-3)',
            }}>{label}</div>
          ))}
        </div>
        
        {/* Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${weeks}, 1fr)`,
          gridTemplateRows: 'repeat(7, 12px)',
          gap: 3,
          gridAutoFlow: 'column',
        }}>
          {cells.map((cell, i) => (
            <div
              key={cell.key}
              onMouseEnter={() => !cell.isFuture && setHoveredCell(cell)}
              onMouseLeave={() => setHoveredCell(null)}
              style={{
                background: cell.bg,
                borderRadius: 2,
                border: cell.isToday ? '1px solid var(--accent)' : 'none',
                cursor: cell.isFuture ? 'default' : 'pointer',
                transition: 'transform .1s',
                transform: hoveredCell?.key === cell.key ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Tooltip */}
      {hoveredCell && (
        <div style={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-3)',
          border: '1px solid var(--border-1)',
          borderRadius: 6,
          padding: '6px 10px',
          zIndex: 10,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: 'var(--text-0)',
          }}>
            {fmtTooltipDate(hoveredCell.key)}
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: hoveredCell.score !== undefined ? 'var(--ok)' : 'var(--text-3)',
            marginTop: 2,
          }}>
            {hoveredCell.score !== undefined ? `${Math.round(hoveredCell.score)}% complete` : 'No check-in'}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 12,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--text-3)',
      }}>
        <span>Less</span>
        <div style={{ width: 10, height: 10, background: 'var(--bg-2)', borderRadius: 2 }} />
        <div style={{ width: 10, height: 10, background: 'rgba(93, 191, 138, 0.35)', borderRadius: 2 }} />
        <div style={{ width: 10, height: 10, background: 'rgba(93, 191, 138, 0.6)', borderRadius: 2 }} />
        <div style={{ width: 10, height: 10, background: 'var(--ok)', borderRadius: 2 }} />
        <span>More</span>
      </div>
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ value, label, color = 'var(--text-0)' }) => (
  <div style={{
    background: 'var(--bg-2)',
    borderRadius: 10,
    padding: 16,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: typeof value === 'string' && value.length > 4 ? 18 : 28,
      color,
      lineHeight: 1,
      marginBottom: 4,
    }}>{value}</div>
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      color: 'var(--text-2)',
      letterSpacing: '.08em',
    }}>{label}</div>
  </div>
);

// ============================================================
// TAB CONTENT
// ============================================================
const OverviewTab = ({ mission, challenge, daysForged, levels }) => {
  const currentLevel = getLevel(daysForged);
  const nextLevel = levels?.find(l => l.min > daysForged);
  const daysToNext = nextLevel ? nextLevel.min - daysForged : 0;
  const progress = nextLevel 
    ? ((daysForged - (currentLevel?.min || 0)) / (nextLevel.min - (currentLevel?.min || 0))) * 100
    : 100;

  return (
    <div style={{ padding: 20 }}>
      {mission && (
        <>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
            letterSpacing: '.12em', color: 'var(--text-3)', marginBottom: 10,
          }}>MISSION</div>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: 14, fontStyle: 'italic',
            color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 20,
          }}>"{mission}"</div>
        </>
      )}
      
      {challenge && (
        <>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
            letterSpacing: '.12em', color: 'var(--text-3)', marginBottom: 10,
          }}>CURRENT CHALLENGE</div>
          <div style={{
            background: 'var(--accent-lo)',
            border: '1px solid var(--accent-mid)',
            borderRadius: 10,
            padding: 14,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18 }}>{challenge.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-3)' }}>
                  DAY {challenge.dayNum} OF {challenge.totalDays}
                </div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: 'var(--accent)' }}>
                {Math.round((challenge.dayNum / challenge.totalDays) * 100)}%
              </div>
            </div>
          </div>
        </>
      )}
      
      <div style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
            letterSpacing: '.1em', color: 'var(--text-3)',
          }}>TOTAL DAYS FORGED</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20 }}>{daysForged}</div>
        </div>
        <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, marginBottom: 8 }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent), var(--ok))',
            borderRadius: 2,
          }} />
        </div>
        {nextLevel && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-3)' }}>
            {daysToNext} days to <span style={{ color: 'var(--accent)' }}>{nextLevel.title.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityTab = ({ checkins }) => (
  <div style={{ padding: 20 }}>
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
      letterSpacing: '.12em', color: 'var(--text-3)', marginBottom: 12,
    }}>ACTIVITY · LAST 12 WEEKS</div>
    <ActivityHeatmap checkins={checkins} weeks={12} />
  </div>
);

const BadgesTab = ({ badges = [] }) => (
  <div style={{ padding: 20 }}>
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
      letterSpacing: '.12em', color: 'var(--text-3)', marginBottom: 12,
    }}>BADGES EARNED</div>
    {badges.length > 0 ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {badges.map((badge, i) => (
          <div key={i} style={{
            width: 48, height: 48,
            background: 'var(--bg-2)', border: '1px solid var(--border-1)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>{badge.icon}</div>
        ))}
      </div>
    ) : (
      <div style={{
        padding: 32, textAlign: 'center',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-3)',
      }}>Complete challenges to earn badges</div>
    )}
  </div>
);

// ============================================================
// MAIN PROFILE PANEL
// ============================================================
const ProfilePanel = ({
  open,
  onClose,
  userName,
  memberSince,
  mission,
  challenge,
  checkins = [],
  longestStreak = 0,
  consistency = 0,
  daysForged = 0,
  badges = [],
  levels,
  profileImageUrl,
  onUploadImage,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      onUploadImage(file);
    }
  };
  
  if (!open) return null;
  
  const currentLevel = getLevel(daysForged);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
        }}
      />
      
      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 340,
        background: 'var(--bg-1)',
        borderLeft: '1px solid var(--border-0)',
        zIndex: 201,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: 20,
          borderBottom: '1px solid var(--border-0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
            letterSpacing: '.15em', color: 'var(--text-2)',
          }}>PROFILE</div>
          <div
            onClick={onClose}
            style={{
              width: 28, height: 28,
              border: '1px solid var(--border-1)',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 14, color: 'var(--text-3)',
            }}
          >×</div>
        </div>
        
        {/* Avatar & Name */}
        <div style={{ padding: 24, textAlign: 'center', borderBottom: '1px solid var(--border-0)' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: profileImageUrl ? 'transparent' : 'linear-gradient(135deg, var(--accent) 0%, #E5A73B 100%)',
              margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--bg-0)',
              overflow: 'hidden',
            }}>
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitials(userName)
              )}
            </div>
            {/* Upload button */}
            <label style={{
              position: 'absolute', bottom: 0, right: -4,
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--bg-2)', border: '1px solid var(--border-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 12, color: 'var(--text-2)',
              transition: 'all .15s',
            }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              ✎
            </label>
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '.02em', marginTop: 14 }}>
            {(userName || 'User').toUpperCase()}
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
            color: 'var(--text-2)', marginTop: 4,
          }}>{fmtMemberSince(memberSince)}</div>
        </div>
        
        {/* Stats */}
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderBottom: '1px solid var(--border-0)' }}>
          <StatCard value={currentLevel?.title?.toUpperCase() || 'INITIATE'} label="TITLE" color="var(--accent)" />
          <StatCard value={longestStreak} label="LONGEST STREAK" color="var(--warn)" />
          <StatCard value={`${consistency}%`} label="CONSISTENCY" color="var(--ok)" />
        </div>
        
        {/* Tabs */}
        <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border-0)' }}>
          <div style={{ display: 'flex' }}>
            {['overview', 'activity', 'badges'].map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  textAlign: 'center',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-2)',
                  letterSpacing: '.08em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'color .15s',
                }}
              >{tab}</div>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'overview' && (
            <OverviewTab mission={mission} challenge={challenge} daysForged={daysForged} levels={levels} />
          )}
          {activeTab === 'activity' && (
            <ActivityTab checkins={checkins} />
          )}
          {activeTab === 'badges' && (
            <BadgesTab badges={badges} />
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default ProfilePanel;