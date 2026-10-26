'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { SpinResult } from '@/app/actions/spin';

interface Prize {
  id: number;
  name: string;
  color: string;
  isWinning: boolean;
}

interface SpinWheelProps {
  prizes: Prize[];
  onSpin: () => Promise<SpinResult>;
  loginUrl?: string;
}

export default function SpinWheel({ prizes, onSpin, loginUrl }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const numSlices = prizes.length;
  const sliceAngle = (2 * Math.PI) / numSlices;

  // Draw the wheel
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 8;

      ctx.clearRect(0, 0, size, size);

      // Draw outer ring glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius + 6, 0, 2 * Math.PI);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      // Draw slices
      for (let i = 0; i < numSlices; i++) {
        const startAngle = rotation + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        // Slice fill
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = prizes[i].color;
        ctx.fill();

        // Slice border
        ctx.strokeStyle = '#FFD70088';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(11, Math.floor(size / 30))}px sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;

        const label = prizes[i].name;
        const maxLen = 12;
        const displayText =
          label.length > maxLen ? label.slice(0, maxLen) + '…' : label;
        ctx.fillText(displayText, radius - 16, 5);
        ctx.restore();
      }

      // Center circle
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.18, 0, 2 * Math.PI);
      const grad = ctx.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        radius * 0.18
      );
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(1, '#B8860B');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Decorative dots around the wheel
      const lightShift = Math.floor(rotation * 4);
      for (let i = 0; i < 24; i++) {
        const dotAngle = (i / 24) * Math.PI * 2;
        const dotX = center + (radius + 2) * Math.cos(dotAngle);
        const dotY = center + (radius + 2) * Math.sin(dotAngle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = (i + lightShift) % 2 === 0 ? '#FFD700' : '#FF6B35';
        ctx.fill();
      }
    },
    [prizes, numSlices, sliceAngle]
  );

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size based on container
    const container = canvas.parentElement;
    if (container) {
      const containerSize = Math.min(container.clientWidth, 400);
      canvas.width = containerSize;
      canvas.height = containerSize;
    }

    drawWheel(currentRotation);
  }, [drawWheel, currentRotation]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (container) {
        const containerSize = Math.min(container.clientWidth, 400);
        canvas.width = containerSize;
        canvas.height = containerSize;
      }
      drawWheel(currentRotation);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel, currentRotation]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#FFD700', '#FF6B35', '#DC143C'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FFD700', '#FF6B35', '#DC143C'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);

    try {
      const spinResult = await onSpin();
      setResult(spinResult);

      if (spinResult.success) {
        // Target prize index
        const targetIndex = spinResult.prizeIndex;

        // Pointer is at the top center of wheel (12 o'clock = -π/2)
        // Midpoint of target slice: targetIndex * sliceAngle + sliceAngle / 2
        // Safe natural random offset within middle 40% of target slice
        const maxOffset = (sliceAngle * 0.5) * 0.4;
        const randomOffset = (Math.random() - 0.5) * 2 * maxOffset;

        const baseTarget =
          -Math.PI / 2 - targetIndex * sliceAngle - sliceAngle / 2 + randomOffset;

        // Rotate clockwise (increasing angle)
        let delta = (baseTarget - currentRotation) % (2 * Math.PI);
        if (delta <= 0) {
          delta += 2 * Math.PI;
        }

        // 12 to 14 full spins for sustained suspense and authentic momentum
        const fullSpins = 12 + Math.floor(Math.random() * 3);
        const totalRotation = currentRotation + delta + fullSpins * (2 * Math.PI);

        const startRotation = currentRotation;
        const startTime = performance.now();
        const duration = 7500; // 7.5 seconds total spin

        // 3-Stage Physics Easing:
        // Stage 1 (0 -> u1): Accelerate smoothly from rest to top speed
        // Stage 2 (u1 -> u2): High-speed cruising spin
        // Stage 3 (u2 -> 1.0): Long, gradual deceleration until gentle stop
        const u1 = 0.15; // 0 to 1.1s
        const u2 = 0.35; // 1.1s to 2.6s
        const A = 0.5 * (1 - u1 + u2);

        const getProgress = (t: number): number => {
          if (t <= 0) return 0;
          if (t >= 1) return 1;

          if (t <= u1) {
            const x = t / u1;
            return (u1 * (x * x * x - 0.5 * x * x * x * x)) / A;
          } else if (t <= u2) {
            return (0.5 * u1 + (t - u1)) / A;
          } else {
            const y = (1 - t) / (1 - u2);
            return 1 - ((1 - u2) * (y * y * y - 0.5 * y * y * y * y)) / A;
          }
        };

        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = getProgress(progress);

          const rot =
            startRotation + (totalRotation - startRotation) * eased;
          setCurrentRotation(rot);
          drawWheel(rot);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            // Wheel has completely stopped on the winning prize
            setCurrentRotation(totalRotation);

            if (spinResult.isWinning) {
              fireConfetti();
            }

            // Brief pause (800ms) so user clearly sees where pointer landed before modal opens
            timeoutRef.current = setTimeout(() => {
              setShowModal(true);
              setSpinning(false);
            }, 800);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Show error/already-spun modal
        setShowModal(true);
        setSpinning(false);
      }
    } catch {
      setSpinning(false);
      setResult({
        success: false,
        error: 'တစ်ခုခု မှားယွင်းနေပါသည်။ ထပ်စမ်းကြည့်ပါ။',
      });
      setShowModal(true);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pointer / Triangle at top */}
      <div className="relative w-full max-w-[400px]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: '28px solid #FFD700',
              filter: 'drop-shadow(0 2px 6px rgba(255,215,0,0.6))',
            }}
          />
        </div>

        {/* Canvas */}
        <div className="w-full max-w-[400px] aspect-square mx-auto">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ maxWidth: '400px', maxHeight: '400px' }}
          />
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={spinning}
        className={`
          px-10 py-4 rounded-full text-xl font-bold
          transition-all duration-300 cursor-pointer
          ${
            spinning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400 spin-button-pulse shadow-lg shadow-orange-500/30'
          }
        `}
      >
        {spinning ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            ကံစမ်းနေသည်...
          </span>
        ) : (
          '🏮 ကံစမ်းမည် 🏮'
        )}
      </button>

      {/* Result Modal */}
      {showModal && result && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div
            className="bg-gradient-to-b from-[#2d1810] to-[#1a0a00] border-2 border-yellow-600 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            style={{
              boxShadow: '0 0 40px rgba(255, 215, 0, 0.2)',
            }}
          >
            {result.success ? (
              <>
                <div className="text-5xl mb-3">
                  {result.isWinning ? '🎉' : '🙏'}
                </div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                  {result.isWinning
                    ? '🏮 ဆုရရှိပါသည်! 🏮'
                    : 'ကျေးဇူးတင်ပါသည်'}
                </h2>
                <p className="text-xl text-white mb-4">{result.prizeName}</p>
                {result.isWinning && (
                  <div className="bg-black/40 rounded-xl p-4 mb-4 border border-yellow-700">
                    <p className="text-sm text-yellow-300 mb-1">
                      Redeem Code
                    </p>
                    <p className="text-3xl font-mono font-bold text-yellow-400 tracking-wider">
                      {result.redeemCode}
                    </p>
                    <p className="text-xs text-orange-300 mt-2">
                      📸 Screenshot ရိုက်ထားပါ
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-400">
                  {result.isWinning
                    ? 'ဆုကုဒ်ကို ကောင်တာတွင် ပြသပါ'
                    : 'ပါဝင်ကံစမ်းပေးအပ်ခြင်းအတွက် ကျေးဇူးတင်ပါသည်'}
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">
                  {result.alreadySpun ? '🔄' : '⚠️'}
                </div>
                <h2 className="text-xl font-bold text-orange-400 mb-2">
                  {result.alreadySpun
                    ? 'သင် ကံစမ်းပြီးဖြစ်ပါသည်'
                    : 'ကံစမ်းခွင့်မရှိပါ'}
                </h2>
                {result.existingPrize && (
                  <div className="bg-black/40 rounded-xl p-4 mb-4 border border-yellow-700">
                    <p className="text-white mb-1">
                      သင့်ဆု: {result.existingPrize.prizeName}
                    </p>
                    {result.existingPrize.isWinning && (
                      <>
                        <p className="text-2xl font-mono font-bold text-yellow-400 tracking-wider">
                          {result.existingPrize.redeemCode}
                        </p>
                        <p className="text-xs text-orange-300 mt-2">
                          📸 Screenshot ရိုက်ထားပါ
                        </p>
                      </>
                    )}
                  </div>
                )}
                {!result.alreadySpun && (
                  <p className="text-sm text-gray-400">{result.error}</p>
                )}
              </>
            )}

            {/* Instruction: Screenshot and Back to connect Wi-Fi */}
            <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl">
              <p className="text-sm font-bold text-yellow-300">
                👈 ဖုန်း၏ Back ခလုတ်ဖြင့် ပြန်ထွက်ပြီး Wi-Fi ချိတ်ပါ
              </p>
              <p className="text-xs text-yellow-200/70 mt-1">
                ဆုမဲကို Screenshot ရိုက်ပြီးပါက ဖုန်း၏ Back ဖြင့် မူရင်းစာမျက်နှာသို့ ပြန်သွား၍ Ticket ကုဒ်ထည့်ပါ
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
