import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.player) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get existing rule points for this game
    const rulePoints = await prisma.playerGameRulePoints.findMany({
      where: {
        gameId: id,
        isManual: true // Only get manual assignments that came from the wizard
      },
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            nickname: true
          }
        },
        rule: {
          select: {
            id: true,
            name: true,
            pointsAwarded: true
          }
        }
      },
      orderBy: [
        { player: { fullName: 'asc' } },
        { rule: { name: 'asc' } }
      ]
    });

    return NextResponse.json(rulePoints);
  } catch (error) {
    console.error('Error fetching game rule points:', error);
    return NextResponse.json({ error: 'Failed to fetch rule points' }, { status: 500 });
  }
}