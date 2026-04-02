import React, { useState } from 'react';

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

const MomentumMeter = ({ momentum = 0 }) => {
  const v      = Math.round(momentum);
  const state  = getMomentumState(v);
  const isFlow = v >= 90;
  const filled = Math.round((v / 100) * MOMENTUM_SEGMENTS);

  const segments = Array.from({ length: MOMENTUM_SEGMENTS }, (_, i) => {
    const color   = getMomentumSegColor(i, filled, v);
    const isLast4 = i >= filled - 4 && i < filled;
    let anim = 'none';
    if (i < filled && isFlow) anim = 'mFlowPulse 1.8s ease-in-out infinite';
    else if (i < filled && state.vibrate && isLast4) anim = 'mVibrate .12s infinite';
    return (
      <div key={i} style={{ flex: 1, height: 5, borderRadius: 2, background: color, animation: anim }} />
    );
  });

  return (
    <>
      <style>{`
        @keyframes mVibrate{0%,100%{transform:translateY(0)}25%{transform:translateY(-1px)}75%{transform:translateY(1px)}}
        @keyframes mFlowPulse{0%,100%{opacity:1}50%{opacity:0.55}}
        @keyframes mShine{0%{transform:translateX(-80%)}50%{transform:translateX(80%)}100%{transform:translateX(-80%)}}
      `}</style>
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: isFlow
          ? 'linear-gradient(135deg,#2C3540 0%,#3E4E5E 25%,#5A6E80 50%,#3E4E5E 75%,#2C3540 100%)'
          : 'var(--bg-1)',
        border: `1px solid ${isFlow ? '#A0BDD0' : 'var(--border-0)'}`,
        borderRadius: 10, padding: '12px 16px',
        transition: 'background .8s ease, border-color .8s ease',
      }}>
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 32, lineHeight: 1, color: state.color, transition:'color .6s' }}>{v}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize: 9, letterSpacing:'.1em', textTransform:'uppercase', color: state.color, transition:'color .6s', textAlign:'right', maxWidth: 120 }}>{state.label}</div>
        </div>
        <div style={{ display:'flex', gap: 3, marginTop: 8 }}>{segments}</div>
      </div>
    </>
  );
};

// ============================================================
// MOBILE REGIMEN BLOCK
// ============================================================
const MobileRegimenBlock = ({ regimen, today, onEdit }) => {
  const [tappedDay, setTappedDay] = useState(null);

  const tappedTasks = tappedDay ? (regimen?.days?.[tappedDay] || []) : [];

  const handleTap = (day) => {
    const tasks = regimen?.days?.[day] || [];
    if (tasks.length === 0) return;
    setTappedDay(prev => prev === day ? null : day);
  };

  return (
    <>
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: 'var(--accent)' }}>WEEKLY REGIMEN</div>
          <button onClick={onEdit} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-2)',
            padding: '5px 12px', background: 'var(--bg-2)', border: '1px solid var(--border-1)',
            borderRadius: 6, cursor: 'pointer',
          }}>Edit</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {DAYS.map(day => {
            const count   = (regimen?.days?.[day] || []).length;
            const isToday = day === today;
            const isTapped = tappedDay === day;
            return (
              <div
                key={day}
                onClick={() => handleTap(day)}
                style={{
                  background: isToday ? 'var(--accent-lo)' : isTapped ? 'var(--bg-3)' : 'transparent',
                  borderRadius: 8, padding: '4px 0',
                  cursor: count > 0 ? 'pointer' : 'default',
                  border: isTapped ? '1px solid var(--border-1)' : '1px solid transparent',
                }}
              >
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, color: isToday ? 'var(--accent)' : 'var(--text-2)', marginBottom: 6 }}>
                  {day.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: isToday ? 'var(--accent)' : count > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>
                  {count > 0 ? count : '·'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline task list on tap */}
        {tappedDay && tappedTasks.length > 0 && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border-0)', paddingTop: 10 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '.12em', color: 'var(--accent)', marginBottom: 8 }}>
              {DAY_LABELS_FULL[tappedDay].toUpperCase()}
            </div>
            {tappedTasks.map((task, i) => (
              <div key={task.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 0',
                borderTop: i > 0 ? '1px solid var(--border-1)' : 'none',
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, flex: 1, color: 'var(--text-0)' }}>{task.label}</span>
                {task.nonNeg && <NonNegIcon size={10} color="var(--ok)" />}
              </div>
            ))}
          </div>
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
  const r = (size - 6) / 2;
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
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={getColor()} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.28, letterSpacing: '.02em',
      }}>{done}/{total}</div>
    </div>
  );
};

// ============================================================
// MOBILE TASK CARD
// ============================================================
const MobileTaskCard = ({ task, checked, onToggle, color = "var(--accent)" }) => (
  <div
    onClick={onToggle}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px',
      background: checked ? `${color}12` : 'var(--bg-2)',
      border: `1px solid ${checked ? `${color}40` : 'var(--border-1)'}`,
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'all .15s',
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: checked ? 'none' : '2px solid var(--text-2)',
      background: checked ? color : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, color: 'var(--bg-0)',
      transition: 'all .15s',
      flexShrink: 0,
    }}>{checked && '✓'}</div>
    <span style={{
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, flex: 1, fontWeight: 500,
      color: checked ? 'var(--text-2)' : 'var(--text-0)',
      textDecoration: checked ? 'line-through' : 'none',
    }}>{task.label}</span>
    {task.nonNeg && <NonNegIcon size={12} color="var(--ok)" />}
  </div>
);

// ============================================================
// TASK DRAWER (with Edit button)
// ============================================================
const TaskDrawer = ({ isOpen, onClose, title, tasks, color, checked, onToggle, done, total, onEdit }) => {
  if (!isOpen) return null;
  
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-1)', borderRadius: '20px 20px 0 0',
        maxHeight: '75vh', overflow: 'hidden',
        zIndex: 101, display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, background: 'var(--bg-3)', borderRadius: 2 }} />
        </div>
        
        {/* Header */}
        <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: color, letterSpacing: '.02em' }}>{title}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>{done}/{total} COMPLETE</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onEdit && (
              <button onClick={onEdit} style={{
                padding: '8px 14px', background: 'var(--bg-2)', border: '1px solid var(--border-1)',
                borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-2)', cursor: 'pointer',
              }}>Edit</button>
            )}
            <div onClick={onClose} style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border-1)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-2)',
            }}>×</div>
          </div>
        </div>

        {/* Tasks */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map(task => (
              <MobileTaskCard
                key={task.id || task.key}
                task={task}
                checked={checked[task.id || task.key]}
                onToggle={() => onToggle(task.id || task.key)}
                color={color}
              />
            ))}
            {tasks.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-2)' }}>
                No tasks
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// TASK EDITOR SHEET (for both regimen and challenges)
// ============================================================
const TaskEditorSheet = ({ isOpen, onClose, title, tasks, onSave, type, editDay, setEditDay, color = 'var(--accent)' }) => {
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const [newTaskLabel, setNewTaskLabel] = useState('');

  // Reset local tasks when sheet opens with new tasks
  React.useEffect(() => {
    setLocalTasks(tasks || []);
  }, [tasks, isOpen]);

  if (!isOpen) return null;

  const addTask = () => {
    if (!newTaskLabel.trim()) return;
    const idPrefix = type === 'regimen' ? 'reg' : 'kpi';
    const newTask = { 
      id: `${idPrefix}_${Date.now()}`, 
      key: `${idPrefix}_${Date.now()}`,
      label: newTaskLabel.trim(), 
      nonNeg: false 
    };
    setLocalTasks([...localTasks, newTask]);
    setNewTaskLabel('');
  };

  const removeTask = (taskId) => {
    setLocalTasks(localTasks.filter(t => (t.id || t.key) !== taskId));
  };

  const toggleNonNeg = (taskId) => {
    setLocalTasks(localTasks.map(t => (t.id || t.key) === taskId ? { ...t, nonNeg: !t.nonNeg } : t));
  };

  const handleSave = () => {
    onSave(localTasks, editDay);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-1)', borderRadius: '20px 20px 0 0',
        maxHeight: '85vh', overflow: 'hidden',
        zIndex: 201, display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, background: 'var(--bg-3)', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--border-0)' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.12em', color: 'var(--text-3)' }}>EDIT {title.toUpperCase()}</div>
        </div>

        {/* Day selector for regimen */}
        {type === 'regimen' && setEditDay && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-0)', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
              {DAYS.map(day => {
                const isActive = day === editDay;
                return (
                  <div key={day} onClick={() => setEditDay(day)} style={{
                    padding: '8px 12px', textAlign: 'center',
                    background: isActive ? 'var(--accent-lo)' : 'var(--bg-2)',
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-1)',
                    borderRadius: 8, cursor: 'pointer',
                  }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>{DAY_LABELS[day]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tasks */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {localTasks.map(task => (
              <div key={task.id || task.key} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', background: 'var(--bg-2)',
                border: '1px solid var(--border-1)', borderRadius: 10,
              }}>
                <span style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{task.label}</span>
                <div
                  onClick={() => toggleNonNeg(task.id || task.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 8px',
                    background: task.nonNeg ? 'var(--ok)15' : 'transparent',
                    border: `1px solid ${task.nonNeg ? 'var(--ok)' : 'var(--border-1)'}`,
                    borderRadius: 6, cursor: 'pointer',
                  }}
                >
                  <NonNegIcon size={10} color={task.nonNeg ? 'var(--ok)' : 'var(--text-3)'} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: task.nonNeg ? 'var(--ok)' : 'var(--text-3)' }}>NON-NEG</span>
                </div>
                <div onClick={() => removeTask(task.id || task.key)} style={{
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-3)', fontSize: 16,
                }}>×</div>
              </div>
            ))}
            {localTasks.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>
                No tasks
              </div>
            )}
          </div>

          {/* Add task */}
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
              padding: '12px 16px', background: color,
              border: 'none', borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              color: 'var(--bg-0)', cursor: 'pointer',
            }}>ADD</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-0)', display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 14, background: 'var(--bg-2)',
            border: '1px solid var(--border-1)', borderRadius: 10,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 15,
            color: 'var(--text-2)', cursor: 'pointer',
          }}>CANCEL</button>
          <button onClick={handleSave} style={{
            flex: 1, padding: 14, background: color,
            border: 'none', borderRadius: 10,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 15,
            color: 'var(--bg-0)', cursor: 'pointer',
          }}>SAVE</button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// TASK SECTION CARD
// ============================================================
const TaskSectionCard = ({ title, color, done, total, onClick }) => (
  <div onClick={onClick} style={{
    background: 'var(--bg-1)', border: '1px solid var(--border-0)',
    borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: color }}>{title}</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>{done}/{total} complete</div>
    </div>
    <CompletionRing done={done} total={total} size={40} />
  </div>
);

// ============================================================
// MAIN MOBILE DASHBOARD
// ============================================================
const DashboardMobile = ({
  challenge, challenges, kpis, toggle, userName, onLogDay, loggedToday,
  regimen, onUpdateRegimen, regimenChecked, toggleRegimen,
  tempChecked, toggleTemp, dayType, onSetDayType,
  secondaryKpis, toggleSecondary, talosInsight, onRefreshTalos,
  mission, onSaveMission, onUpdateChallengeTasks, momentum = 0,
}) => {
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [showEditor, setShowEditor] = useState(null);
  const [editDay, setEditDay] = useState(getTodayName());
  const [editorTasks, setEditorTasks] = useState([]);
  const [editorConfig, setEditorConfig] = useState({ title: '', type: '', color: '', challengeId: null });

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

  const openRegimenEditor = () => {
    setEditorTasks(regimen?.days?.[editDay] || []);
    setEditorConfig({ title: 'Regimen', type: 'regimen', color: 'var(--ok)', challengeId: null });
    setActiveDrawer(null);
    setShowEditor('regimen');
  };

  const openChallengeEditor = (c, type) => {
    setEditorTasks(c?.kpis || []);
    setEditorConfig({ 
      title: c?.name || 'Challenge', 
      type: 'challenge', 
      color: type === 'secondary' ? '#7F77DD' : 'var(--accent)',
      challengeId: c?.id 
    });
    setActiveDrawer(null);
    setShowEditor('challenge');
  };

  const handleEditorSave = (tasks, day) => {
    if (editorConfig.type === 'regimen') {
      const newRegimen = {
        ...regimen,
        days: { ...regimen?.days, [day]: tasks },
      };
      onUpdateRegimen(newRegimen);
    } else if (editorConfig.type === 'challenge' && onUpdateChallengeTasks) {
      onUpdateChallengeTasks(editorConfig.challengeId, tasks);
    }
    setShowEditor(null);
  };

  // Update editor tasks when editDay changes for regimen
  React.useEffect(() => {
    if (showEditor === 'regimen') {
      setEditorTasks(regimen?.days?.[editDay] || []);
    }
  }, [editDay, regimen, showEditor]);

  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.2em', color: 'var(--text-warm)', marginBottom: 6 }}>
          FORGE · {fmtDate().toUpperCase()}
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, lineHeight: 1 }}>
          GOOD {getTimeOfDay().toUpperCase()}, <span style={{ color: 'var(--accent)' }}>{userName.toUpperCase()}.</span>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <MomentumMeter momentum={momentum} />
        <MobileRegimenBlock
          regimen={regimen}
          today={today}
          onEdit={() => setShowEditor('regimen')}
        />
      </div>

      {/* TALOS */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: 'var(--ok)' }}>TALOS</div>
          <div onClick={onRefreshTalos} style={{
            padding: '4px 10px', background: 'var(--bg-2)', border: '1px solid var(--border-1)',
            borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-2)',
          }}>↻</div>
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontStyle: 'italic', color: 'var(--text-warm)', lineHeight: 1.5 }}>
          "{talosInsight || 'Focus on process, not outcome.'}"
        </div>
      </div>

      {/* DAY TYPE TOGGLE */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', padding: 4, borderRadius: 10 }}>
          {[{ id: 'full', label: 'FULL DAY', icon: '●' }, { id: 'scaled', label: 'SCALED', icon: '◐' }].map(type => {
            const isActive = (dayType || 'full') === type.id;
            return (
              <button key={type.id} onClick={() => onSetDayType && onSetDayType(type.id)} style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 8,
                background: isActive ? 'var(--bg-0)' : 'transparent',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
                color: isActive ? 'var(--text-0)' : 'var(--text-2)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 8, opacity: isActive ? 1 : 0.6 }}>{type.icon}</span> {type.label}
              </button>
            );
          })}
        </div>
        {isScaled && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-2)', marginTop: 8, textAlign: 'center' }}>
            Complete non-negotiables to keep streak. Max 2 scaled days/week.
          </div>
        )}
      </div>

      {/* PROGRESS SUMMARY */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 12, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, lineHeight: 1 }}>{pct(totalDone, totalTasks)}%</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{totalTasks - totalDone} tasks left today</div>
        </div>
        <CompletionRing done={totalDone} total={totalTasks} size={56} />
      </div>

      {/* TASK SECTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {regimenTotal > 0 && (
          <TaskSectionCard
            title={`REGIMEN · ${DAY_LABELS[today].toUpperCase()}`}
            color="var(--ok)"
            done={regimenDone}
            total={regimenTotal}
            onClick={() => setActiveDrawer('regimen')}
          />
        )}
        {challengeKpis.length > 0 && (
          <TaskSectionCard
            title={challenge.name.toUpperCase()}
            color="var(--accent)"
            done={challengeDone}
            total={challengeKpis.length}
            onClick={() => setActiveDrawer('challenge')}
          />
        )}
        {secondary.length > 0 && secondary[0] && (
          <TaskSectionCard
            title={secondary[0].name.toUpperCase()}
            color="#7F77DD"
            done={secondaryDone}
            total={secondaryTaskList.length}
            onClick={() => setActiveDrawer('secondary')}
          />
        )}
        {regimenTotal === 0 && challengeKpis.length === 0 && (
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, marginBottom: 6 }}>No tasks today</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-2)' }}>Set up your regimen or start a challenge</div>
          </div>
        )}
      </div>

      {/* LOG DAY BUTTON */}
      <button
        onClick={() => onLogDay && onLogDay(totalDone, totalTasks)}
        disabled={loggedToday}
        style={{
          width: '100%', padding: 16,
          background: loggedToday ? 'var(--bg-2)' : 'var(--accent)',
          border: 'none', borderRadius: 12,
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: '.1em',
          color: loggedToday ? 'var(--text-2)' : 'var(--bg-0)',
          cursor: loggedToday ? 'default' : 'pointer',
        }}
      >
        {loggedToday ? '✓ DAY LOGGED' : 'LOG DAY →'}
      </button>

      {/* TASK DRAWERS */}
      <TaskDrawer
        isOpen={activeDrawer === 'regimen'}
        onClose={() => setActiveDrawer(null)}
        title={`REGIMEN · ${DAY_LABELS[today].toUpperCase()}`}
        tasks={[...todayTasks, ...todayTemp]}
        color="var(--ok)"
        checked={regimenCheckedCombined}
        onToggle={toggleRegimenCombined}
        done={regimenDone}
        total={regimenTotal}
        onEdit={openRegimenEditor}
      />

      <TaskDrawer
        isOpen={activeDrawer === 'challenge'}
        onClose={() => setActiveDrawer(null)}
        title={challenge?.name?.toUpperCase() || 'CHALLENGE'}
        tasks={challengeKpis.map(k => ({ id: k.key, key: k.key, label: k.label, nonNeg: k.nonNeg }))}
        color="var(--accent)"
        checked={kpis}
        onToggle={toggle}
        done={challengeDone}
        total={challengeKpis.length}
        onEdit={() => openChallengeEditor(challenge, 'main')}
      />

      <TaskDrawer
        isOpen={activeDrawer === 'secondary'}
        onClose={() => setActiveDrawer(null)}
        title={secondary[0]?.name?.toUpperCase() || 'SECONDARY'}
        tasks={secondaryTaskList.map(k => ({ id: k.key, key: k.key, label: k.label, nonNeg: k.nonNeg }))}
        color="#7F77DD"
        checked={secondaryCheckedState}
        onToggle={(key) => toggleSecondary && toggleSecondary(secondary[0].id, key)}
        done={secondaryDone}
        total={secondaryTaskList.length}
        onEdit={() => openChallengeEditor(secondary[0], 'secondary')}
      />

      {/* UNIFIED TASK EDITOR */}
      <TaskEditorSheet
        isOpen={showEditor !== null}
        onClose={() => setShowEditor(null)}
        title={editorConfig.title}
        tasks={editorTasks}
        onSave={handleEditorSave}
        type={editorConfig.type}
        editDay={editDay}
        setEditDay={editorConfig.type === 'regimen' ? setEditDay : null}
        color={editorConfig.color}
      />
    </div>
  );
};

export default DashboardMobile;