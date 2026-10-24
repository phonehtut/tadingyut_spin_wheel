import { Suspense } from 'react';
import { verifySignature, checkExistingSpin, getPrizes } from '@/app/actions/spin';
import SpinPageClient from './SpinPageClient';

async function SpinContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const mac = (params.mac as string) || '';
  const ip = (params.ip as string) || '';
  const sig = (params.sig as string) || '';
  const loginUrl = (params.login_url as string) || '';

  // 1. Verify signature on server side
  const isValidSig = await verifySignature(mac, ip, sig);

  if (!isValidSig) {
    return (
      <div className="festival-bg flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-[#2d1810] to-[#1a0a00] border-2 border-red-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-400 mb-3">
            Wi-Fi ချိတ်ဆက်မှုမှတစ်ဆင့်သာ ကံစမ်းနိုင်ပါသည်
          </h1>
          <p className="text-gray-400 text-sm">
            ကျေးဇူးပြု၍ Wi-Fi Hotspot မှတစ်ဆင့် ချိတ်ဆက်ပြီး ကံစမ်းပါ။
          </p>
          <div className="mt-4 text-6xl lantern-float">🏮</div>
        </div>
      </div>
    );
  }

  // 2. Check if user already spun
  const existing = await checkExistingSpin(mac);

  if (existing.alreadySpun) {
    return (
      <div className="festival-bg flex items-center justify-center p-4">
        <div
          className="bg-gradient-to-b from-[#2d1810] to-[#1a0a00] border-2 border-yellow-600 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl glow-card"
          style={{ boxShadow: '0 0 40px rgba(255, 215, 0, 0.15)' }}
        >
          <div className="text-5xl mb-3">🔄</div>
          <h1 className="text-xl font-bold text-orange-400 mb-2">
            သင် ကံစမ်းပြီးဖြစ်ပါသည်
          </h1>
          <p className="text-white text-lg mb-4">
            သင့်ဆု: <span className="text-yellow-400 font-bold">{existing.prizeName}</span>
          </p>
          {existing.isWinning && (
            <div className="bg-black/40 rounded-xl p-4 mb-4 border border-yellow-700">
              <p className="text-sm text-yellow-300 mb-1">Redeem Code</p>
              <p className="text-3xl font-mono font-bold text-yellow-400 tracking-wider">
                {existing.redeemCode}
              </p>
              <p className="text-xs text-orange-300 mt-2">
                📸 Screenshot ရိုက်ထားပါ
              </p>
            </div>
          )}
          <p className="text-sm text-gray-400">
            {existing.isWinning
              ? 'ဆုကုဒ်ကို ကောင်တာတွင် ပြသပါ'
              : 'ပါဝင်ကံစမ်းပေးအပ်ခြင်းအတွက် ကျေးဇူးတင်ပါသည်'}
          </p>

          {/* Instruction: Screenshot and Back to connect Wi-Fi */}
          <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-center">
            <p className="text-sm font-bold text-yellow-300">
              👈 Back ပြန်ထွက်ပြီး Wi-Fi ချိတ်ပါ
            </p>
            <p className="text-xs text-yellow-200/70 mt-1">
              ဆုမဲကို Screenshot ရိုက်ပြီးပါက Back နှိပ်၍ Ticket ကုဒ်ထည့်ပါ
            </p>
          </div>

          <a
            href="javascript:history.back()"
            className="mt-4 block w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg text-center cursor-pointer"
          >
            ⬅️ မူရင်းစာမျက်နှာသို့ ပြန်သွားမည် (Back)
          </a>

          <div className="mt-4 flex justify-center gap-2 text-4xl">
            <span className="lantern-float">🏮</span>
            <span className="lantern-float" style={{ animationDelay: '0.5s' }}>✨</span>
            <span className="lantern-float" style={{ animationDelay: '1s' }}>🏮</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fetch prizes for the wheel
  const allPrizes = await getPrizes();

  return (
    <SpinPageClient
      prizes={allPrizes.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isWinning: p.isWinning,
      }))}
      mac={mac}
      ip={ip}
      sig={sig}
      loginUrl={loginUrl}
    />
  );
}

export default function SpinPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="festival-bg flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-5xl mb-4 lantern-float">🏮</div>
            <p className="text-yellow-400 font-semibold">ခေတ္တစောင့်ဆိုင်းပါ...</p>
          </div>
        </div>
      }
    >
      <SpinContent searchParams={searchParams} />
    </Suspense>
  );
}
