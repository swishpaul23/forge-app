import React, { useState, useEffect, useRef } from 'react';

/**
 * WeldCanvas - Welding sparks animation for landing page
 */
const WeldCanvas = ({ onDone }) => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const rafRef = useRef(null);
  const intervalsRef = useRef([]);

  const SPEED = 0.75;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    function spawnStream(x, y, count, intensity) {
      intensity = intensity || 1;
      for (let i = 0; i < count; i++) {
        const fanW = 0.65 + intensity * 0.25;
        const angle = -Math.PI/2 + (Math.random()-0.5)*fanW*2;
        const heavy = Math.random() < 0.28;
        const speed = heavy ? 1.5+Math.random()*3 : 5+Math.random()*12*intensity;
        const life = heavy ? 0.6+Math.random()*0.7 : 0.22+Math.random()*0.6;
        const temp = Math.random();
        const color = temp>0.7?"#FFFDE0":temp>0.4?"#FFD060":temp>0.2?"#FF9020":"#FF5500";
        particles.current.push({
          x,y,px:x,py:y,
          vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
          life, maxLife:life, color,
          width: heavy?1.3:0.5+Math.random()*0.7,
          trailLen: heavy?2+Math.random()*5:7+Math.random()*20,
          gravity: heavy?0.32:0.21, drag: heavy?0.968:0.991,
          floor: y+40+Math.random()*90,
          bounced:false, fadePow: heavy?1.3:0.65,
        });
      }
    }

    function streamSparks(getPos, totalMs, pps) {
      pps = pps || 60;
      const interval = 1000/pps;
      const end = performance.now()+totalMs;
      const id = setInterval(() => {
        if (performance.now()>=end) { clearInterval(id); return; }
        const pos = getPos();
        spawnStream(pos.x, pos.y, 1+Math.floor(Math.random()*3), 1);
      }, interval);
      intervalsRef.current.push(id);
      return id;
    }

    function drawFrame() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const arr = particles.current;
      for (let i=arr.length-1;i>=0;i--) {
        const p=arr[i];
        p.px=p.x; p.py=p.y;
        p.x+=p.vx; p.y+=p.vy;
        p.vy+=p.gravity; p.vx*=p.drag;
        if (!p.bounced && p.y>p.floor && p.vy>0) {
          p.bounced=true;
          if (Math.random()>0.5) {
            for (let j=0;j<2;j++) {
              const a=-Math.PI/2+(Math.random()-0.5)*Math.PI*0.8;
              const s=0.8+Math.random()*2;
              arr.push({x:p.x,y:p.y,px:p.x,py:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.5,
                life:0.12+Math.random()*0.18,maxLife:0.3,color:"#FF6A00",width:0.4,
                trailLen:3,gravity:0.25,drag:0.98,floor:p.floor+999,bounced:true,fadePow:1});
            }
          }
          p.life=0;
        }
        p.life-=0.015;
        if (p.life<=0){arr.splice(i,1);continue;}
        const a=Math.pow(Math.max(0,p.life/p.maxLife),p.fadePow);
        ctx.globalAlpha=a;
        const dx=p.x-p.px,dy=p.y-p.py;
        const mag=Math.sqrt(dx*dx+dy*dy)||1;
        ctx.beginPath();
        ctx.strokeStyle=p.color;ctx.lineWidth=p.width;ctx.lineCap="round";
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(p.x-(dx/mag)*p.trailLen,p.y-(dy/mag)*p.trailLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle=a>0.5?"#FFFFFF":p.color;
        ctx.arc(p.x,p.y,p.width*0.85,0,Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha=1;
      rafRef.current=requestAnimationFrame(drawFrame);
    }
    rafRef.current=requestAnimationFrame(drawFrame);

    const letterEls = Array.from(document.querySelectorAll(".forge-stamp-letter"));

    function getBase(idx) {
      const el=letterEls[idx];
      if (!el) return {x:window.innerWidth/2,y:window.innerHeight/2};
      const r=el.getBoundingClientRect();
      return {x:r.left+r.width/2, y:r.top+r.height*0.78};
    }

    function forgeLetter(idx, startDelay) {
      return new Promise(resolve => {
        setTimeout(() => {
          const el=letterEls[idx];
          if (!el) { resolve(); return; }
          el.style.transition="none";
          el.style.opacity="1";
          el.style.color="#1A1916";
          const workDuration=(700+Math.random()*250)*SPEED;
          const sid=streamSparks(()=>getBase(idx),workDuration,60);
          setTimeout(()=>{ el.style.transition="color .35s ease"; el.style.color="#7A4A10"; }, workDuration*0.4);
          setTimeout(()=>{
            clearInterval(sid);
            const pos=getBase(idx);
            spawnStream(pos.x,pos.y,55,1.5);
            el.style.transition="none"; el.style.color="#FFF8DC";
            setTimeout(()=>{ el.style.transition="color .8s ease,text-shadow .9s ease"; el.style.color="#D4922A"; el.style.textShadow="0 0 12px #D4922A20"; },90);
            setTimeout(()=>{ el.style.textShadow="none"; resolve(); },900);
          },workDuration);
        },startDelay);
      });
    }

    const barEl = document.getElementById("forge-landing-bar");
    function fillBar(duration) {
      if (!barEl) return;
      barEl.style.width="0%";
      const start=performance.now();
      function tick(now) {
        const t=Math.min((now-start)/duration,1);
        barEl.style.width=(Math.pow(t,0.55)*100)+"%";
        if(t<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    async function run() {
      await new Promise(r=>setTimeout(r,500*SPEED));
      const STAGGER=580*SPEED;
      const promises=letterEls.map((_,i)=>forgeLetter(i,i*STAGGER));
      const totalForgeTime=letterEls.length*STAGGER+900*SPEED;
      setTimeout(()=>fillBar(2600*SPEED), totalForgeTime*0.55);
      await Promise.all(promises);

      let rc=0;
      const rid=setInterval(()=>{
        const idx=Math.floor(Math.random()*letterEls.length);
        const pos=getBase(idx);
        spawnStream(pos.x+(Math.random()-0.5)*10,pos.y,3+Math.floor(Math.random()*5),0.55);
        rc++;if(rc>22)clearInterval(rid);
      },180);
      intervalsRef.current.push(rid);

      const subEl=document.getElementById("forge-landing-sub");
      if(subEl){ subEl.style.transition="color 1.2s ease"; subEl.style.color="#56524D"; }

      setTimeout(onDone, 2200);
    }

    run();

    return () => {
      cancelAnimationFrame(rafRef.current);
      intervalsRef.current.forEach(clearInterval);
    };
  }, [onDone]);

  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}} />;
};

/**
 * LandingLoader - Full welding sparks sequence (first visit)
 */
export const LandingLoader = ({ onDone, authReady }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const MIN_MS = Math.round((500 + 5*580 + 900 + 2200) * 0.75);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (minElapsed && authReady) onDone();
  }, [minElapsed, authReady, onDone]);

  return (
    <div style={{position:"fixed",inset:0,background:"#080807",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <WeldCanvas onDone={()=>{}} />
      <div style={{position:"relative",zIndex:2,display:"flex",gap:2}}>
        {["F","O","R","G","E"].map((l,i)=>(
          <span key={i} id={`fsl${i}`} className="forge-stamp-letter" style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:100, color:"#080807",
            letterSpacing:".06em", display:"inline-block", opacity:0,
            willChange:"transform,color,opacity",
          }}>{l}</span>
        ))}
      </div>
      <div id="forge-landing-sub" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:".38em",textTransform:"uppercase",color:"transparent",marginTop:10,position:"relative",zIndex:2}}>
        your discipline engine
      </div>
      <div style={{width:220,height:1,background:"#161614",marginTop:56,overflow:"hidden",position:"relative",zIndex:2}}>
        <div id="forge-landing-bar" style={{height:1,width:"0%",background:"#D4922A"}} />
      </div>
    </div>
  );
};

/**
 * LoginLoader - Minimal "ENTERING THE FORGE" loader (~1.5s)
 */
const MIN_LOGIN_MS = 1400;

export const LoginLoader = ({ onDone, authReady }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const [visible, setVisible] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => {
      if (!barRef.current) return;
      const start = performance.now();
      const dur = 1000;
      function tick(now) {
        const prog = Math.min((now-start)/dur,1);
        const e = 1-Math.pow(1-prog,2.2);
        if (barRef.current) barRef.current.style.width=(e*100)+"%";
        if (prog<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, 150);
    const t3 = setTimeout(() => setMinElapsed(true), MIN_LOGIN_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (minElapsed && authReady) onDone();
  }, [minElapsed, authReady, onDone]);

  return (
    <div style={{position:"fixed",inset:0,background:"#080807",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{
        fontFamily:"'IBM Plex Mono',monospace", fontSize:11.5,
        letterSpacing:".42em", textTransform:"uppercase",
        opacity: visible ? 1 : 0,
        transition:"opacity .45s ease",
        marginBottom:36,
      }}>
        <span style={{color:"#56524D"}}>ENTERING THE </span>
        <span style={{color:"#D4922A"}}>FORGE</span>
      </div>
      <div style={{width:160,height:1,background:"#161614",overflow:"hidden"}}>
        <div ref={barRef} style={{height:1,width:"0%",background:"#D4922A"}} />
      </div>
    </div>
  );
};

/**
 * InAppLoader - Full FORGE sparks (same as landing)
 */
export const InAppLoader = ({ onDone, authReady }) => {
  const [minElapsed, setMinElapsed] = useState(false);
  const MIN_MS = Math.round((500 + 5*580 + 900 + 2200) * 0.75);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (minElapsed && authReady) onDone();
  }, [minElapsed, authReady, onDone]);

  return (
    <div style={{position:"fixed",inset:0,background:"#080807",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <WeldCanvas onDone={()=>{}} />
      <div style={{position:"relative",zIndex:2,display:"flex",gap:2}}>
        {["F","O","R","G","E"].map((l,i)=>(
          <span key={i} id={`fsl${i}`} className="forge-stamp-letter" style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:110, color:"#080807",
            letterSpacing:".06em", display:"inline-block", opacity:0,
            willChange:"transform,color,opacity",
          }}>{l}</span>
        ))}
      </div>
      <div id="forge-landing-sub" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,letterSpacing:".38em",textTransform:"uppercase",color:"transparent",marginTop:10,position:"relative",zIndex:2}}>
        your discipline engine
      </div>
      <div style={{width:220,height:1,background:"#161614",marginTop:56,overflow:"hidden",position:"relative",zIndex:2}}>
        <div id="forge-landing-bar" style={{height:1,width:"0%",background:"#D4922A"}} />
      </div>
    </div>
  );
};

/**
 * Entry - Routes to correct loader based on mode
 */
const Entry = ({ onDone, authReady, mode }) => {
  if (mode === "login") return <LoginLoader onDone={onDone} authReady={authReady} />;
  if (mode === "inapp") return <InAppLoader onDone={onDone} authReady={authReady} />;
  return <LandingLoader onDone={onDone} authReady={authReady} />;
};

export default Entry;
export { WeldCanvas };
