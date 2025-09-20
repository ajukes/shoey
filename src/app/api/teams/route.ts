import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    const whereClause: any = {};
    if (clubId) whereClause.clubId = clubId;

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        teamLeagues: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
                sport: true,
                season: {
                  select: {
                    id: true,
                    name: true,
                    year: true,
                    sport: true,
                    startDate: true,
                    endDate: true
                  }
                }
              }
            }
          }
        },
        defaultRulesProfile: {
          select: {
            id: true,
            name: true,
            isClubDefault: true
          }
        },
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the frontend interface
    const transformedTeams = teams.map(team => ({
      ...team,
      playersCount: team._count.players,
      gamesPlayed: team._count.games,
      // Get all leagues for the team
      leagues: team.teamLeagues.map(tl => tl.league),
      // These would come from game results in a real implementation
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0
    }));

    return NextResponse.json(transformedTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar, clubId, leagueIds, defaultRulesProfileId } = body;

    if (!name || !clubId) {
      return NextResponse.json({ error: 'Name and club are required' }, { status: 400 });
    }

    if (!leagueIds || leagueIds.length === 0) {
      return NextResponse.json({ error: 'At least one league is required' }, { status: 400 });
    }

    // Verify that the club exists
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Verify that all leagues exist
    const leagues = await prisma.league.findMany({
      where: { id: { in: leagueIds } }
    });
    if (leagues.length !== leagueIds.length) {
      return NextResponse.json({ error: 'One or more leagues not found' }, { status: 404 });
    }

    // Validate rules profile if provided
    if (defaultRulesProfileId) {
      const rulesProfile = await prisma.rulesProfile.findFirst({
        where: {
          id: defaultRulesProfileId,
          clubId: clubId
        }
      });
      if (!rulesProfile) {
        return NextResponse.json({ error: 'Rules profile not found or does not belong to the selected club' }, { status: 404 });
      }
    }

    // Create team with league relationships
    const team = await prisma.team.create({
      data: {
        name,
        avatar: avatar || null,
        clubId,
        defaultRulesProfileId: defaultRulesProfileId || null,
        teamLeagues: {
          create: leagueIds.map((leagueId: string) => ({
            leagueId
          }))
        }
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        teamLeagues: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
                sport: true,
                season: {
                  select: {
                    id: true,
                    name: true,
                    year: true,
                    sport: true,
                    startDate: true,
                    endDate: true
                  }
                }
              }
            }
          }
        },
        defaultRulesProfile: {
          select: {
            id: true,
            name: true,
            isClubDefault: true
          }
        },
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      }
    });

    // Transform the data to match the frontend interface
    const transformedTeam = {
      ...team,
      playersCount: team._count.players,
      gamesPlayed: team._count.games,
      leagues: team.teamLeagues.map(tl => tl.league),
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0
    };

    return NextResponse.json(transformedTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}