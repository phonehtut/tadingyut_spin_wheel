'use server';

import { db } from '@/src/db';
import { prizes, spinLogs } from '@/src/db/schema';
import { eq, or, like, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// ── Auth ────────────────────────────────────────────────
export async function adminLogin(password: string): Promise<boolean> {
  const valid = password === process.env.ADMIN_PASSWORD;
  if (valid) {
    const cookieStore = await cookies();
    const token = crypto.randomBytes(32).toString('hex');
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
      maxAge: 60 * 60 * 4, // 4 hours
    });
    // Store token in env-like check (simple approach: hash the password)
    cookieStore.set('admin_token_hash', crypto.createHash('sha256').update(password).digest('hex'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
      maxAge: 60 * 60 * 4,
    });
  }
  return valid;
}

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const hash = cookieStore.get('admin_token_hash')?.value;
  if (!hash) return false;
  const expected = crypto
    .createHash('sha256')
    .update(process.env.ADMIN_PASSWORD || '')
    .digest('hex');
  return hash === expected;
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  cookieStore.delete('admin_token_hash');
}

// ── Prize Management ────────────────────────────────────
export async function getAllPrizes() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error('Unauthorized');
  return db.select().from(prizes).orderBy(prizes.id);
}

export async function updatePrize(
  id: number,
  data: { name?: string; totalQty?: number; remainingQty?: number; weight?: number; color?: string; isWinning?: boolean }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  await db.update(prizes).set(data).where(eq(prizes.id, id));
  return getAllPrizes();
}

export async function addPrize(data: {
  name: string;
  totalQty: number;
  remainingQty: number;
  weight: number;
  color: string;
  isWinning: boolean;
}) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  await db.insert(prizes).values(data);
  return getAllPrizes();
}

export async function deletePrize(id: number) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  await db.delete(prizes).where(eq(prizes.id, id));
  return getAllPrizes();
}

// ── Spin Log Management ─────────────────────────────────
export async function getSpinLogs(search?: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    const logs = await db
      .select({
        id: spinLogs.id,
        macAddress: spinLogs.macAddress,
        ipAddress: spinLogs.ipAddress,
        prizeId: spinLogs.prizeId,
        redeemCode: spinLogs.redeemCode,
        isRedeemed: spinLogs.isRedeemed,
        createdAt: spinLogs.createdAt,
        prizeName: prizes.name,
      })
      .from(spinLogs)
      .leftJoin(prizes, eq(spinLogs.prizeId, prizes.id))
      .where(
        or(
          like(spinLogs.redeemCode, term),
          like(spinLogs.macAddress, term)
        )
      )
      .orderBy(desc(spinLogs.createdAt))
      .limit(100);
    return logs;
  }

  const logs = await db
    .select({
      id: spinLogs.id,
      macAddress: spinLogs.macAddress,
      ipAddress: spinLogs.ipAddress,
      prizeId: spinLogs.prizeId,
      redeemCode: spinLogs.redeemCode,
      isRedeemed: spinLogs.isRedeemed,
      createdAt: spinLogs.createdAt,
      prizeName: prizes.name,
    })
    .from(spinLogs)
    .leftJoin(prizes, eq(spinLogs.prizeId, prizes.id))
    .orderBy(desc(spinLogs.createdAt))
    .limit(100);
  return logs;
}

export async function markRedeemed(logId: number) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  await db
    .update(spinLogs)
    .set({ isRedeemed: true })
    .where(eq(spinLogs.id, logId));
  return getSpinLogs();
}

// ── Stats ──────────────────────────────────────────────
export async function getStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error('Unauthorized');

  const allPrizes = await db.select().from(prizes).orderBy(prizes.id);
  const allLogs = await db
    .select({
      id: spinLogs.id,
      macAddress: spinLogs.macAddress,
      ipAddress: spinLogs.ipAddress,
      prizeId: spinLogs.prizeId,
      redeemCode: spinLogs.redeemCode,
      isRedeemed: spinLogs.isRedeemed,
      createdAt: spinLogs.createdAt,
      prizeName: prizes.name,
    })
    .from(spinLogs)
    .leftJoin(prizes, eq(spinLogs.prizeId, prizes.id))
    .orderBy(desc(spinLogs.createdAt));

  return {
    totalSpins: allLogs.length,
    totalRedeemed: allLogs.filter((l) => l.isRedeemed).length,
    prizes: allPrizes,
    recentLogs: allLogs.slice(0, 20),
  };
}
