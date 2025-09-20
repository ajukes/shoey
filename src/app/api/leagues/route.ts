import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';

export async function GET(request: NextRequest) {
  try {
    const leagues = await prisma.league.findMany({
      include: {
        season: {
          select: {
            id: true,
            name: true,
            year: true,
            sport: true,
            startDate: true,
            endDate: true
          }
        },
        _count: {
          select: {
            teamLeagues: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the frontend interface
    const transformedLeagues = leagues.map(league => ({
      ...league,
      teamsCount: league._count.teamLeagues
    }));

    return NextResponse.json(transformedLeagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sport, seasonId, location, image } = body;

    if (!name || !sport || !seasonId) {
      return NextResponse.json({ error: 'Name, sport, and season are required' }, { status: 400 });
    }

    // Verify that the season exists
    const season = await prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    const league = await prisma.league.create({
      data: {
        name,
        sport,
        seasonId,
        location: location || null,
        image: image || null
      },
      include: {
        season: {
          select: {
            id: true,
            name: true,
            year: true,
            sport: true,
            startDate: true,
            endDate: true
          }
        },
        _count: {
          select: {
            teamLeagues: true
          }
        }
      }
    });

    // Transform the data to match the frontend interface
    const transformedLeague = {
      ...league,
      teamsCount: league._count.teamLeagues
    };

    return NextResponse.json(transformedLeague, { status: 201 });
  } catch (error) {
    console.error('Error creating league:', error);
    return NextResponse.json({ error: 'Failed to create league' }, { status: 500 });
  }
}