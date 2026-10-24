'use client';

import SpinWheel from '@/app/components/SpinWheel';
import { spinWheelAction, type SpinResult } from '@/app/actions/spin';

interface SpinPageClientProps {
  prizes: { id: number; name: string; color: string; isWinning: boolean }[];
  mac: string;
  ip: string;
  sig: string;
}

export default function SpinPageClient({
  prizes,
  mac,
  ip,
  sig,
}: SpinPageClientProps) {
  const handleSpin = async (): Promise<SpinResult> => {
    return spinWheelAction(mac, ip, sig);
  };

  return (
    <div className="festival-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative floating lanterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span
          className="absolute text-4xl lantern-float opacity-40"
          style={{ top: '5%', left: '8%', animationDelay: '0s' }}
        >
          🏮
        </span>
        <span
          className="absolute text-3xl lantern-float opacity-30"
          style={{ top: '12%', right: '12%', animationDelay: '1s' }}
        >
          🏮
        </span>
        <span
          className="absolute text-2xl lantern-float opacity-25"
          style={{ bottom: '15%', left: '5%', animationDelay: '0.5s' }}
        >
          ✨
        </span>
        <span
          className="absolute text-3xl lantern-float opacity-35"
          style={{ bottom: '20%', right: '8%', animationDelay: '1.5s' }}
        >
          🏮
        </span>
        <span
          className="absolute text-2xl lantern-float opacity-20"
          style={{ top: '40%', left: '2%', animationDelay: '2s' }}
        >
          ✨
        </span>
        <span
          className="absolute text-2xl lantern-float opacity-20"
          style={{ top: '35%', right: '3%', animationDelay: '0.8s' }}
        >
          ✨
        </span>
      </div>

      {/* Header */}
      <div className="text-center mb-6 z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl lantern-float">🏮</span>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            သီတင်းကျွတ်ပွဲတော်
          </h1>
          <span className="text-3xl lantern-float" style={{ animationDelay: '0.5s' }}>
            🏮
          </span>
        </div>
        <p className="text-yellow-200/80 text-sm md:text-base">
          ✨ ကံစမ်းဘီးလှည့်ပြီး ဆုရယူပါ ✨
        </p>
      </div>

      {/* Spin Wheel */}
      <div className="z-10 w-full max-w-md">
        <SpinWheel prizes={prizes} onSpin={handleSpin} />
      </div>

      {/* Footer */}
      <div className="mt-6 text-center z-10">
        <p className="text-yellow-600/60 text-xs">
          တစ်ဦးတစ်ယောက်လျှင် တစ်ကြိမ်သာ ကံစမ်းခွင့်ရှိပါသည်
        </p>
      </div>
    </div>
  );
}
