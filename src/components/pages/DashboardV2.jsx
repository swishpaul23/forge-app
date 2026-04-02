import React, { useState } from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import DashboardMobile from './DashboardMobile';

// ============================================================
// CONSTANTS & HELPERS
// ============================================================
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const DAY_LABELS_FULL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

const getTodayName = () => {
  const d = new Date().getDay();
  return DAYS[d === 0 ? 6 : d - 1];
};

const pct = (n, d) => d === 0 ? 0 : Math.round((n / d) * 100);

const fmtDate = () => {
  const d = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
};

// ============================================================
// MOMENTUM METER
// ============================================================
const MOMENTUM_SEGMENTS = 20;
const getMomentumState = (v) => {
  if (v <= 30)  return { color: '#4A6A8A', label: 'Building initial inertia', vibrate: false };
  if (v <= 70)  return { color: '#5DBF8A', label: 'Consistency established',  vibrate: false };
  if (v <= 89)  return { color: '#D4922A', label: 'High momentum detected',   vibrate: true  };
  return              { color: '#E8F2FA', label: 'Flow state achieved',        vibrate: false };
};
const getMomentumSegColor = (i, filled, v) => {
  if (i >= filled) return '#2A2A25';
  if (v >= 90) return '#7A9DB5';
  const r = i / (MOMENTUM_SEGMENTS - 1);
  if (v <= 30) return `hsl(210,40%,${28 + r * 12}%)`;
  if (v <= 70) return `rgb(${Math.round(93+r*100)},${Math.round(191-r*40)},${Math.round(138-r*80)})`;
  return `rgb(${Math.round(93+r*119)},${Math.round(191-r*46)},${Math.round(138-r*138)})`;
};

const MomentumMeter = ({ momentum = 0, compact = false, minWidth = 180 }) => {
  const v      = Math.round(momentum);
  const state  = getMomentumState(v);
  const isFlow = v >= 90;
  const filled = Math.round((v / 100) * MOMENTUM_SEGMENTS);

  const boxStyle = {
    position: 'relative', overflow: 'hidden',
    background: isFlow
      ? 'linear-gradient(135deg,#2C3540 0%,#3E4E5E 25%,#5A6E80 50%,#3E4E5E 75%,#2C3540 100%)'
      : 'var(--bg-1)',
    border: `1px solid ${isFlow ? '#A0BDD0' : 'var(--border-0)'}`,
    borderRadius: 10,
    padding: compact ? '12px' : '12px 16px',
    transition: 'background .8s ease, border-color .8s ease',
    textAlign: compact ? 'center' : 'left',
    minWidth,
  };

  const segments = Array.from({ length: MOMENTUM_SEGMENTS }, (_, i) => {
    const color = getMomentumSegColor(i, filled, v);
    const isLast4 = i >= filled - 4 && i < filled;
    let anim = 'none';
    if (i < filled && isFlow) anim = 'mFlowPulse 1.8s ease-in-out infinite';
    else if (i < filled && state.vibrate && isLast4) anim = 'mVibrate .12s infinite';
    return (
      <div key={i} style={{
        flex: 1, height: 5, borderRadius: 2,
        background: color,
        animation: anim,
      }} />
    );
  });

  return (
    <>
      <style>{`
        @keyframes mVibrate{0%,100%{transform:translateY(0)}25%{transform:translateY(-1px)}75%{transform:translateY(1px)}}
        @keyframes mFlowPulse{0%,100%{opacity:1}50%{opacity:0.55}}
        @keyframes mShine{0%{transform:translateX(-80%)}50%{transform:translateX(80%)}100%{transform:translateX(-80%)}}
      `}</style>
      <div style={boxStyle}>
        {/* Shine overlay for flow state */}
        {isFlow && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(105deg,transparent 35%,rgba(220,235,248,0.28) 48%,rgba(255,255,255,0.45) 50%,rgba(220,235,248,0.28) 52%,transparent 65%)',
            animation: 'mShine 2.8s ease-in-out infinite',
          }} />
        )}
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize: 9, letterSpacing:'.14em', textTransform:'uppercase', color: isFlow ? '#A0BDD0' : 'var(--text-2)', fontWeight: 500, marginBottom: 4 }}>
          Momentum
        </div>
        {!compact && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 52, lineHeight: 1, color: state.color, transition:'color .6s' }}>{v}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize: 9, letterSpacing:'.1em', textTransform:'uppercase', color: state.color, transition:'color .6s', textAlign:'right', maxWidth: 100 }}>{state.label}</div>
          </div>
        )}
        {compact && (
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 28, lineHeight: 1, color: state.color, transition:'color .6s' }}>{v}</div>
        )}
        <div style={{ display:'flex', gap: 3, marginTop: compact ? 4 : 6 }}>
          {segments}
        </div>
        {compact && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize: 8, letterSpacing:'.1em', textTransform:'uppercase', color: state.color, marginTop: 4 }}>{state.label}</div>
        )}
      </div>
    </>
  );
};

// Non-negotiable icon component
const NonNegIcon = ({ size = 14, color = "var(--ok)" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path d="M5.5,5.5h37l-37,37h37Z" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================
// COMPLETION RING
// ============================================================
const CompletionRing = ({ done, total, size = 44 }) => {
  const pctVal = total > 0 ? (done / total) * 100 : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pctVal / 100) * circ;
  
  const getColor = () => {
    if (pctVal === 0) return 'var(--text-3)';
    if (pctVal < 50) return 'var(--accent)';
    if (pctVal < 100) return 'var(--warn)';
    return 'var(--ok)';
  };
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={getColor()} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.32, letterSpacing: '.02em',
      }}>{done}/{total}</div>
    </div>
  );
};

// ============================================================
// TASK CARD
// ============================================================
const TaskCard = ({ task, checked, onToggle, color = "var(--accent)" }) => (
  <div
    onClick={onToggle}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px',
      background: checked ? `${color}12` : 'var(--bg-2)',
      border: `1px solid ${checked ? `${color}40` : 'var(--border-1)'}`,
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'all .15s',
    }}
  >
    <div style={{
      width: 20, height: 20, borderRadius: '50%',
      border: checked ? 'none' : '2px solid var(--text-2)',
      background: checked ? color : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, color: 'var(--bg-0)',
      transition: 'all .15s',
      flexShrink: 0,
    }}>{checked && '✓'}</div>
    <span style={{
      fontFamily: "'DM Sans', sans-serif", fontSize: 14, flex: 1, fontWeight: 500,
      color: checked ? 'var(--text-2)' : 'var(--text-0)',
      textDecoration: checked ? 'line-through' : 'none',
    }}>{task.label}</span>
    {task.nonNeg && <NonNegIcon size={14} color="var(--ok)" />}
  </div>
);

// ============================================================
// TASK COLUMN
// ============================================================
const TaskColumn = ({ title, tasks, color, done, total, checked, onToggle }) => (
  <div style={{
    background: 'var(--bg-1)',
    border: '1px solid var(--border-1)',
    borderRadius: 14,
    padding: 20,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
        letterSpacing: '.02em', color: color, textTransform: 'uppercase',
      }}>{title}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: color }}>{done}/{total}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tasks.map(task => (
        <TaskCard
          key={task.id || task.key}
          task={task}
          checked={checked[task.id || task.key]}
          onToggle={() => onToggle(task.id || task.key)}
          color={color}
        />
      ))}
      {tasks.length === 0 && (
        <div style={{
          padding: 24, textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-2)',
        }}>No tasks</div>
      )}
    </div>
  </div>
);

// ============================================================
// MISSION EDIT MODAL
// ============================================================
const MissionModal = ({ mission, onSave, onClose }) => {
  const [val, setVal] = useState(mission || '');

  const handleSave = () => {
    if (onSave) {
      onSave(val.trim());
    }
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--bg-1)', border: '1px solid var(--border-0)',
        borderRadius: 16, width: 520, zIndex: 101,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-0)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.15em', color: 'var(--text-3)' }}>
            MISSION STATEMENT
          </div>
          <div onClick={onClose} style={{
            width: 28, height: 28, border: '1px solid var(--border-1)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 14, color: 'var(--text-3)',
          }}>×</div>
        </div>
        <div style={{ padding: 24 }}>
          <textarea
            value={val}
            onChange={e => setVal(e.target.value.slice(0, 300))}
            placeholder="I am becoming someone who..."
            rows={4}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'var(--bg-0)', border: '1px solid var(--border-1)',
              borderRadius: 10, color: 'var(--text-0)',
              fontFamily: 'Georgia, serif', fontSize: 15, fontStyle: 'italic',
              lineHeight: 1.6, resize: 'none', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 6 }}>
            {val.length}/300
          </div>
        </div>
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-0)',
          display: 'flex', gap: 12,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 14, background: 'var(--bg-2)',
            border: '1px solid var(--border-1)', borderRadius: 8,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
            color: 'var(--text-2)', cursor: 'pointer',
          }}>CANCEL</button>
          <button onClick={handleSave} style={{
            flex: 1, padding: 14, background: 'var(--accent)',
            border: 'none', borderRadius: 8,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
            color: 'var(--bg-0)', cursor: 'pointer',
          }}>SAVE</button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// CHALLENGE DETAIL MODAL (with YOUR OBJECTIVE + task editor)
// ============================================================
const ChallengeDetailModal = ({ challenge, type, onClose, onUpdateTasks }) => {
  const [localKpis, setLocalKpis] = useState(challenge?.kpis || []);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!challenge) return null;

  const addTask = () => {
    if (!newTaskLabel.trim()) return;
    const newTask = { key: `kpi_${Date.now()}`, label: newTaskLabel.trim(), nonNeg: false };
    setLocalKpis([...localKpis, newTask]);
    setNewTaskLabel('');
  };

  const removeTask = (key) => {
    setLocalKpis(localKpis.filter(k => k.key !== key));
  };

  const toggleNonNeg = (key) => {
    setLocalKpis(localKpis.map(k => k.key === key ? { ...k, nonNeg: !k.nonNeg } : k));
  };

  const handleSave = () => {
    if (onUpdateTasks) {
      onUpdateTasks(challenge.id, localKpis);
    }
    setIsEditing(false);
  };

  const accentColor = type === 'main' ? 'var(--accent)' : '#7F77DD';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--bg-1)', border: '1px solid var(--border-0)',
        borderRadius: 16, width: 560, maxHeight: '85vh', overflow: 'hidden',
        zIndex: 101, display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.12em', color: accentColor, marginBottom: 6 }}>
                ★ {type === 'main' ? 'CUSTOM' : 'SECONDARY'}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, lineHeight: 1 }}>{challenge.name.toUpperCase()}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-warm)', marginTop: 6 }}>
                DAY {challenge.dayNum} OF {challenge.totalDays} · {challenge.totalDays - challenge.dayNum} DAYS REMAINING
              </div>
            </div>
            <div onClick={onClose} style={{
              width: 32, height: 32, border: '1px solid var(--border-1)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, color: 'var(--text-3)',
            }}>×</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--warn)' }}>{challenge.streak || 0}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-2)' }}>STREAK</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--ok)' }}>{challenge.consistency || 0}%</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-2)' }}>CONSISTENCY</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: accentColor }}>{pct(challenge.dayNum, challenge.totalDays)}%</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'var(--text-2)' }}>COMPLETE</div>
            </div>
          </div>
        </div>

        {/* Body - scrollable */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {/* YOUR OBJECTIVE (renamed from YOUR MISSION) */}
          {challenge.objective && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '.12em', color: 'var(--text-3)', marginBottom: 8 }}>YOUR OBJECTIVE</div>
              <div style={{
                padding: '12px 16px', background: 'var(--bg-2)', borderRadius: 10,
                borderLeft: `3px solid ${accentColor}`,
              }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontStyle: 'italic', color: 'var(--text-1)' }}>"{challenge.objective}"</div>
              </div>
            </div>
          )}

          {/* Daily Tasks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '.12em', color: 'var(--text-3)' }}>
              DAILY TASKS ({localKpis.length})
            </div>
            <button onClick={() => setIsEditing(!isEditing)} style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: accentColor,
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}>✎ EDIT TASKS</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {localKpis.map(kpi => (
              <div key={kpi.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-2)',
                border: '1px solid var(--border-1)', borderRadius: 10,
              }}>
                <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{kpi.label}</span>
                {isEditing ? (
                  <>
                    <div
                      onClick={() => toggleNonNeg(kpi.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px',
                        background: kpi.nonNeg ? 'var(--ok)15' : 'transparent',
                        border: `1px solid ${kpi.nonNeg ? 'var(--ok)' : 'var(--border-1)'}`,
                        borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      <NonNegIcon size={12} color={kpi.nonNeg ? 'var(--ok)' : 'var(--text-3)'} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: kpi.nonNeg ? 'var(--ok)' : 'var(--text-3)' }}>NON-NEG</span>
                    </div>
                    <div onClick={() => removeTask(kpi.key)} style={{
                      width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--text-3)', fontSize: 16,
                    }}>×</div>
                  </>
                ) : (
                  kpi.nonNeg && <NonNegIcon size={14} color="var(--ok)" />
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  type="text" value={newTaskLabel}
                  onChange={e => setNewTaskLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Add task..."
                  style={{
                    flex: 1, padding: '12px 14px',
                    background: 'var(--bg-0)', border: '1px solid var(--border-1)',
                    borderRadius: 8, color: 'var(--text-0)',
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, outline: 'none',
                  }}
                />
                <button onClick={addTask} style={{
                  padding: '12px 20px', background: accentColor,
                  border: 'none', borderRadius: 8,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  color: 'var(--bg-0)', cursor: 'pointer',
                }}>ADD</button>
              </div>
              <button onClick={handleSave} style={{
                width: '100%', marginTop: 12, padding: 14,
                background: 'var(--ok)', border: 'none', borderRadius: 8,
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
                color: 'var(--bg-0)', cursor: 'pointer',
              }}>SAVE CHANGES</button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-0)' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: 14, background: 'var(--bg-2)',
            border: '1px solid var(--border-1)', borderRadius: 10,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
            color: 'var(--text-2)', cursor: 'pointer',
          }}>Close</button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// CHALLENGE CARDS (max 2 secondary)
// ============================================================
const ChallengeCards = ({ challenges, onViewChallenge }) => {
  const { main, secondary } = challenges;
  if (!main) return null;

  const mainPct = pct(main.dayNum, main.totalDays);
  // Limit to 2 secondary challenges
  const visibleSecondary = (secondary || []).slice(0, 2);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: visibleSecondary.length > 0 ? '1.6fr 1fr' : '1fr', gap: 14, marginBottom: 20 }}>
      
      {/* Main Challenge Hero Card */}
      <div
        onClick={() => onViewChallenge(main, 'main')}
        style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border-0)',
          borderRadius: 14, padding: '22px 24px', cursor: 'pointer',
          transition: 'border-color .15s',
          position: 'relative', overflow: 'hidden',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)' }} />
        
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.15em', color: 'var(--accent)', marginBottom: 8 }}>
          ★ MAIN CHALLENGE
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, lineHeight: 1, marginBottom: 4 }}>
          {main.name.toUpperCase()}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-warm)', letterSpacing: '.08em', marginBottom: 20 }}>
          DAY {main.dayNum} OF {main.totalDays} · {main.totalDays - main.dayNum} DAYS REMAINING · STARTED {new Date(main.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, lineHeight: 1, color: 'var(--accent)' }}>{mainPct}%</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '.1em' }}>COMPLETE</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, lineHeight: 1, color: 'var(--ok)' }}>{main.consistency || 0}%</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '.1em' }}>CONSISTENCY</div>
          </div>
        </div>

        <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
          <div style={{ width: `${mainPct}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-3)' }}>DAY 1</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-3)' }}>DAY {main.totalDays}</div>
        </div>
      </div>

      {/* Secondary Cards - max 2 */}
      {visibleSecondary.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visibleSecondary.map(c => (
            <div
              key={c.id}
              onClick={() => onViewChallenge(c, 'secondary')}
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border-0)',
                borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
                flex: 1, transition: 'border-color .15s',
                position: 'relative', overflow: 'hidden',
                minHeight: 90,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#7F77DD'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#7F77DD' }} />
              
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '.12em', color: '#7F77DD', marginBottom: 6 }}>SECONDARY</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, lineHeight: 1.1, marginBottom: 8 }}>{c.name.toUpperCase()}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-warm)', marginBottom: 12 }}>DAY {c.dayNum} · {c.totalDays - c.dayNum} LEFT</div>
              <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 2 }}>
                <div style={{ width: `${pct(c.dayNum, c.totalDays)}%`, height: '100%', background: '#7F77DD', borderRadius: 2 }} />
              </div>
            </div>
          ))}

          {/* Empty secondary slots - max 2 total */}
          {visibleSecondary.length < 2 && Array.from({ length: 2 - visibleSecondary.length }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              background: 'transparent', border: '1px dashed var(--border-1)',
              borderRadius: 12, padding: '16px 18px', flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 90,
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-3)', letterSpacing: '.1em' }}>+ ADD SECONDARY</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// REGIMEN EDITOR MODAL
// ============================================================
const RegimenEditorModal = ({ regimen, editDay, setEditDay, onSave, onClose }) => {
  const [localRegimen, setLocalRegimen] = useState(() => JSON.parse(JSON.stringify(regimen || { days: {} })));
  const [newTaskLabel, setNewTaskLabel] = useState('');

  const dayTasks = localRegimen.days?.[editDay] || [];

  const addTask = () => {
    if (!newTaskLabel.trim()) return;
    const newTask = { id: `reg_${Date.now()}`, label: newTaskLabel.trim(), nonNeg: false };
    setLocalRegimen(prev => ({
      ...prev,
      days: { ...prev.days, [editDay]: [...(prev.days?.[editDay] || []), newTask] },
    }));
    setNewTaskLabel('');
  };

  const removeTask = (taskId) => {
    setLocalRegimen(prev => ({
      ...prev,
      days: { ...prev.days, [editDay]: (prev.days?.[editDay] || []).filter(t => t.id !== taskId) },
    }));
  };

  const toggleNonNeg = (taskId) => {
    setLocalRegimen(prev => ({
      ...prev,
      days: { ...prev.days, [editDay]: (prev.days?.[editDay] || []).map(t => t.id === taskId ? { ...t, nonNeg: !t.nonNeg } : t) },
    }));
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--bg-1)', border: '1px solid var(--border-0)',
        borderRadius: 16, width: 480, maxHeight: '80vh', overflow: 'hidden',
        zIndex: 101, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-0)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.15em', color: 'var(--text-3)' }}>EDIT WEEKLY REGIMEN</div>
          <div onClick={onClose} style={{
            width: 28, height: 28, border: '1px solid var(--border-1)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 14, color: 'var(--text-3)',
          }}>×</div>
        </div>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-0)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {DAYS.map(day => {
              const isActive = day === editDay;
              const count = (localRegimen.days?.[day] || []).length;
              return (
                <div key={day} onClick={() => setEditDay(day)} style={{
                  flex: 1, padding: '10px 0', textAlign: 'center',
                  background: isActive ? 'var(--accent-lo)' : 'var(--bg-2)',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-1)',
                  borderRadius: 8, cursor: 'pointer',
                }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>{DAY_LABELS[day]}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: isActive ? 'var(--accent)' : count > 0 ? 'var(--text-2)' : 'var(--text-3)', marginTop: 2 }}>{count || '·'}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '.12em', color: 'var(--text-3)', marginBottom: 12 }}>
            {DAY_LABELS_FULL[editDay].toUpperCase()} TASKS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dayTasks.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-2)',
                border: '1px solid var(--border-1)', borderRadius: 8,
              }}>
                <span style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{task.label}</span>
                <div
                  onClick={() => toggleNonNeg(task.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px',
                    background: task.nonNeg ? 'var(--ok)15' : 'transparent',
                    border: `1px solid ${task.nonNeg ? 'var(--ok)' : 'var(--border-1)'}`,
                    borderRadius: 6, cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  <NonNegIcon size={12} color={task.nonNeg ? 'var(--ok)' : 'var(--text-3)'} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '.05em', color: task.nonNeg ? 'var(--ok)' : 'var(--text-3)' }}>NON-NEG</span>
                </div>
                <div onClick={() => removeTask(task.id)} style={{
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-3)', fontSize: 16,
                }}>×</div>
              </div>
            ))}
            {dayTasks.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>
                No tasks for {DAY_LABELS_FULL[editDay]}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <input
              type="text" value={newTaskLabel}
              onChange={e => setNewTaskLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add task..."
              style={{
                flex: 1, padding: '12px 14px',
                background: 'var(--bg-0)', border: '1px solid var(--border-1)',
                borderRadius: 8, color: 'var(--text-0)',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, outline: 'none',
              }}
            />
            <button onClick={addTask} style={{
              padding: '12px 20px', background: 'var(--accent)',
              border: 'none', borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              color: 'var(--bg-0)', cursor: 'pointer',
            }}>ADD</button>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-0)', display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 14, background: 'var(--bg-2)',
            border: '1px solid var(--border-1)', borderRadius: 8,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
            color: 'var(--text-2)', cursor: 'pointer',
          }}>CANCEL</button>
          <button onClick={() => onSave(localRegimen)} style={{
            flex: 1, padding: 14, background: 'var(--accent)',
            border: 'none', borderRadius: 8,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
            color: 'var(--bg-0)', cursor: 'pointer',
          }}>SAVE</button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// REGIMEN WEEK BOX WITH HOVER TOOLTIP
// ============================================================
const RegimenWeekBox = ({ regimen, today, onEdit }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (day, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const hoveredTasks = hoveredDay ? (regimen?.days?.[hoveredDay] || []) : [];

  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border-0)',
      borderRadius: 12, padding: '18px 20px', position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: 'var(--accent)' }}>WEEKLY REGIMEN</div>
        <button onClick={onEdit} style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-2)',
          padding: '6px 14px', background: 'var(--bg-2)', border: '1px solid var(--border-1)',
          borderRadius: 6, cursor: 'pointer',
        }}>Edit</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center' }}>
        {DAYS.map(day => {
          const dayTasks = regimen?.days?.[day] || [];
          const count = dayTasks.length;
          const isToday = day === today;
          return (
            <div
              key={day}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                background: isToday ? 'var(--accent-lo)' : 'transparent',
                borderRadius: 8, padding: isToday ? '4px 0' : 0, margin: isToday ? '-4px 0' : 0,
                cursor: count > 0 ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: isToday ? 'var(--accent)' : 'var(--text-2)', marginBottom: 8 }}>{day.charAt(0).toUpperCase()}</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: isToday ? 'var(--accent)' : count > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>{count > 0 ? count : '·'}</div>
            </div>
          );
        })}
      </div>

      {/* Hover Tooltip */}
      {hoveredDay && hoveredTasks.length > 0 && (
        <div style={{
          position: 'fixed',
          left: tooltipPos.x,
          top: tooltipPos.y - 8,
          transform: 'translate(-50%, -100%)',
          background: 'var(--bg-0)',
          border: '1px solid var(--border-0)',
          borderRadius: 10,
          padding: '12px 16px',
          minWidth: 180,
          maxWidth: 260,
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '.12em', color: 'var(--accent)', marginBottom: 8 }}>
            {DAY_LABELS_FULL[hoveredDay].toUpperCase()}
          </div>
          {hoveredTasks.map((task, i) => (
            <div key={task.id || i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 0',
              borderTop: i > 0 ? '1px solid var(--border-1)' : 'none',
            }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, flex: 1, color: 'var(--text-0)' }}>{task.label}</span>
              {task.nonNeg && <NonNegIcon size={10} color="var(--ok)" />}
            </div>
          ))}
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid var(--bg-0)',
          }} />
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN DASHBOARD
// ============================================================
const DashboardV2 = ({
  challenge, challenges, kpis, toggle, checkins, userName, onLogDay, loggedToday,
  onAddSecondary, onViewChallenge, onStartChallenge, onUpdateChallengeTasks,
  regimen, onUpdateRegimen, regimenChecked, toggleRegimen,
  tempChecked, toggleTemp, dayType, onSetDayType,
  secondaryKpis, toggleSecondary, talosInsight, onRefreshTalos, mission, onSaveMission, momentum = 0,
}) => {
  const isMobile = useIsMobile();
  const [showRegimenEditor, setShowRegimenEditor] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [editDay, setEditDay] = useState(getTodayName());
  const [viewingChallenge, setViewingChallenge] = useState(null);

  if (isMobile) {
    return (
      <DashboardMobile
        challenge={challenge} challenges={challenges} kpis={kpis} toggle={toggle}
        userName={userName} onLogDay={onLogDay} loggedToday={loggedToday}
        regimen={regimen} onUpdateRegimen={onUpdateRegimen}
        regimenChecked={regimenChecked} toggleRegimen={toggleRegimen}
        tempChecked={tempChecked} toggleTemp={toggleTemp}
        dayType={dayType} onSetDayType={onSetDayType}
        secondaryKpis={secondaryKpis} toggleSecondary={toggleSecondary}
        talosInsight={talosInsight} onRefreshTalos={onRefreshTalos}
        mission={mission} onSaveMission={onSaveMission}
        onUpdateChallengeTasks={onUpdateChallengeTasks}
        momentum={momentum}
      />
    );
  }

  const today = getTodayName();
  const isScaled = dayType === 'scaled';

  const allTodayTasks = regimen?.days?.[today] || [];
  const allTodayTemp = (regimen?.temp_items || []).filter(t => t.days.includes(today));
  const allChallengeKpis = challenge?.kpis || [];

  const todayTasks = isScaled ? allTodayTasks.filter(t => t.nonNeg) : allTodayTasks;
  const todayTemp = isScaled ? allTodayTemp.filter(t => t.nonNeg) : allTodayTemp;
  const challengeKpis = isScaled ? allChallengeKpis.filter(k => k.nonNeg) : allChallengeKpis;

  const secondary = challenges?.secondary || [];
  const secondaryTaskList = secondary[0]?.kpis || [];
  const secondaryCheckedState = secondaryKpis?.[secondary[0]?.id] || {};

  const regimenTotal = todayTasks.length + todayTemp.length;
  const regimenDone = todayTasks.filter(t => regimenChecked[t.id]).length + todayTemp.filter(t => tempChecked[t.id]).length;
  const challengeDone = challengeKpis.filter(k => kpis[k.key]).length;
  const secondaryDone = secondaryTaskList.filter(k => secondaryCheckedState[k.key]).length;
  const totalTasks = regimenTotal + challengeKpis.length + secondaryTaskList.length;
  const totalDone = regimenDone + challengeDone + secondaryDone;

  const regimenCheckedCombined = { ...regimenChecked, ...tempChecked };
  const toggleRegimenCombined = (id) => {
    if (todayTasks.find(t => t.id === id)) toggleRegimen(id);
    else toggleTemp(id);
  };

  const handleViewChallenge = (c, type) => {
    setViewingChallenge({ challenge: c, type });
  };

  return (
    <div className="page dashboard-page" style={{ padding: '36px 40px 100px', maxWidth: 1100, margin: '0 auto' }}>

      {/* HERO HEADER */}
      <div style={{ borderBottom: '1px solid var(--border-0)', paddingBottom: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '.25em', color: 'var(--text-warm)', marginBottom: 10 }}>
              FORGE · {fmtDate().toUpperCase()}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: '.01em', lineHeight: 0.9 }}>
              GOOD {getTimeOfDay().toUpperCase()}, <span style={{ color: 'var(--accent)' }}>{userName.toUpperCase()}.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <MomentumMeter momentum={momentum} minWidth={260} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, lineHeight: 1, color: 'var(--ok)' }}>{challenge?.consistency || 0}%</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '.1em', marginTop: 4 }}>CONSISTENCY</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, lineHeight: 1, color: 'var(--accent)' }}>{challenge ? pct(challenge.dayNum, challenge.totalDays) : 0}%</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '.1em', marginTop: 4 }}>COMPLETE</div>
            </div>
          </div>
        </div>
      </div>

      {/* MISSION STATEMENT */}
      <div
        onClick={() => setShowMissionModal(true)}
        style={{
          borderLeft: '3px solid var(--accent)', background: 'var(--bg-1)',
          borderRadius: '0 10px 10px 0', padding: '14px 20px', marginBottom: 20, cursor: 'pointer',
        }}
      >
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontStyle: 'italic', color: mission ? 'var(--text-1)' : 'var(--text-3)', lineHeight: 1.6 }}>
          {mission ? `"${mission}"` : 'Click to set your mission statement...'}
        </div>
      </div>

      {/* BENTO ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.08em', color: 'var(--ok)' }}>TALOS</div>
            <div onClick={onRefreshTalos} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-2)',
              padding: '6px 12px', background: 'var(--bg-2)', border: '1px solid var(--border-1)',
              borderRadius: 6, cursor: 'pointer',
            }}>↻</div>
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontStyle: 'italic', color: 'var(--text-warm)', lineHeight: 1.5 }}>
            "{talosInsight || 'Focus on process, not outcome. Each rep, each page, each minute of deep work compounds.'}"
          </div>
        </div>

        <RegimenWeekBox regimen={regimen} today={today} onEdit={() => setShowRegimenEditor(true)} />
      </div>

      <ChallengeCards challenges={challenges} onViewChallenge={handleViewChallenge} />

      {/* DAY TYPE + PROGRESS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '.06em' }}>TODAY:</div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', padding: 4, borderRadius: 8 }}>
            {[{ id: 'full', label: 'FULL DAY', icon: '●' }, { id: 'scaled', label: 'SCALED', icon: '◐' }].map(type => {
              const isActive = (dayType || 'full') === type.id;
              return (
                <button key={type.id} onClick={() => onSetDayType && onSetDayType(type.id)} style={{
                  padding: '8px 16px', border: 'none', borderRadius: 6,
                  background: isActive ? 'var(--bg-0)' : 'transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                  color: isActive ? 'var(--text-0)' : 'var(--text-2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 9, opacity: isActive ? 1 : 0.6 }}>{type.icon}</span> {type.label}
                </button>
              );
            })}
          </div>
          {isScaled && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-2)', marginLeft: 8, maxWidth: 280 }}>
              Complete non-negotiables to keep streak. Max 2 scaled days/week.
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <CompletionRing done={totalDone} total={totalTasks} size={56} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, lineHeight: 1 }}>{pct(totalDone, totalTasks)}%</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{totalTasks - totalDone} LEFT</div>
          </div>
        </div>
      </div>

      {/* TASK COLUMNS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: secondary.length > 0 ? 'repeat(3, 1fr)' : challengeKpis.length > 0 ? '1fr 1fr' : '1fr',
        gap: 14, marginBottom: 24,
      }}>
        {regimenTotal > 0 && (
          <TaskColumn title={`REGIMEN · ${DAY_LABELS[today].toUpperCase()}`} tasks={[...todayTasks, ...todayTemp]} color="var(--ok)" done={regimenDone} total={regimenTotal} checked={regimenCheckedCombined} onToggle={toggleRegimenCombined} />
        )}
        {challengeKpis.length > 0 && (
          <TaskColumn title={challenge.name.toUpperCase()} tasks={challengeKpis.map(k => ({ id: k.key, key: k.key, label: k.label, nonNeg: k.nonNeg }))} color="var(--accent)" done={challengeDone} total={challengeKpis.length} checked={kpis} onToggle={toggle} />
        )}
        {secondary.length > 0 && secondary[0] && (
          <TaskColumn title={secondary[0].name.toUpperCase()} tasks={secondaryTaskList.map(k => ({ id: k.key, key: k.key, label: k.label, nonNeg: k.nonNeg }))} color="#7F77DD" done={secondaryDone} total={secondaryTaskList.length} checked={secondaryCheckedState} onToggle={(key) => toggleSecondary && toggleSecondary(secondary[0].id, key)} />
        )}
        {regimenTotal === 0 && challengeKpis.length === 0 && (
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, marginBottom: 8 }}>No tasks today</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--text-2)' }}>Start a challenge or set up your weekly regimen</div>
          </div>
        )}
      </div>

      <button
        onClick={() => onLogDay && onLogDay(totalDone, totalTasks)}
        disabled={loggedToday}
        style={{
          width: '100%', padding: 18,
          background: loggedToday ? 'var(--bg-2)' : 'var(--accent)',
          border: 'none', borderRadius: 10,
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '.1em',
          color: loggedToday ? 'var(--text-2)' : 'var(--bg-0)',
          cursor: loggedToday ? 'default' : 'pointer',
        }}
      >
        {loggedToday ? '✓ DAY LOGGED' : 'LOG DAY →'}
      </button>

      {showMissionModal && <MissionModal mission={mission} onSave={onSaveMission} onClose={() => setShowMissionModal(false)} />}
      {showRegimenEditor && <RegimenEditorModal regimen={regimen} editDay={editDay} setEditDay={setEditDay} onSave={(r) => { onUpdateRegimen(r); setShowRegimenEditor(false); }} onClose={() => setShowRegimenEditor(false)} />}
      {viewingChallenge && (
        <ChallengeDetailModal
          challenge={viewingChallenge.challenge}
          type={viewingChallenge.type}
          onClose={() => setViewingChallenge(null)}
          onUpdateTasks={onUpdateChallengeTasks}
        />
      )}
    </div>
  );
};

export default DashboardV2;