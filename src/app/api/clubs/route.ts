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
    const clubs = await prisma.club.findMany({
      include: {
        _count: {
          select: {
            teams: true,
            players: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the frontend interface
    const transformedClubs = clubs.map(club => ({
      ...club,
      teamsCount: club._count.teams,
      playersCount: club._count.players
    }));

    return NextResponse.json(transformedClubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar, location, founded, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Club name is required' }, { status: 400 });
    }

    const club = await prisma.club.create({
      data: {
        name,
        avatar: avatar || null,
        location: location || null,
        founded: founded ? parseInt(founded) : null,
        description: description || null
      },
      include: {
        _count: {
          select: {
            teams: true,
            players: true
          }
        }
      }
    });

    // Transform the data to match the frontend interface
    const transformedClub = {
      ...club,
      teamsCount: club._count.teams,
      playersCount: club._count.players
    };

    return NextResponse.json(transformedClub, { status: 201 });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }
}