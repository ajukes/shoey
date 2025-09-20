import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';

export async function GET() {
  try {
    const positions = await prisma.playingPosition.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}