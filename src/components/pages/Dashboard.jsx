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

const fmtDate = (d = new Date()) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Task row with one-tap toggle
const TaskRow = ({ task, checked, onToggle, color = "var(--accent)", showNonNeg = true }) => (
  <div
    onClick={onToggle}
    className="task-row-unified"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: checked ? `${color}12` : 'var(--bg-2)',
      border: `1px solid ${checked ? `${color}50` : 'var(--border-1)'}`,
      borderRadius: 8,
      cursor: 'pointer',
      transition: 'all .15s',
    }}
  >
    <div style={{
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: `2px solid ${checked ? color : 'var(--text-2)'}`,
      background: checked ? color : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      color: 'var(--bg-0)',
      flexShrink: 0,
      transition: 'all .15s',
    }}>
      {checked && '✓'}
    </div>
    <div style={{ 
      flex: 1, 
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 12,
      color: checked ? 'var(--text-2)' : 'var(--text-0)',
      textDecoration: checked ? 'line-through' : 'none',
      transition: 'all .15s',
    }}>
      {task.label}
    </div>
    {showNonNeg && task.nonNeg && (
      <div style={{ fontSize: 10, color: 'var(--warn)' }}>◆</div>
    )}
  </div>
);

// Stat card - matches original .stat styling
const StatCard = ({ label, value, color }) => (
  <div style={{
    background: 'var(--bg-1)',
    border: '1px solid var(--border-0)',
    borderRadius: 10,
    padding: '18px 20px',
  }}>
    <div style={{ 
      fontFamily: "'Bebas Neue', sans-serif", 
      fontSize: 52,
      lineHeight: 1,
      letterSpacing: '.02em',
      color: color || 'var(--text-0)',
    }}>
      {value}
    </div>
    <div style={{ 
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 12, 
      color: 'var(--text-1)', 
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      marginTop: 3,
    }}>
      {label}
    </div>
  </div>
);

// Completion ring SVG - color changes based on progress
const CompletionRing = ({ done, total, size = 64 }) => {
  const pctVal = total > 0 ? (done / total) * 100 : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pctVal / 100) * circ;
  
  // Color based on percentage
  const getColor = () => {
    if (pctVal === 0) return 'var(--text-3)';
    if (pctVal < 50) return 'var(--accent)';
    if (pctVal < 100) return 'var(--warn)';
    return 'var(--ok)';
  };
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-3)"
          strokeWidth="4"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={getColor()}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ 
            transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
          }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: size * 0.3,
        letterSpacing: '.02em',
        color: 'var(--text-0)',
      }}>
        {done}/{total}
      </div>
    </div>
  );
};

// Task summary bar (ring + stats)
const TaskSummary = ({ done, total, remaining }) => {
  const pctVal = total > 0 ? Math.round((done / total) * 100) : 0;
  
  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--border-0)',
      borderRadius: 10,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
    }}>
      <CompletionRing done={done} total={total} size={64} />
      <div>
        <div style={{ 
          fontFamily: "'Bebas Neue', sans-serif", 
          fontSize: 36,
          lineHeight: 1,
          letterSpacing: '.02em',
        }}>
          {pctVal}%
        </div>
        <div style={{ 
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11, 
          color: 'var(--text-2)', 
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          marginTop: 2,
        }}>
          {remaining} TASKS REMAINING
        </div>
        <div style={{ 
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10, 
          color: 'var(--text-3)', 
          letterSpacing: '.1em',
          marginTop: 2,
        }}>
          Other {done}/{total}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TODAY TAB
// ============================================================
const TodayTab = ({ 
  challenge, 
  challenges,
  kpis, 
  toggle, 
  regimen,
  regimenChecked,
  toggleRegimen,
  tempChecked,
  toggleTemp,
  userName,
  onLogDay,
  loggedToday,
  dayType,
  onSetDayType,
}) => {
  const today = getTodayName();
  const todayTasks = regimen?.days?.[today] || [];
  const todayTemp = (regimen?.temp_items || []).filter(t => t.days.includes(today));
  const hasRegimen = todayTasks.length > 0 || todayTemp.length > 0;
  
  const challengeKpis = challenge?.kpis || [];
  const hasChallenge = challengeKpis.length > 0;
  
  const regimenDone = todayTasks.filter(t => regimenChecked[t.id]).length;
  const tempDone = todayTemp.filter(t => tempChecked[t.id]).length;
  const challengeDone = challengeKpis.filter(k => kpis[k.key]).length;
  
  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '.2em',
          color: 'var(--accent)',
          marginBottom: 6,
        }}>
          {fmtDate()}
        </div>
        <div style={{ 
          fontFamily: "'Bebas Neue', sans-serif", 
          fontSize: 48, 
          letterSpacing: '.04em',
          lineHeight: 1,
        }}>
          Good {timeOfDay}, <span style={{ color: 'var(--accent)' }}>{userName}</span>.
        </div>
      </div>

      {/* TODAY'S TASKS Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          letterSpacing: '.18em',
          color: 'var(--text-1)',
          marginBottom: 16,
          textTransform: 'uppercase',
        }}>
          Today's Tasks
        </div>

        {/* Two column layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: hasRegimen && hasChallenge ? '1fr 1fr' : '1fr', 
          gap: 16, 
          marginBottom: 16,
        }}>
          {/* Regimen Section */}
          {hasRegimen && (
            <div style={{ 
              background: 'var(--ok)08', 
              border: '1px solid var(--ok)30', 
              borderRadius: 12, 
              padding: 16,
            }}>
              <div style={{ 
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11, 
                letterSpacing: '.2em', 
                color: 'var(--ok)', 
                marginBottom: 12,
                textTransform: 'uppercase',
              }}>
                Weekly Regimen · {DAY_LABELS_FULL[today]}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    checked={regimenChecked[task.id]}
                    onToggle={() => toggleRegimen(task.id)}
                    color="var(--ok)"
                  />
                ))}
                {todayTemp.map(task => (
                  <TaskRow
                    key={task.id}
                    task={{ ...task, label: `${task.label} (temp)` }}
                    checked={tempChecked[task.id]}
                    onToggle={() => toggleTemp(task.id)}
                    color="var(--warn)"
                    showNonNeg={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Challenge Section */}
          {hasChallenge && (
            <div style={{ 
              background: 'var(--accent)08', 
              border: '1px solid var(--accent)30', 
              borderRadius: 12, 
              padding: 16,
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <div style={{ 
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11, 
                  letterSpacing: '.2em', 
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                }}>
                  {challenge.name}
                </div>
                <div style={{ 
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12, 
                  color: 'var(--text-2)',
                }}>
                  Day {challenge.dayNum}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {challengeKpis.map(kpi => (
                  <TaskRow
                    key={kpi.key}
                    task={{ id: kpi.key, label: kpi.label, nonNeg: kpi.nonNeg }}
                    checked={kpis[kpi.key]}
                    onToggle={() => toggle(kpi.key)}
                    color="var(--accent)"
                  />
                ))}
              </div>
            </div>
          )}

          {/* No tasks state */}
          {!hasRegimen && !hasChallenge && (
            <div style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border-1)',
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
            }}>
              <div style={{ 
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 24,
                marginBottom: 8,
              }}>
                Nothing scheduled today
              </div>
              <div style={{ 
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: 'var(--text-2)',
              }}>
                Set up a regimen or start a challenge
              </div>
            </div>
          )}
        </div>

        {/* Task Summary with ring */}
        {(hasRegimen || hasChallenge) && (
          <TaskSummary 
            done={regimenDone + tempDone + challengeDone}
            total={todayTasks.length + todayTemp.length + challengeKpis.length}
            remaining={(todayTasks.length + todayTemp.length + challengeKpis.length) - (regimenDone + tempDone + challengeDone)}
          />
        )}

        {/* Day Type Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-1)',
          border: '1px solid var(--border-0)',
          borderRadius: 10,
          padding: '12px 16px',
          marginTop: 12,
        }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '.15em',
            color: 'var(--text-2)',
            textTransform: 'uppercase',
          }}>
            Today:
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'full', label: 'Full Day', icon: '●' },
              { id: 'scaled', label: 'Scaled', icon: '◐' },
              { id: 'recovery', label: 'Recovery', icon: '◇' },
            ].map(type => {
              const isActive = (dayType || 'full') === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => onSetDayType && onSetDayType(type.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-1)',
                    borderRadius: 6,
                    background: isActive ? 'var(--accent)10' : 'var(--bg-2)',
                    color: isActive ? 'var(--accent)' : 'var(--text-2)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 10 }}>{type.icon}</span>
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 12, 
        marginBottom: 24,
      }}>
        {hasRegimen && (
          <StatCard 
            label="Regimen" 
            value={`${regimenDone + tempDone}/${todayTasks.length + todayTemp.length}`} 
          />
        )}
        {hasChallenge && (
          <>
            <StatCard 
              label="Challenge" 
              value={`${challengeDone}/${challengeKpis.length}`} 
            />
            <StatCard 
              label="Streak" 
              value={`${challenge.streak} 🔥`} 
              color="var(--warn)" 
            />
            <StatCard 
              label="Consistency" 
              value={`${challenge.consistency}%`} 
            />
          </>
        )}
      </div>

      {/* Log Day Button */}
      <button
        onClick={onLogDay}
        disabled={loggedToday}
        style={{
          width: '100%',
          padding: '16px 24px',
          background: loggedToday ? 'var(--ok)' : 'var(--accent)',
          border: 'none',
          borderRadius: 10,
          color: 'var(--bg-0)',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 18,
          letterSpacing: '.1em',
          cursor: loggedToday ? 'default' : 'pointer',
          transition: 'all .2s',
          boxShadow: loggedToday ? 'none' : '0 4px 0 rgba(0,0,0,.4)',
        }}
      >
        {loggedToday ? '✓ Day Logged' : 'Log Day →'}
      </button>
    </div>
  );
};

// ============================================================
// REGIMEN TAB - BENTO LAYOUT
// ============================================================
const RegimenTab = ({ regimen, onUpdateRegimen, regimenChecked, toggleRegimen }) => {
  const today = getTodayName();
  const [showEditor, setShowEditor] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [hoveredDay, setHoveredDay] = useState(null);
  
  // Temp item state
  const [showAddTemp, setShowAddTemp] = useState(false);
  const [tempLabel, setTempLabel] = useState('');
  const [tempDays, setTempDays] = useState([]);
  const [tempExpires, setTempExpires] = useState('');

  const todayTasks = regimen?.days?.[today] || [];
  
  // Calculate week completion (placeholder - wire to actual data)
  const weekStats = { completed: 4, total: 5 };

  const addTask = () => {
    if (!newTaskLabel.trim() || !editingDay) return;
    const newTask = { id: `t_${Date.now()}`, label: newTaskLabel.trim(), nonNeg: false };
    const updated = {
      ...regimen,
      days: { ...regimen.days, [editingDay]: [...(regimen.days[editingDay] || []), newTask] },
    };
    onUpdateRegimen(updated);
    setNewTaskLabel('');
  };

  const removeTask = (day, taskId) => {
    const updated = {
      ...regimen,
      days: { ...regimen.days, [day]: regimen.days[day].filter(t => t.id !== taskId) },
    };
    onUpdateRegimen(updated);
  };

  const toggleNonNeg = (day, taskId) => {
    const updated = {
      ...regimen,
      days: { ...regimen.days, [day]: regimen.days[day].map(t => t.id === taskId ? { ...t, nonNeg: !t.nonNeg } : t) },
    };
    onUpdateRegimen(updated);
  };

  const addTempItem = () => {
    if (!tempLabel.trim() || tempDays.length === 0) return;
    const newTemp = { id: `tmp_${Date.now()}`, label: tempLabel.trim(), days: tempDays, expires: tempExpires || null };
    const updated = { ...regimen, temp_items: [...(regimen.temp_items || []), newTemp] };
    onUpdateRegimen(updated);
    setTempLabel(''); setTempDays([]); setTempExpires(''); setShowAddTemp(false);
  };

  const removeTempItem = (id) => {
    const updated = { ...regimen, temp_items: regimen.temp_items.filter(t => t.id !== id) };
    onUpdateRegimen(updated);
  };

  const getDayStatus = (day) => {
    const tasks = regimen?.days?.[day] || [];
    if (tasks.length === 0) return 'rest';
    if (day === today) return 'today';
    const dayIndex = DAYS.indexOf(day);
    const todayIndex = DAYS.indexOf(today);
    if (dayIndex < todayIndex) return 'done';
    return 'future';
  };

  return (
    <div>
      {/* Schedule Editor Modal */}
      {showEditor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => { setShowEditor(false); setEditingDay(null); }}>
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 14,
            padding: 24, width: '90%', maxWidth: 500, maxHeight: '80vh', overflow: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, marginBottom: 20 }}>Edit Schedule</div>

            {/* Day selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {DAYS.map(day => (
                <button key={day} onClick={() => setEditingDay(day)} style={{
                  padding: '10px 14px', border: editingDay === day ? '1px solid var(--ok)' : '1px solid var(--border-1)',
                  borderRadius: 8, background: editingDay === day ? 'var(--ok)15' : 'var(--bg-2)',
                  color: editingDay === day ? 'var(--ok)' : 'var(--text-1)',
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, cursor: 'pointer',
                }}>{DAY_LABELS[day]}</button>
              ))}
            </div>

            {/* Tasks for selected day */}
            {editingDay && (
              <>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-2)', letterSpacing: '.1em', marginBottom: 12 }}>
                  {DAY_LABELS_FULL[editingDay].toUpperCase()} TASKS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {(regimen?.days?.[editingDay] || []).map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}>
                      <div onClick={() => toggleNonNeg(editingDay, task.id)} style={{ cursor: 'pointer', fontSize: 14, color: task.nonNeg ? 'var(--ok)' : 'var(--text-3)' }}>{task.nonNeg ? '◆' : '○'}</div>
                      <div style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{task.label}</div>
                      <div onClick={() => removeTask(editingDay, task.id)} style={{ cursor: 'pointer', color: 'var(--err)', fontSize: 16, padding: '0 4px' }}>×</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input type="text" value={newTaskLabel} onChange={(e) => setNewTaskLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="New task..."
                    style={{ flex: 1, padding: '12px 14px', fontSize: 13, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8, color: 'var(--text-0)', outline: 'none' }} />
                  <button onClick={addTask} style={{ padding: '12px 20px', fontSize: 13, background: 'var(--ok)', border: 'none', borderRadius: 8, color: 'var(--bg-0)', cursor: 'pointer' }}>Add</button>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-2)', marginBottom: 16 }}>◆ = Non-negotiable · ○ = Optional</div>
              </>
            )}
            <button onClick={() => { setShowEditor(false); setEditingDay(null); }} style={{
              width: '100%', padding: '14px', fontSize: 14, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '.08em',
              background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8, color: 'var(--text-1)', cursor: 'pointer',
            }}>Done</button>
          </div>
        </div>
      )}

      {/* Bento Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Today Hero */}
        <div style={{ background: 'var(--ok)10', border: '1px solid var(--ok)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.2em', color: 'var(--ok)', marginBottom: 6 }}>TODAY</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: '.02em', marginBottom: 20 }}>{DAY_LABELS_FULL[today].toUpperCase()}</div>

          {todayTasks.length === 0 ? (
            <div style={{ padding: 24, background: 'var(--bg-2)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--text-2)' }}>No tasks scheduled</div>
              <div onClick={() => { setShowEditor(true); setEditingDay(today); }} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--ok)', marginTop: 8, cursor: 'pointer' }}>+ Add tasks</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayTasks.map(task => {
                const checked = regimenChecked?.[task.id];
                return (
                  <div key={task.id} onClick={() => toggleRegimen && toggleRegimen(task.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-1)',
                    border: checked ? '1px solid var(--ok)50' : '1px solid var(--border-1)', borderRadius: 8, cursor: 'pointer',
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: checked ? 'var(--ok)' : 'transparent',
                      border: checked ? 'none' : '2px solid var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--bg-0)' }}>{checked && '✓'}</div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: checked ? 'var(--text-2)' : 'var(--text-0)', textDecoration: checked ? 'line-through' : 'none', flex: 1 }}>{task.label}</span>
                    {task.nonNeg && <span style={{ fontSize: 11, color: 'var(--ok)' }}>◆</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Week dots */}
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 10, padding: 16, position: 'relative' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.15em', color: 'var(--text-2)', marginBottom: 12 }}>THIS WEEK</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
              {DAYS.map(day => {
                const status = getDayStatus(day);
                const tasks = regimen?.days?.[day] || [];
                return (
                  <div key={day} style={{ textAlign: 'center', flex: 1, position: 'relative', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredDay(day)} onMouseLeave={() => setHoveredDay(null)}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: status === 'today' ? 'var(--ok)' : 'var(--text-3)', marginBottom: 6 }}>{DAY_LABELS[day].charAt(0)}</div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', margin: '0 auto',
                      background: status === 'rest' ? 'var(--bg-3)' : status === 'done' ? 'var(--ok)' : status === 'today' ? 'transparent' : 'var(--ok)50',
                      border: status === 'today' ? '2px solid var(--ok)' : 'none' }} />
                    {/* Hover preview */}
                    {hoveredDay === day && (
                      <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                        background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 8, padding: '12px 14px',
                        minWidth: 140, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 500, color: 'var(--text-0)', marginBottom: tasks.length ? 8 : 0 }}>{DAY_LABELS_FULL[day]}</div>
                        {tasks.length > 0 ? tasks.map(t => (
                          <div key={t.id} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: t.nonNeg ? 'var(--ok)' : 'var(--text-2)', marginBottom: 4 }}>{t.nonNeg ? '◆ ' : ''}{t.label}</div>
                        )) : <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>Rest day</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 10, padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.15em', color: 'var(--text-2)' }}>THIS WEEK</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: 'var(--ok)' }}>{weekStats.completed}/{weekStats.total}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.15em', color: 'var(--text-2)' }}>STREAK</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: 'var(--warn)' }}>12</div>
            </div>
          </div>

          {/* Edit button */}
          <div onClick={() => setShowEditor(true)} style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 10, padding: 14, textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-2)' }}>Tap to edit schedule</div>
          </div>
        </div>
      </div>

      {/* Temp Items */}
      <div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '.04em', marginBottom: 14 }}>Temporary Items</div>
        {(regimen?.temp_items || []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {regimen.temp_items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 10, padding: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{item.days.map(d => DAY_LABELS[d]).join(', ')}{item.expires && ` · Expires ${item.expires}`}</div>
                </div>
                <div onClick={() => removeTempItem(item.id)} style={{ cursor: 'pointer', color: 'var(--err)', fontSize: 16, padding: '4px 8px' }}>×</div>
              </div>
            ))}
          </div>
        )}
        {showAddTemp ? (
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-0)', borderRadius: 10, padding: 16 }}>
            <input type="text" value={tempLabel} onChange={(e) => setTempLabel(e.target.value)} placeholder="Task name"
              style={{ width: '100%', padding: '10px 12px', fontSize: 12, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 6, color: 'var(--text-0)', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-2)', letterSpacing: '.1em', marginBottom: 8 }}>DAYS</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAYS.map(day => (
                  <button key={day} onClick={() => setTempDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                    style={{ padding: '6px 10px', fontSize: 11, background: tempDays.includes(day) ? 'var(--warn)20' : 'var(--bg-2)', border: `1px solid ${tempDays.includes(day) ? 'var(--warn)' : 'var(--border-1)'}`, borderRadius: 6, color: tempDays.includes(day) ? 'var(--warn)' : 'var(--text-2)', cursor: 'pointer' }}>{DAY_LABELS[day]}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-2)', letterSpacing: '.1em', marginBottom: 8 }}>EXPIRES (OPTIONAL)</div>
              <input type="date" value={tempExpires} onChange={(e) => setTempExpires(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 12, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 6, color: 'var(--text-0)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={addTempItem} style={{ flex: 1, padding: '12px', fontSize: 13, background: 'var(--warn)', border: 'none', borderRadius: 6, color: 'var(--bg-0)', cursor: 'pointer' }}>Add Item</button>
              <button onClick={() => { setShowAddTemp(false); setTempLabel(''); setTempDays([]); setTempExpires(''); }}
                style={{ padding: '12px 20px', fontSize: 13, background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 6, color: 'var(--text-2)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddTemp(true)} style={{ width: '100%', padding: '14px', fontSize: 11, background: 'transparent', border: '1px dashed var(--border-1)', borderRadius: 10, color: 'var(--text-2)', cursor: 'pointer' }}>+ Add temporary item</button>
        )}
      </div>
    </div>
  );
};


// ============================================================
// CHALLENGES TAB
// ============================================================
const ChallengesTab = ({ 
  challenge, 
  challenges, 
  checkins,
  onAddSecondary,
  onViewChallenge,
  onStartChallenge,
  onUpdateChallengeTasks,
}) => {
  const hasMain = !!challenges?.main;
  const secondary = challenges?.secondary || [];
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editTasks, setEditTasks] = useState([]);
  const [newTaskLabel, setNewTaskLabel] = useState('');

  const openEditor = () => {
    setEditTasks((challenge?.kpis || []).map(k => ({ ...k })));
    setShowTaskEditor(true);
  };

  const toggleNonNeg = (key) => {
    setEditTasks(prev => prev.map(t => 
      t.key === key ? { ...t, nonNeg: !t.nonNeg } : t
    ));
  };

  const removeTask = (key) => {
    setEditTasks(prev => prev.filter(t => t.key !== key));
  };

  const addTask = () => {
    if (!newTaskLabel.trim()) return;
    const newTask = {
      key: `task_${Date.now()}`,
      label: newTaskLabel.trim(),
      nonNeg: false,
      cat: 'other',
    };
    setEditTasks(prev => [...prev, newTask]);
    setNewTaskLabel('');
  };

  const saveChanges = () => {
    if (onUpdateChallengeTasks) {
      onUpdateChallengeTasks(editTasks);
    }
    setShowTaskEditor(false);
  };

  return (
    <div>
      {/* Task Editor Modal */}
      {showTaskEditor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowTaskEditor(false)}>
          <div style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--border-0)',
            borderRadius: 14,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            maxHeight: '80vh',
            overflow: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ 
              fontFamily: "'Bebas Neue', sans-serif", 
              fontSize: 28,
              marginBottom: 20,
            }}>
              Edit Tasks
            </div>

            {/* Task list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {editTasks.map(task => (
                <div 
                  key={task.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border-1)',
                    borderRadius: 8,
                  }}
                >
                  <div 
                    onClick={() => toggleNonNeg(task.key)}
                    style={{ 
                      cursor: 'pointer',
                      fontSize: 14,
                      color: task.nonNeg ? 'var(--ok)' : 'var(--text-3)',
                    }}
                  >
                    {task.nonNeg ? '◆' : '○'}
                  </div>
                  <div style={{ 
                    flex: 1,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13,
                  }}>
                    {task.label}
                  </div>
                  <div 
                    onClick={() => removeTask(task.key)}
                    style={{ 
                      cursor: 'pointer',
                      color: 'var(--err)',
                      fontSize: 16,
                      padding: '0 4px',
                    }}
                  >
                    ×
                  </div>
                </div>
              ))}
            </div>

            {/* Add new task */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input
                type="text"
                value={newTaskLabel}
                onChange={(e) => setNewTaskLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="New task..."
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  fontSize: 13,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border-1)',
                  borderRadius: 8,
                  color: 'var(--text-0)',
                  outline: 'none',
                }}
              />
              <button
                onClick={addTask}
                style={{
                  padding: '12px 20px',
                  fontSize: 13,
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'var(--bg-0)',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>

            {/* Legend */}
            <div style={{ 
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: 'var(--text-2)',
              marginBottom: 20,
            }}>
              ◆ = Non-negotiable (must complete) · ○ = Optional
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveChanges}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: 14,
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '.08em',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'var(--bg-0)',
                  cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowTaskEditor(false)}
                style={{
                  padding: '14px 24px',
                  fontSize: 14,
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '.08em',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border-1)',
                  borderRadius: 8,
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Challenge */}
      {hasMain ? (
        <div 
          onClick={openEditor}
          style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--accent)',
            borderRadius: 12,
            padding: '20px 24px 24px',
            marginBottom: 24,
            position: 'relative',
            cursor: 'pointer',
          }}>
          {/* Top right link */}
          <div style={{
            position: 'absolute',
            top: 16,
            right: 20,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '.1em',
            color: 'var(--text-2)',
            cursor: 'pointer',
          }}>
            TAP TO EDIT ↗
          </div>

          {/* Tag */}
          <div style={{ 
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12, 
            letterSpacing: '.18em', 
            color: 'var(--accent)', 
            marginBottom: 10,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ color: 'var(--accent)' }}>★</span> MAIN CHALLENGE
          </div>

          {/* Challenge Name */}
          <div style={{ 
            fontFamily: "'Bebas Neue', sans-serif", 
            fontSize: 44, 
            letterSpacing: '.02em',
            lineHeight: 1,
            marginBottom: 10,
          }}>
            {challenge.name.toUpperCase()}
          </div>

          {/* Meta line */}
          <div style={{ 
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            letterSpacing: '.1em',
            color: 'var(--text-2)',
            marginBottom: 24,
            textTransform: 'uppercase',
          }}>
            DAY {challenge.dayNum} OF {challenge.totalDays} · {challenge.totalDays - challenge.dayNum} DAYS REMAINING · STARTED {challenge.startDate || 'MAR 27'}
          </div>

          {/* Percentage complete */}
          <div style={{ 
            fontFamily: "'Bebas Neue', sans-serif", 
            fontSize: 48, 
            letterSpacing: '.02em',
            lineHeight: 1,
            color: 'var(--accent)',
          }}>
            {pct(challenge.dayNum, challenge.totalDays)}%
          </div>
          <div style={{ 
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '.16em',
            color: 'var(--text-2)',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            COMPLETE
          </div>

          {/* Progress bar with labels */}
          <div style={{ 
            borderTop: '1px solid var(--border-1)',
            paddingTop: 16,
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '.1em',
              color: 'var(--text-2)',
              marginBottom: 8,
            }}>
              <span>DAY 1</span>
              <span>{pct(challenge.dayNum, challenge.totalDays)}%</span>
              <span>DAY {challenge.totalDays}</span>
            </div>
            <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
              <div style={{ 
                width: `${pct(challenge.dayNum, challenge.totalDays)}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 2,
                transition: 'width .3s',
              }} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border-1)',
          borderRadius: 14,
          padding: 32,
          marginBottom: 24,
          textAlign: 'center',
        }}>
          <div style={{ 
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 24,
            marginBottom: 8,
          }}>
            No Active Challenge
          </div>
          <div style={{ 
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: 'var(--text-2)',
            marginBottom: 16,
          }}>
            Start a challenge to track streaks and build consistency
          </div>
          <button
            onClick={onStartChallenge}
            style={{
              padding: '12px 24px',
              fontSize: 14,
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: 'var(--bg-0)',
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '.08em',
              cursor: 'pointer',
            }}
          >
            Browse Challenges →
          </button>
        </div>
      )}

      {/* Wall Preview */}
      {hasMain && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            fontFamily: "'Bebas Neue', sans-serif", 
            fontSize: 26, 
            letterSpacing: '.04em',
            marginBottom: 12,
          }}>
            The Wall
          </div>
          <div style={{ 
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: 'var(--text-2)',
            marginBottom: 12,
          }}>
            View full Wall in the Wall tab →
          </div>
          {/* Mini wall preview would go here */}
          <div style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border-1)',
            borderRadius: 10,
            padding: 16,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-2)',
            fontSize: 13,
          }}>
            Wall preview
          </div>
        </div>
      )}

      {/* Secondary Challenges */}
      <div>
        <div style={{ 
          fontFamily: "'Bebas Neue', sans-serif", 
          fontSize: 26, 
          letterSpacing: '.04em',
          marginBottom: 12,
        }}>
          Secondary Challenges
        </div>
        
        {secondary.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {secondary.map(c => (
              <div 
                key={c.id}
                onClick={() => onViewChallenge && onViewChallenge(c, 'secondary')}
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border-1)',
                  borderRadius: 10,
                  padding: 16,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ 
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 14, 
                    color: 'var(--text-1)',
                  }}>
                    {c.name}
                  </div>
                  <div style={{ 
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10, 
                    color: 'var(--text-2)',
                  }}>
                    Day {c.dayNum} of {c.totalDays}
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
                  <div style={{ 
                    width: `${pct(c.dayNum, c.totalDays)}%`, 
                    height: '100%', 
                    background: c.color || 'var(--accent)',
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onAddSecondary}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 11,
            background: 'transparent',
            border: '1px dashed var(--border-1)',
            borderRadius: 10,
            color: 'var(--text-2)',
            cursor: 'pointer',
          }}
        >
          + Start secondary challenge
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
const Dashboard = ({
  // Challenge props (existing)
  challenge,
  challenges,
  kpis,
  toggle,
  checkins,
  userName,
  onLogDay,
  loggedToday,
  onAddSecondary,
  onViewChallenge,
  onStartChallenge,
  onUpdateChallengeTasks,
  // Regimen props (new)
  regimen,
  onUpdateRegimen,
  regimenChecked,
  toggleRegimen,
  tempChecked,
  toggleTemp,
  // Day type
  dayType,
  onSetDayType,
}) => {
  const [subTab, setSubTab] = useState('today');

  const tabs = [
    { id: 'today', label: 'Today', color: 'var(--accent)' },
    { id: 'regimen', label: 'Regimen', color: 'var(--ok)' },
    { id: 'challenges', label: 'Challenges', color: 'var(--warn)' },
  ];

  return (
    <div className="page dashboard-page">
      {/* Sub-tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 4, 
        background: 'var(--bg-2)', 
        padding: 4, 
        borderRadius: 10,
        marginBottom: 24,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: 8,
              background: subTab === t.id ? `${t.color}18` : 'transparent',
              color: subTab === t.id ? t.color : 'var(--text-2)',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 15,
              letterSpacing: '.08em',
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {subTab === 'today' && (
        <TodayTab
          challenge={challenge}
          challenges={challenges}
          kpis={kpis}
          toggle={toggle}
          regimen={regimen}
          regimenChecked={regimenChecked}
          toggleRegimen={toggleRegimen}
          tempChecked={tempChecked}
          toggleTemp={toggleTemp}
          userName={userName}
          onLogDay={onLogDay}
          loggedToday={loggedToday}
          dayType={dayType}
          onSetDayType={onSetDayType}
        />
      )}

      {subTab === 'regimen' && (
        <RegimenTab
          regimen={regimen}
          onUpdateRegimen={onUpdateRegimen}
          regimenChecked={regimenChecked}
          toggleRegimen={toggleRegimen}
        />
      )}

      {subTab === 'challenges' && (
        <ChallengesTab
          challenge={challenge}
          challenges={challenges}
          checkins={checkins}
          onAddSecondary={onAddSecondary}
          onViewChallenge={onViewChallenge}
          onStartChallenge={onStartChallenge}
          onUpdateChallengeTasks={onUpdateChallengeTasks}
        />
      )}
    </div>
  );
};

export default Dashboard;