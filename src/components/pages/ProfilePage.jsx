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
// HEATMAP COMPONENT (compact for mobile)
// ============================================================
const ActivityHeatmap = ({ checkins = [], weeks = 10 }) => {
  const today = new Date();
  const cells = [];
  
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
  
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7) + 1);
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
      
      // Match Wall's 5-level color scheme using accent color
      let level = 0; // level-0 = no data / missed
      if (isFuture) {
        level = -1; // future = dim
      } else if (score !== undefined) {
        if (score === 0) level = 0;
        else if (score <= 25) level = 1;
        else if (score <= 50) level = 2;
        else if (score <= 75) level = 3;
        else level = 4;
      }
      
      let bg = 'var(--bg-3)'; // level-0
      if (level === -1) bg = 'var(--bg-1)';
      else if (level === 1) bg = 'color-mix(in srgb, var(--accent) 25%, var(--bg-2))';
      else if (level === 2) bg = 'color-mix(in srgb, var(--accent) 50%, var(--bg-2))';
      else if (level === 3) bg = 'color-mix(in srgb, var(--accent) 75%, var(--bg-2))';
      else if (level === 4) bg = 'var(--accent)';
      
      // Today ring handled separately
      cells.push({ key: dateKey, bg, isToday, level });
    }
  }
  
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${weeks}, 1fr)`,
        gridTemplateRows: 'repeat(7, 10px)',
        gap: 2,
        gridAutoFlow: 'column',
      }}>
        {cells.map((cell) => (
          <div key={cell.key} style={{
            background: cell.isToday ? 'var(--accent)' : cell.bg,
            borderRadius: 2,
            boxShadow: cell.isToday ? '0 0 0 1px var(--bg-0), 0 0 0 2px var(--accent)' : 'none',
          }} />
        ))}
      </div>
      
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, marginTop: 8,
        fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500, color: 'var(--text-2)',
      }}>
        <span>Less</span>
        <div style={{ width: 8, height: 8, background: 'var(--bg-3)', borderRadius: 2 }} />
        <div style={{ width: 8, height: 8, background: 'color-mix(in srgb, var(--accent) 25%, var(--bg-2))', borderRadius: 2 }} />
        <div style={{ width: 8, height: 8, background: 'color-mix(in srgb, var(--accent) 50%, var(--bg-2))', borderRadius: 2 }} />
        <div style={{ width: 8, height: 8, background: 'color-mix(in srgb, var(--accent) 75%, var(--bg-2))', borderRadius: 2 }} />
        <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: 2 }} />
        <span>More</span>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PROFILE PAGE (MOBILE)
// ============================================================
const ProfilePage = ({
  onBack,
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
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const currentLevel = getLevel(daysForged);
  const nextLevel = levels?.find(l => l.min > daysForged);
  const daysToNext = nextLevel ? nextLevel.min - daysForged : 0;
  const progress = nextLevel 
    ? ((daysForged - (currentLevel?.min || 0)) / (nextLevel.min - (currentLevel?.min || 0))) * 100
    : 100;

  return (
    <div className="page" style={{ padding: 0, minHeight: '100vh', background: 'var(--bg-0)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-0)',
      }}>
        <div
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
            color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 14 }}>←</span> BACK
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
          letterSpacing: '.1em', color: 'var(--text-1)',
        }}>PROFILE</div>
        <div style={{ width: 50 }} />
      </div>
      
      {/* Avatar & Name */}
      <div style={{
        padding: '32px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%)',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent) 0%, #E5A73B 100%)',
          margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: 'var(--bg-0)',
          border: '3px solid var(--bg-0)',
          boxShadow: '0 0 0 2px var(--accent)',
        }}>{getInitials(userName)}</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: '.02em', color: 'var(--text-0)' }}>
          {(userName || 'User').toUpperCase()}
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
          color: 'var(--text-2)', letterSpacing: '.08em', marginTop: 6,
        }}>{fmtMemberSince(memberSince)}</div>
      </div>
      
      {/* Stats */}
      <div style={{
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        borderBottom: '1px solid var(--border-0)',
      }}>
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
            color: 'var(--accent)', lineHeight: 1, marginBottom: 4,
          }}>{currentLevel?.title?.toUpperCase() || 'INITIATE'}</div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500,
            color: 'var(--text-2)', letterSpacing: '.06em',
          }}>TITLE</div>
        </div>
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
            color: 'var(--warn)', lineHeight: 1,
          }}>{longestStreak}</div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500,
            color: 'var(--text-2)', letterSpacing: '.06em',
          }}>LONGEST STREAK</div>
        </div>
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
            color: 'var(--ok)', lineHeight: 1,
          }}>{consistency}%</div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500,
            color: 'var(--text-2)', letterSpacing: '.06em',
          }}>CONSISTENCY</div>
        </div>
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
                padding: '14px 0',
                textAlign: 'center',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-2)',
                letterSpacing: '.06em',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >{tab}</div>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div style={{ padding: 20 }}>
        {activeTab === 'overview' && (
          <>
            {mission && (
              <>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500,
                  letterSpacing: '.1em', color: 'var(--text-2)', marginBottom: 10,
                }}>MISSION</div>
                <div style={{
                  fontFamily: 'Georgia, serif', fontSize: 14, fontStyle: 'italic',
                  color: 'var(--text-1)', lineHeight: 1.5, marginBottom: 20,
                }}>"{mission}"</div>
              </>
            )}
            
            {challenge && (
              <>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500,
                  letterSpacing: '.1em', color: 'var(--text-2)', marginBottom: 10,
                }}>CURRENT CHALLENGE</div>
                <div style={{
                  background: 'var(--bg-1)',
                  border: '1px solid var(--border-0)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--text-0)' }}>{challenge.name}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>
                        DAY {challenge.dayNum} OF {challenge.totalDays}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--accent)' }}>
                      {Math.round((challenge.dayNum / challenge.totalDays) * 100)}%
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, marginTop: 12 }}>
                    <div style={{
                      width: `${(challenge.dayNum / challenge.totalDays) * 100}%`,
                      height: '100%', background: 'var(--accent)', borderRadius: 2,
                    }} />
                  </div>
                </div>
              </>
            )}
            
            <div style={{ padding: 16, background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500,
                  letterSpacing: '.08em', color: 'var(--text-2)',
                }}>TOTAL DAYS FORGED</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'var(--text-0)' }}>{daysForged}</div>
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
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, color: 'var(--text-2)' }}>
                  {daysToNext} days to <span style={{ color: 'var(--accent)' }}>{nextLevel.title.toUpperCase()}</span>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'activity' && (
          <>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500,
              letterSpacing: '.1em', color: 'var(--text-2)', marginBottom: 12,
            }}>ACTIVITY · LAST 10 WEEKS</div>
            <ActivityHeatmap checkins={checkins} weeks={10} />
          </>
        )}
        
        {activeTab === 'badges' && (
          <>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500,
              letterSpacing: '.1em', color: 'var(--text-2)', marginBottom: 12,
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
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: 'var(--text-2)',
              }}>Complete challenges to earn badges</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;