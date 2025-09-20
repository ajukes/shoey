import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Global is used here to maintain a cached connection across hot reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const whereClause: any = {};

    if (teamId) whereClause.teamId = teamId;
    if (status) whereClause.status = status;

    if (from || to) {
      whereClause.dateTime = {};
      if (from) whereClause.dateTime.gte = new Date(from);
      if (to) whereClause.dateTime.lte = new Date(to);
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            avatar: true,
            club: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            playerStats: true
          }
        }
      },
      orderBy: {
        dateTime: 'desc'
      }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      gameTime,
      meetTime,
      venue,
      address,
      kit,
      opponent,
      teamId
    } = body;

    if (!date || !gameTime || !meetTime || !venue || !teamId) {
      return NextResponse.json({
        error: 'Date, game time, meet time, venue, and team are required'
      }, { status: 400 });
    }

    // Verify that the team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const game = await prisma.game.create({
      data: {
        dateTime: new Date(date),
        gameTime,
        meetTime,
        venue,
        address: address || null,
        kit: kit || 'HOME',
        opponent: opponent || null,
        teamId,
        status: 'SCHEDULED'
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            avatar: true,
            club: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            playerStats: true
          }
        }
      }
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}