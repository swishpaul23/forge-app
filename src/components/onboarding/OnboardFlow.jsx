import React, { useState, useEffect } from 'react';
import { TEMPLATES } from '../../constants/templates';

const DIFF_COLOR = { Hard:"#BF5D5D", Intense:"#D4B22A", Moderate:"#5DBF8A", "You decide":"#4A8FD4" };

/**
 * OnboardWhy - Screen 1: Why You're Here
 */
export const OnboardWhy = ({ onNext, onSkip }) => (
  <>
  <div className="ob-screen">
    <div className="ob-inner">
      <div className="ob-progress">
        <div className="ob-dot on" /><div className="ob-dot" /><div className="ob-dot" />
      </div>
      <div className="ob-eyebrow">Why you're here</div>
      <div className="ob-headline">
        You're tired of<br /><span>almost.</span>
      </div>
      <div className="ob-body">
        Almost working out. Almost finishing the project. Almost becoming who you said you'd be. You've tried apps, systems, routines — and something always breaks down. Not this time.
      </div>
      <div className="ob-truth-grid">
        {[
          { icon:"🔁", title:"The cycle is real", body:"Start strong, fade out, reset. You know this pattern better than anyone." },
          { icon:"📵", title:"Distractions win daily", body:"Your phone, your comfort zone, your own negotiating mind — they're relentless." },
          { icon:"🧠", title:"Motivation isn't enough", body:"Motivation is a feeling. Feelings are unreliable. Systems outlast them." },
          { icon:"🪞", title:"You know what's possible", body:"The gap between who you are and who you could be — that gap is why you're here." },
        ].map(t => (
          <div key={t.title} className="ob-truth">
            <div className="ob-truth-icon">{t.icon}</div>
            <div className="ob-truth-text"><strong>{t.title}</strong>{t.body}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
  <div className="ob-footer">
    <div className="ob-scroll-hint">
      <span>scroll down</span>
      <span>↓</span>
    </div>
    <div className="ob-nav-row">
      <button className="ob-next-btn" onClick={onNext}>That's me. Keep going →</button>
      <div className="ob-skip" onClick={onSkip}>Skip intro</div>
    </div>
  </div>
  </>
);

/**
 * OnboardWho - Screen 2: Who Forge Is For
 */
export const OnboardWho = ({ onNext, onSkip }) => (
  <>
  <div className="ob-screen">
    <div className="ob-inner">
      <div className="ob-progress">
        <div className="ob-dot" /><div className="ob-dot on" /><div className="ob-dot" />
      </div>
      <div className="ob-eyebrow">Who Forge is for</div>
      <div className="ob-headline">
        Built for<br /><span>builders.</span>
      </div>
      <div className="ob-body">
        Not everyone is ready for this. Forge is for the ones who've decided — really decided — that the old version of themselves isn't good enough.
      </div>
      <div className="ob-for-grid">
        {[
          { icon:"🏗️", title:"The Builder", desc:"Shipping projects, building habits, stacking skills. You need accountability, not inspiration." },
          { icon:"🔩", title:"The Grinder", desc:"Early mornings, late nights, no shortcuts. You're not looking for easy — you're looking for better." },
          { icon:"🎯", title:"The Focused", desc:"Done with scattered energy. You want one direction, relentless execution, measurable proof." },
          { icon:"🔄", title:"The Rebounder", desc:"You fell off before. You know what went wrong. You're back and this time it's different." },
          { icon:"⚡", title:"The High-Performer", desc:"You're already good. You want a system that keeps you accountable to your own standard." },
          { icon:"🌱", title:"The Starter", desc:"Day one. No history, no excuses. Just the decision to begin and the discipline to continue." },
        ].map(c => (
          <div key={c.title} className="ob-for-card">
            <div className="ob-for-icon">{c.icon}</div>
            <div className="ob-for-title">{c.title}</div>
            <div className="ob-for-desc">{c.desc}</div>
          </div>
        ))}
      </div>
      <div className="ob-not-for">
        <div className="ob-not-label">✕ Forge is not for</div>
        <div className="ob-not-list">
          {["People looking for easy wins","Excuse-makers","Passive trackers","Motivation-chasers"].map(x => (
            <div key={x} className="ob-not-item">{x}</div>
          ))}
        </div>
      </div>
    </div>
  </div>
  <div className="ob-footer">
    <div className="ob-scroll-hint">
      <span>scroll down</span>
      <span>↓</span>
    </div>
    <div className="ob-nav-row">
      <button className="ob-next-btn" onClick={onNext}>I'm in →</button>
      <div className="ob-skip" onClick={onSkip}>Skip intro</div>
    </div>
  </div>
  </>
);

/**
 * OnboardInduct - Screen 3: Induction
 */
export const OnboardInduct = ({ onDone, userName }) => (
  <div className="ob-screen">
    <div className="ob-induction-bg" />
    <div className="ob-inner" style={{ position:"relative", zIndex:1 }}>
      <div className="ob-progress">
        <div className="ob-dot" /><div className="ob-dot" /><div className="ob-dot on" />
      </div>
      <div className="ob-eyebrow">Your induction</div>
      <div className="ob-headline" style={{ marginBottom:12 }}>
        Welcome to<br /><span>The Forge.</span>
      </div>
      <div className="ob-body" style={{ marginBottom:28 }}>
        {userName}, this is not an app. It's an environment. An environment built on one principle: <strong style={{ color:"var(--text-0)" }}>show up every single day.</strong>
      </div>
      <div className="ob-oath">
        <div className="ob-oath-label">The Forge Standard</div>
        {[
          "I do not negotiate with my past self.",
          "I show up on hard days. Especially on hard days.",
          "I track honestly. No vanity metrics. No lies.",
          "I accept that discomfort is the price of growth.",
          "I am not competing with others. I am competing with who I was yesterday.",
        ].map(line => (
          <div key={line} className="ob-oath-line">{line}</div>
        ))}
      </div>
      <button className="ob-cta-btn" onClick={onDone}>
        I ACCEPT. ENTER THE FORGE.
      </button>
      <div className="f-mono c-2 mt16" style={{ fontSize:9, letterSpacing:".14em", textAlign:"center" }}>
        YOUR STREAK STARTS TODAY. DON'T BREAK IT.
      </div>
    </div>
  </div>
);

/**
 * OnboardChallenge - Screen 4: Pick Your Challenge
 */
export const OnboardChallenge = ({ onStart, onSkip }) => {
  const [selected, setSelected] = useState(null);
  const [editTasks, setEditTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [nonNegs, setNonNegs] = useState([]);
  const templates = TEMPLATES.filter(t => t.id !== "custom");
  const t = selected || templates[0];

  const selectTemplate = (tmpl) => {
    setSelected(tmpl);
    setTasks(tmpl.kpis.map((k,i) => ({ id:i, label:k.label, cat:k.cat })));
    setNonNegs([]);
    setEditTasks(false);
  };

  useEffect(() => {
    if (tasks.length === 0) setTasks(templates[0].kpis.map((k,i) => ({ id:i, label:k.label, cat:k.cat })));
  }, []);

  const addTask = () => setTasks(ts => [...ts, { id:Date.now(), label:"", cat:"other" }]);
  const removeTask = (id) => { setTasks(ts => ts.filter(x => x.id !== id)); setNonNegs(ns => ns.filter(n => n !== id)); };
  const updateTask = (id, val) => setTasks(ts => ts.map(x => x.id===id ? {...x, label:val} : x));
  const toggleNonNeg = (id) => setNonNegs(ns => ns.includes(id) ? ns.filter(n => n !== id) : [...ns, id]);
  const validTasks = tasks.filter(t => t.label.trim());

  return (
    <div style={{
      position:"fixed", inset:0, background:"var(--bg-0)", zIndex:999,
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        padding:"28px 32px 20px", borderBottom:"1px solid var(--border-0)",
        display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexShrink:0,
      }}>
        <div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".35em",textTransform:"uppercase",color:"var(--accent)",marginBottom:8}}>
            Final step — choose your challenge
          </div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:".04em",lineHeight:1}}>
            What are you committing to?
          </div>
        </div>
        <button 
          className="btn btn-g"
          onClick={onSkip} 
          style={{fontSize:11,padding:"8px 16px",letterSpacing:".08em"}}
        >
          Skip for now →
        </button>
      </div>

      {/* Body — two columns */}
      <div className="ob-challenge-layout" style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* Left — card list */}
        <div className="ob-challenge-left" style={{
          width:300, flexShrink:0, overflowY:"auto",
          borderRight:"1px solid var(--border-0)", padding:"16px 12px",
          display:"flex", flexDirection:"column", gap:8,
        }}>
          {templates.map(tmpl => (
            <div key={tmpl.id}
              onClick={()=>selectTemplate(tmpl)}
              style={{
                background: selected?.id===tmpl.id ? "var(--accent-lo)" : "var(--bg-2)",
                border: `1px solid ${selected?.id===tmpl.id ? "var(--accent)" : "var(--border-1)"}`,
                borderRadius:8, padding:"14px 16px", cursor:"pointer",
                transition:"border-color .15s, background .15s",
              }}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".28em",textTransform:"uppercase",color:"var(--accent)",marginBottom:5}}>
                {tmpl.tag} · {tmpl.duration}d
              </div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:".04em",color:"var(--text-0)",marginBottom:5}}>
                {tmpl.name}
              </div>
              <div style={{
                display:"inline-block",
                fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".16em",
                textTransform:"uppercase",padding:"2px 8px",borderRadius:3,
                color: DIFF_COLOR[tmpl.difficulty]||"var(--text-2)",
                background: (DIFF_COLOR[tmpl.difficulty]||"#888")+"18",
                border:`1px solid ${(DIFF_COLOR[tmpl.difficulty]||"#888")}30`,
              }}>{tmpl.difficulty}</div>
            </div>
          ))}
        </div>

        {/* Right — detail panel */}
        <div className="ob-challenge-right" style={{flex:1, overflowY:"auto", padding:"28px 36px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".3em",textTransform:"uppercase",color:"var(--accent)"}}>
              {t.tag}
            </div>
            <div style={{
              fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:".16em",
              textTransform:"uppercase",padding:"2px 8px",borderRadius:3,
              color: DIFF_COLOR[t.difficulty]||"var(--text-2)",
              background:(DIFF_COLOR[t.difficulty]||"#888")+"18",
              border:`1px solid ${(DIFF_COLOR[t.difficulty]||"#888")}30`,
            }}>{t.difficulty}</div>
          </div>

          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,letterSpacing:".04em",lineHeight:1,marginBottom:16,color:"var(--text-0)"}}>
            {t.name}
          </div>

          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-1)",lineHeight:1.7,marginBottom:24}}>
            {t.about}
          </div>

          {/* Daily tasks */}
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)"}}>
                Daily tasks
              </div>
              <button 
                className="btn btn-g"
                onClick={()=>setEditTasks(e=>!e)} 
                style={{fontSize:10,padding:"5px 12px",letterSpacing:".08em"}}
              >
                {editTasks ? "Done" : "Edit Tasks"}
              </button>
            </div>
            {!editTasks ? (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {nonNegs.length > 0 && (
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"var(--warn)", marginBottom:4 }}>
                    ◆ {nonNegs.length} non-negotiable{nonNegs.length > 1 ? "s" : ""} — click to toggle
                  </div>
                )}
                {nonNegs.length === 0 && (
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"var(--text-2)", marginBottom:4 }}>
                    Click tasks to mark as non-negotiable
                  </div>
                )}
                {tasks.map((k,i)=>{
                  const isNonNeg = nonNegs.includes(k.id);
                  return (
                    <div key={k.id||i} 
                      onClick={() => toggleNonNeg(k.id)}
                      style={{
                        display:"flex",alignItems:"center",gap:10,
                        background: isNonNeg ? "var(--warn)10" : "var(--bg-2)",
                        border: `1px solid ${isNonNeg ? "var(--warn)40" : "var(--border-1)"}`,
                        borderRadius:6,padding:"10px 14px",
                        cursor:"pointer",
                        transition:"all 0.15s",
                      }}>
                      <div style={{
                        width:6,height:6,borderRadius:"50%",flexShrink:0,
                        background: isNonNeg ? "var(--warn)" : k.cat==="body"?"#D4922A":k.cat==="diet"?"#5DBF8A":k.cat==="mind"?"#4A8FD4":k.cat==="build"?"#BF5DBF":"var(--text-2)",
                      }} />
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color: isNonNeg ? "var(--warn)" : "var(--text-0)",letterSpacing:".06em",flex:1}}>
                        {k.label}
                      </div>
                      {isNonNeg && (
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, letterSpacing:".1em", color:"var(--warn)" }}>
                          NON-NEG
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {tasks.map((tk,i)=>(
                  <div key={tk.id||i} style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input
                      value={tk.label}
                      onChange={e=>updateTask(tk.id||i, e.target.value)}
                      placeholder={`Task ${i+1}`}
                      style={{
                        flex:1,background:"var(--bg-3)",border:"1px solid var(--border-1)",
                        borderRadius:6,padding:"9px 12px",color:"var(--text-0)",
                        fontFamily:"'IBM Plex Mono',monospace",fontSize:11,outline:"none",
                      }}
                    />
                    {tasks.length > 1 && (
                      <div onClick={()=>removeTask(tk.id||i)} style={{color:"var(--text-2)",cursor:"pointer",fontSize:12,padding:"4px 6px"}}>✕</div>
                    )}
                  </div>
                ))}
                <button 
                  className="btn btn-g"
                  onClick={addTask} 
                  style={{width:"100%",justifyContent:"center",fontSize:10,padding:"10px",letterSpacing:".1em",borderStyle:"dashed"}}
                >
                  + Add Task
                </button>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:12}}>
              What you'll build
            </div>
            {t.benefits.map(b=>(
              <div key={b} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <span style={{color:"var(--accent)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,marginTop:1}}>◆</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-1)",lineHeight:1.6}}>{b}</span>
              </div>
            ))}
          </div>

          {/* Best for */}
          <div style={{
            background:"var(--bg-2)",border:"1px solid var(--border-1)",
            borderRadius:8,padding:"16px 20px",marginBottom:32,
          }}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,letterSpacing:".28em",textTransform:"uppercase",color:"var(--text-2)",marginBottom:8}}>
              Best for
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-1)",lineHeight:1.6}}>
              {t.bestFor}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={()=>onStart(t, validTasks, nonNegs)}
            style={{
              width:"100%", padding:"16px", borderRadius:8,
              background:"var(--accent)", color:"#080807",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:".1em",
              border:"none", cursor:"pointer",
              boxShadow:"0 4px 0 rgba(0,0,0,.4)",
              transition:"transform .1s, box-shadow .1s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 0 rgba(0,0,0,.4)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 4px 0 rgba(0,0,0,.4)";}}
          >
            Start {t.name} — Day 1 Begins Now →
          </button>
        </div>
      </div>
    </div>
  );
};
