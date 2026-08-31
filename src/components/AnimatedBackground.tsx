import React, { useEffect, useRef } from 'react';

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      alpha: number;
      targetAlpha: number;
      alphaSpeed: number;
      glow: boolean;
    }

    const particleCount = Math.min(Math.floor((width * height) / 28000), 50);
    const particles: Particle[] = [];

    const colors = [
      'rgba(0, 255, 102, ', // Neon Green
      'rgba(255, 215, 0, ', // Gold
      'rgba(16, 185, 129, ', // Emerald
      'rgba(148, 163, 184, ', // Slate/Star
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.3 - 0.05, // slow upward drift
        alpha: Math.random() * 0.5 + 0.1,
        targetAlpha: Math.random() * 0.6 + 0.2,
        alphaSpeed: Math.random() * 0.008 + 0.002,
        glow: Math.random() > 0.6,
      });
    }

    // Chart curve points
    let chartOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle moving faint trading chart waves in the background
      chartOffset += 0.004;

      // Draw faint trading wave 1 (Neon Green)
      ctx.save();
      ctx.beginPath();
      const waveY1 = height * 0.45;
      ctx.moveTo(0, waveY1);

      for (let x = 0; x <= width; x += 15) {
        const y =
          waveY1 +
          Math.sin(x * 0.003 + chartOffset) * 35 +
          Math.cos(x * 0.008 - chartOffset * 1.5) * 20;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = 'rgba(0, 255, 102, 0.035)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw faint trading wave 2 (Golden)
      ctx.beginPath();
      const waveY2 = height * 0.65;
      ctx.moveTo(0, waveY2);

      for (let x = 0; x <= width; x += 20) {
        const y =
          waveY2 +
          Math.cos(x * 0.0025 + chartOffset * 0.8) * 45 +
          Math.sin(x * 0.006 + chartOffset) * 25;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = 'rgba(255, 215, 0, 0.025)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // 2. Draw Slow Moving Particles / Stars
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around borders
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        // Alpha breathing
        if (Math.abs(p.alpha - p.targetAlpha) < 0.01) {
          p.targetAlpha = Math.random() * 0.6 + 0.15;
        } else if (p.alpha < p.targetAlpha) {
          p.alpha += p.alphaSpeed;
        } else {
          p.alpha -= p.alphaSpeed;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (p.glow) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color + '0.8)';
        }

        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      id="asjadfx-animated-background"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Background canvas for particles and chart waves */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle moving ambient atmospheric glows */}
      <div className="absolute -top-40 left-1/4 w-96 h-96 bg-[#00FF66]/5 rounded-full blur-[140px] animate-pulse pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-[#FFD700]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[300px] bg-[#00FF66]/4 rounded-full blur-[150px] pointer-events-none" />
    </div>
  );
};
