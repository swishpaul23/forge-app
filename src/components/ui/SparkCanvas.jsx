import React, { useRef, useEffect } from 'react';

/**
 * Spark particle effect canvas
 * Triggers burst animation when trigger prop changes to true
 */
const SparkCanvas = ({ trigger }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const prevTrigger = useRef(false);

  const burst = (canvas) => {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext("2d");

    class Spark {
      constructor(x, y, fromSide) {
        this.x = x; this.y = y;
        let angle, speed;
        if (fromSide === "left") {
          angle = -Math.PI * (0.15 + Math.random() * 0.55);
          speed = 6 + Math.random() * 13;
        } else if (fromSide === "right") {
          angle = -Math.PI * (0.45 + Math.random() * 0.55);
          speed = 6 + Math.random() * 13;
        } else {
          angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
          speed = 5 + Math.random() * 14;
        }
        this.vx = Math.cos(angle) * speed * (0.5 + Math.random() * 0.9);
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.22 + Math.random() * 0.14;
        this.isStreak = Math.random() > 0.35;
        this.size = this.isStreak ? (0.8 + Math.random() * 1.8) : (1.5 + Math.random() * 3);
        this.life = 0;
        this.maxLife = 40 + Math.random() * 65;
        this.px = x; this.py = y;
        const palette = ["#D4922A","#FFB830","#FFDD88","#FF6A00","#FF9500","#FFCC44","#FF4500","#FFA040","#FFFFFF","#FF7020"];
        this.color = palette[Math.floor(Math.random() * palette.length)];
      }
      update() {
        this.px = this.x; this.py = this.y;
        this.vx *= 0.982; this.vy += this.gravity;
        this.x += this.vx; this.y += this.vy;
        this.life++;
      }
      draw(ctx) {
        const t = this.life / this.maxLife;
        const alpha = t < 0.15 ? t / 0.15 : 1 - ((t - 0.15) / 0.85);
        ctx.globalAlpha = Math.max(0, alpha * 0.95);
        ctx.strokeStyle = this.color; ctx.fillStyle = this.color;
        if (this.isStreak) {
          const dx = this.x - this.px, dy = this.y - this.py;
          if (Math.sqrt(dx*dx+dy*dy) > 0.5) {
            ctx.beginPath(); ctx.lineWidth = this.size; ctx.lineCap = "round";
            ctx.moveTo(this.px, this.py); ctx.lineTo(this.x, this.y); ctx.stroke();
          }
        } else {
          ctx.beginPath(); ctx.arc(this.x, this.y, this.size*(1-t*0.4), 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      get dead() { return this.life >= this.maxLife || this.y > H + 30; }
    }

    const add = (x, y, side, count) => {
      for (let i = 0; i < count; i++) particlesRef.current.push(new Spark(x, y, side));
    };

    // Bottom wave
    for (let i = 0; i < 160; i++) add(W*0.05 + Math.random()*W*0.9, H+5, "bottom", 1);
    // Left side bursts
    setTimeout(() => {
      add(0, H*0.85, "left", 40);
      add(0, H*0.65, "left", 30);
      add(0, H*0.45, "left", 20);
    }, 60);
    // Right side bursts
    setTimeout(() => {
      add(W, H*0.85, "right", 40);
      add(W, H*0.65, "right", 30);
      add(W, H*0.45, "right", 20);
    }, 120);
    // Second bottom wave
    setTimeout(() => {
      for (let i = 0; i < 80; i++) add(W*0.2+Math.random()*W*0.6, H+5, "bottom", 1);
    }, 90);
    // Ember trickle
    setTimeout(() => {
      for (let i = 0; i < 50; i++) add(W*0.1+Math.random()*W*0.8, H+5, "bottom", 1);
      add(0, H*0.5, "left", 15);
      add(W, H*0.5, "right", 15);
    }, 220);

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      particlesRef.current = particlesRef.current.filter(p => !p.dead);
      particlesRef.current.forEach(p => { p.update(); p.draw(ctx); });
      if (particlesRef.current.length > 0) frameRef.current = requestAnimationFrame(loop);
      else { frameRef.current = null; ctx.clearRect(0, 0, W, H); }
    };
    if (!frameRef.current) loop();
  };

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = [];
      burst(canvas);
    }
    prevTrigger.current = trigger;
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [trigger]);

  return <canvas ref={canvasRef} id="forge-sparks" />;
};

export default SparkCanvas;
