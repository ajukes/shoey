import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Global is used here to maintain a cached connection across hot reloads
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
    const { id: teamId } = await params;

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, clubId: true }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get all players from the same club as the team
    // This allows for cross-team selection within the same club
    const players = await prisma.player.findMany({
      where: {
        clubId: team.clubId
      },
      include: {
        playingPosition: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // ADMIN, CAPTAIN, MANAGER, PLAYER
        { fullName: 'asc' }
      ]
    });

    // Transform the data to match frontend interface
    const transformedPlayers = players.map(player => ({
      id: player.id,
      fullName: player.fullName,
      nickname: player.nickname,
      email: player.email,
      avatar: player.avatar,
      role: player.role,
      playingPosition: player.playingPosition,
      preferredTeam: player.team,
      isPreferredTeam: player.teamId === teamId
    }));

    return NextResponse.json(transformedPlayers);
  } catch (error) {
    console.error('Error fetching team players:', error);
    return NextResponse.json({ error: 'Failed to fetch team players' }, { status: 500 });
  }
}