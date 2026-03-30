import React, { useState, useMemo } from 'react';
import { getLevel } from '../../constants/levels';

// ============================================================
// HELPERS
// ============================================================
const fmtMemberSince = (dateStr) => {
  if (!dateStr) return 'MEMBER';
  const d = new Date(dateStr);
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
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
      
      let bg = 'var(--bg-2)';
      if (isFuture) {
        bg = 'var(--bg-1)';
      } else if (isToday) {
        bg = 'var(--accent)';
      } else if (score !== undefined) {
        if (score >= 80) bg = 'var(--ok)';
        else if (score >= 50) bg = 'rgba(93, 191, 138, 0.6)';
        else if (score > 0) bg = 'rgba(93, 191, 138, 0.35)';
      }
      
      cells.push({ key: dateKey, bg, isToday });
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
            background: cell.bg,
            borderRadius: 2,
          }} />
        ))}
      </div>
      
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 8,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--text-3)',
      }}>
        <span>Less</span>
        <div style={{ width: 8, height: 8, background: 'var(--bg-2)', borderRadius: 2 }} />
        <div style={{ width: 8, height: 8, background: 'rgba(93, 191, 138, 0.35)', borderRadius: 2 }} />
        <div style={{ width: 8, height: 8, background: 'var(--ok)', borderRadius: 2 }} />
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
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            color: 'var(--text-3)', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 14 }}>←</span> BACK
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          letterSpacing: '.15em', color: 'var(--text-2)',
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
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: '.02em' }}>
          {(userName || 'User').toUpperCase()}
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          color: 'var(--text-3)', marginTop: 6,
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
            color: 'var(--accent)', lineHeight: 1, marginBottom: 2,
          }}>{currentLevel?.title?.toUpperCase() || 'INITIATE'}</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
            color: 'var(--text-3)', letterSpacing: '.08em',
          }}>TITLE</div>
        </div>
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
            color: 'var(--warn)', lineHeight: 1,
          }}>{longestStreak}</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
            color: 'var(--text-3)', letterSpacing: '.08em',
          }}>LONGEST STREAK</div>
        </div>
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
            color: 'var(--ok)', lineHeight: 1,
          }}>{consistency}%</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
            color: 'var(--text-3)', letterSpacing: '.08em',
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
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-3)',
                letterSpacing: '.08em',
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
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20 }}>{challenge.name}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-3)' }}>
                        DAY {challenge.dayNum} OF {challenge.totalDays}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: 'var(--accent)' }}>
                      {Math.round((challenge.dayNum / challenge.totalDays) * 100)}%
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 2, marginTop: 12 }}>
                    <div style={{
                      width: `${(challenge.dayNum / challenge.totalDays) * 100}%`,
                      height: '100%', background: 'var(--accent)', borderRadius: 2,
                    }} />
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
          </>
        )}
        
        {activeTab === 'activity' && (
          <>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
              letterSpacing: '.12em', color: 'var(--text-3)', marginBottom: 12,
            }}>ACTIVITY · LAST 10 WEEKS</div>
            <ActivityHeatmap checkins={checkins} weeks={10} />
          </>
        )}
        
        {activeTab === 'badges' && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;