'use server';

import { db } from '@/src/db';
import { prizes, spinLogs } from '@/src/db/schema';
import { eq, sql, gt, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// ── Types ──────────────────────────────────────────────────
export type SpinResult = {
  success: true;
  prizeIndex: number;
  prizeName: string;
  redeemCode: string;
  isWinning: boolean;
} | {
  success: false;
  error: string;
  alreadySpun?: boolean;
  existingPrize?: {
    prizeName: string;
    redeemCode: string;
    isWinning: boolean;
  };
};

// ── Helpers ────────────────────────────────────────────────
function generateRedeemCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O, 1/I
  let code = 'TDG-';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateDeviceToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function verifySignature(mac: string, ip: string, sig: string): Promise<boolean> {
  if (process.env.DEV_MODE === 'true') return true;
  const secret = process.env.HOTSPOT_SECRET || '';
  const expected = crypto
    .createHash('md5')
    .update(mac + ip + secret)
    .digest('hex');
  return expected === sig;
}

// ── Weighted random selection ──────────────────────────────
function weightedRandomSelect(availablePrizes: { id: number; weight: number }[]): number {
  const totalWeight = availablePrizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const prize of availablePrizes) {
    random -= prize.weight;
    if (random <= 0) return prize.id;
  }
  return availablePrizes[availablePrizes.length - 1].id;
}

// ── Main spin action ──────────────────────────────────────
export async function spinWheelAction(
  mac: string,
  ip: string,
  sig: string
): Promise<SpinResult> {
  // 1. Verify signature
  if (!(await verifySignature(mac, ip, sig))) {
    return {
      success: false,
      error: 'Wi-Fi ချိတ်ဆက်မှုမှတစ်ဆင့်သာ ကံစမ်းနိုင်ပါသည်။',
    };
  }

  // 2. Check device cookie
  const cookieStore = await cookies();
  const existingToken = cookieStore.get('tdg_device_token')?.value;

  // 3. Check if already spun (by MAC or device token)
  const existingLog = await db.query.spinLogs.findFirst({
    where: existingToken
      ? (log, { or, eq: eqOp }) =>
          or(eqOp(log.macAddress, mac), eqOp(log.deviceToken, existingToken))
      : (log, { eq: eqOp }) => eqOp(log.macAddress, mac),
    with: {},
  });

  if (existingLog) {
    const existingPrize = await db.query.prizes.findFirst({
      where: (p, { eq: eqOp }) => eqOp(p.id, existingLog.prizeId),
    });

    return {
      success: false,
      error: 'သင် ကံစမ်းပြီးဖြစ်ပါသည်။',
      alreadySpun: true,
      existingPrize: {
        prizeName: existingPrize?.name || 'Unknown',
        redeemCode: existingLog.redeemCode,
        isWinning: existingPrize?.isWinning ?? false,
      },
    };
  }

  // 4. Transaction with row-level locking
  const result = await db.transaction(async (tx) => {
    // Lock and fetch prizes with remaining qty > 0
    const allPrizes = await tx
      .select()
      .from(prizes)
      .orderBy(prizes.id)
      .for('update');

    const availablePrizes = allPrizes.filter((p) => p.remainingQty > 0);

    if (availablePrizes.length === 0) {
      return {
        success: false as const,
        error: 'ဆုလက်ကျန်မရှိတော့ပါ။ ကျေးဇူးတင်ပါသည်။',
      };
    }

    // 5. Weighted random selection
    const selectedId = weightedRandomSelect(
      availablePrizes.map((p) => ({ id: p.id, weight: p.weight }))
    );

    // 6. Decrement remaining_qty
    await tx
      .update(prizes)
      .set({ remainingQty: sql`${prizes.remainingQty} - 1` })
      .where(and(eq(prizes.id, selectedId), gt(prizes.remainingQty, 0)));

    // 7. Generate redeem code and device token
    const redeemCode = generateRedeemCode();
    const deviceToken = existingToken || generateDeviceToken();

    // 8. Insert spin log
    await tx.insert(spinLogs).values({
      macAddress: mac,
      ipAddress: ip,
      deviceToken,
      prizeId: selectedId,
      redeemCode,
    });

    // Find the prize index (position in the full allPrizes list)
    const prizeIndex = allPrizes.findIndex((p) => p.id === selectedId);
    const selectedPrize = allPrizes.find((p) => p.id === selectedId)!;

    return {
      success: true as const,
      prizeIndex,
      prizeName: selectedPrize.name,
      redeemCode,
      isWinning: selectedPrize.isWinning,
      deviceToken,
    };
  });

  if (result.success) {
    // 9. Set HTTP-only cookie (30 days)
    const cookieStore2 = await cookies();
    cookieStore2.set('tdg_device_token', (result as any).deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return {
      success: true,
      prizeIndex: result.prizeIndex,
      prizeName: result.prizeName,
      redeemCode: result.redeemCode,
      isWinning: result.isWinning,
    };
  }

  return result;
}

// ── Check existing spin (for initial page load) ───────────
export async function checkExistingSpin(mac: string): Promise<{
  alreadySpun: boolean;
  prizeName?: string;
  redeemCode?: string;
  isWinning?: boolean;
}> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get('tdg_device_token')?.value;

  const existingLog = await db.query.spinLogs.findFirst({
    where: existingToken
      ? (log, { or, eq: eqOp }) =>
          or(eqOp(log.macAddress, mac), eqOp(log.deviceToken, existingToken))
      : (log, { eq: eqOp }) => eqOp(log.macAddress, mac),
  });

  if (!existingLog) return { alreadySpun: false };

  const prize = await db.query.prizes.findFirst({
    where: (p, { eq: eqOp }) => eqOp(p.id, existingLog.prizeId),
  });

  return {
    alreadySpun: true,
    prizeName: prize?.name || 'Unknown',
    redeemCode: existingLog.redeemCode,
    isWinning: prize?.isWinning ?? false,
  };
}

// ── Get all prizes for wheel rendering ────────────────────
export async function getPrizes() {
  return db.select().from(prizes).orderBy(prizes.id);
}
