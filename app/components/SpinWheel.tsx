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
      for (let i = 0; i < 24; i++) {
        const dotAngle = (i / 24) * Math.PI * 2;
        const dotX = center + (radius + 2) * Math.cos(dotAngle);
        const dotY = center + (radius + 2) * Math.sin(dotAngle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FF6B35';
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
        // Animate the wheel to land on the correct prize
        const targetIndex = spinResult.prizeIndex;

        // The pointer is at the top (12 o'clock = -π/2)
        // We need the middle of the target slice to align with the pointer
        // Slice starts at: targetIndex * sliceAngle
        // Middle of slice: targetIndex * sliceAngle + sliceAngle / 2
        // We need this to be at -π/2 (top), so:
        // rotation + targetIndex * sliceAngle + sliceAngle/2 = -π/2 + 2πn
        // rotation = -π/2 - targetIndex * sliceAngle - sliceAngle/2

        const targetAngle =
          -Math.PI / 2 - targetIndex * sliceAngle - sliceAngle / 2;

        // Add multiple full rotations for visual effect (5-8 full spins)
        const fullSpins = 5 + Math.random() * 3;
        const totalRotation = targetAngle - fullSpins * 2 * Math.PI;

        const startRotation = currentRotation;
        const startTime = performance.now();
        const duration = 4000; // 4 seconds

        // Cubic bezier easing (ease-out)
        const easeOutCubic = (t: number): number => {
          return 1 - Math.pow(1 - t, 3);
        };

        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);

          const rot =
            startRotation + (totalRotation - startRotation) * eased;
          setCurrentRotation(rot);
          drawWheel(rot);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            // Animation complete
            setCurrentRotation(totalRotation);

            if (spinResult.isWinning) {
              fireConfetti();
            }
            setShowModal(true);
            setSpinning(false);
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

            {loginUrl ? (
              <a
                href={loginUrl}
                className="mt-4 block w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-950/40 text-center cursor-pointer"
              >
                🌐 အင်တာနက် စတင်အသုံးပြုမည် (Connect Internet)
              </a>
            ) : (
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 px-6 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg transition-colors cursor-pointer"
              >
                ပိတ်မည်
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
