import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma-global';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.player) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pointType = searchParams.get('pointType') || 'TEAM'; // TEAM or CLUB
    const teamId = searchParams.get('teamId');
    const seasonId = searchParams.get('seasonId');

    // Build the where clause for filtering
    const whereClause: any = {
      pointType: pointType as 'TEAM' | 'CLUB',
    };

    // Role-based filtering
    const { role, clubId } = user.player;
    if (role !== 'ADMIN') {
      // Non-admin users can only see players from their club
      whereClause.player = {
        clubId: clubId,
      };
    }

    // Apply additional filters
    if (teamId) {
      whereClause.player = {
        ...whereClause.player,
        teamId: teamId,
      };
    }

    if (seasonId) {
      // Filter by season through game relationships
      whereClause.game = {
        team: {
          teamLeagues: {
            some: {
              league: {
                seasonId: seasonId,
              },
            },
          },
        },
      };
    }

    // Debug: Check what rule points exist
    const allRulePoints = await prisma.playerGameRulePoints.findMany({
      include: {
        player: {
          select: {
            fullName: true,
            club: { select: { name: true } }
          }
        },
        rule: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('=== LEADERBOARD DEBUG ===');
    console.log('Total rule points in DB:', allRulePoints.length);
    console.log('Point type filter:', pointType);
    console.log('Where clause:', JSON.stringify(whereClause, null, 2));
    console.log('Sample rule points:', allRulePoints.slice(0, 3));

    // Get aggregated player points
    const playerPoints = await prisma.playerGameRulePoints.groupBy({
      by: ['playerId'],
      where: whereClause,
      _sum: {
        points: true,
      },
      _count: {
        gameId: true,
      },
    });

    console.log('Filtered player points:', playerPoints.length);
    console.log('Player points data:', playerPoints);

    // Get player details and calculate leaderboard
    const leaderboardData = await Promise.all(
      playerPoints.map(async (pp, index) => {
        const player = await prisma.player.findUnique({
          where: { id: pp.playerId },
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            club: {
              select: {
                id: true,
                name: true,
              },
            },
            playingPosition: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        });

        if (!player) return null;

        // Get unique games count for this player
        const gamesCount = await prisma.playerGameRulePoints.findMany({
          where: {
            playerId: pp.playerId,
            pointType: pointType as 'TEAM' | 'CLUB',
          },
          select: {
            gameId: true,
          },
          distinct: ['gameId'],
        });

        // Get recent form (last 5 games average)
        const recentGames = await prisma.playerGameRulePoints.groupBy({
          by: ['gameId'],
          where: {
            playerId: pp.playerId,
            pointType: pointType as 'TEAM' | 'CLUB',
          },
          _sum: {
            points: true,
          },
          orderBy: {
            gameId: 'desc',
          },
          take: 5,
        });

        const totalPoints = pp._sum.points || 0;
        const gamesPlayed = gamesCount.length;
        const pointsPerGame = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
        const recentForm = recentGames.length > 0
          ? recentGames.reduce((sum, game) => sum + (game._sum.points || 0), 0) / recentGames.length
          : 0;

        return {
          playerId: player.id,
          fullName: player.fullName,
          nickname: player.nickname,
          teamName: player.team?.name || 'No Team',
          clubName: player.club.name,
          position: player.playingPosition,
          totalPoints,
          gamesPlayed,
          pointsPerGame,
          recentForm,
        };
      })
    );

    // Filter out null results and sort by total points
    const validLeaderboard = leaderboardData
      .filter(Boolean)
      .sort((a, b) => (b?.totalPoints || 0) - (a?.totalPoints || 0))
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));

    return NextResponse.json(validLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}