import { db } from '@/src/db';
import { prizes } from '@/src/db/schema';
import { NextResponse } from 'next/server';

const DEFAULT_PRIZES = [
  {
    name: '1000 Ks Off',
    totalQty: 20,
    remainingQty: 20,
    weight: 10,
    color: '#FFD700',
    isWinning: true,
  },
  {
    name: 'Free Drink 🥤',
    totalQty: 15,
    remainingQty: 15,
    weight: 8,
    color: '#FF6B35',
    isWinning: true,
  },
  {
    name: '500 Ks Off',
    totalQty: 30,
    remainingQty: 30,
    weight: 15,
    color: '#E8453C',
    isWinning: true,
  },
  {
    name: 'Thank You 🙏',
    totalQty: 9999,
    remainingQty: 9999,
    weight: 40,
    color: '#8B4513',
    isWinning: false,
  },
  {
    name: 'Free WiFi 1hr 📶',
    totalQty: 25,
    remainingQty: 25,
    weight: 12,
    color: '#DC143C',
    isWinning: true,
  },
  {
    name: '2000 Ks Off 🎉',
    totalQty: 5,
    remainingQty: 5,
    weight: 3,
    color: '#B8860B',
    isWinning: true,
  },
  {
    name: 'Try Again ✨',
    totalQty: 9999,
    remainingQty: 9999,
    weight: 35,
    color: '#A0522D',
    isWinning: false,
  },
  {
    name: 'Snack Voucher 🍿',
    totalQty: 10,
    remainingQty: 10,
    weight: 7,
    color: '#CD853F',
    isWinning: true,
  },
];

export async function POST(request: Request) {
  // Simple auth check
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.insert(prizes).values(DEFAULT_PRIZES);
    return NextResponse.json({ success: true, message: 'Prizes seeded successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Seeding failed', details: String(error) },
      { status: 500 }
    );
  }
}
