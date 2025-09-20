import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/prisma-global';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.player) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, clubId, teamId } = user.player;

    // Build filters based on user role
    let teamFilter = {};
    if (role === 'CAPTAIN') {
      teamFilter = { id: teamId };
    } else if (role === 'MANAGER') {
      teamFilter = { clubId };
    }
    // ADMIN and PLAYER see all (for dashboard purposes)

    // Get total players in user's scope
    const totalPlayers = await prisma.player.count({
      where: role === 'CAPTAIN'
        ? { teamId }
        : role === 'MANAGER'
        ? { clubId }
        : {} // ADMIN sees all, PLAYER sees club stats
    });

    // Get total games
    const totalGames = await prisma.game.count({
      where: {
        team: teamFilter
      }
    });

    // Get completed games count
    const completedGames = await prisma.game.count({
      where: {
        status: 'COMPLETED',
        team: teamFilter
      }
    });

    // Get total points from rule points
    const totalPointsResult = await prisma.playerGameRulePoints.aggregate({
      _sum: {
        points: true
      },
      where: {
        pointType: 'TEAM',
        game: {
          team: teamFilter
        }
      }
    });

    // Get games played for average calculation
    const gamesPlayedResult = await prisma.game.count({
      where: {
        status: 'COMPLETED',
        team: teamFilter,
        playerStats: {
          some: {}
        }
      }
    });

    // Calculate average points per game
    const totalPoints = totalPointsResult._sum.points || 0;
    const avgPointsPerGame = gamesPlayedResult > 0 ? totalPoints / gamesPlayedResult : 0;

    // Get club rank (simplified - rank within all clubs)
    const clubRankData = await prisma.playerGameRulePoints.groupBy({
      by: ['game'],
      _sum: {
        points: true
      },
      where: {
        pointType: 'CLUB'
      }
    });

    // Calculate club total points
    const clubTotalPoints = clubRankData.reduce((sum, game) => sum + (game._sum.points || 0), 0);

    // Get all club totals for ranking
    const allClubsPoints = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        teams: {
          select: {
            games: {
              select: {
                rulePoints: {
                  where: {
                    pointType: 'CLUB'
                  },
                  select: {
                    points: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate club rankings
    const clubRankings = allClubsPoints.map(club => {
      const totalPoints = club.teams.reduce((clubSum, team) => {
        return clubSum + team.games.reduce((teamSum, game) => {
          return teamSum + game.rulePoints.reduce((gameSum, point) => gameSum + point.points, 0);
        }, 0);
      }, 0);
      return { clubId: club.id, totalPoints };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    const clubRank = clubRankings.findIndex(c => c.clubId === clubId) + 1;

    // Get team rank (if user has a team)
    let teamRank = 1;
    if (teamId) {
      const teamRankData = await prisma.playerGameRulePoints.groupBy({
        by: ['game'],
        _sum: {
          points: true
        },
        where: {
          pointType: 'TEAM',
          game: {
            teamId
          }
        }
      });

      const teamTotalPoints = teamRankData.reduce((sum, game) => sum + (game._sum.points || 0), 0);

      // Get all team totals for ranking within club
      const allTeamsInClub = await prisma.team.findMany({
        where: { clubId },
        select: {
          id: true,
          games: {
            select: {
              rulePoints: {
                where: {
                  pointType: 'TEAM'
                },
                select: {
                  points: true
                }
              }
            }
          }
        }
      });

      const teamRankings = allTeamsInClub.map(team => {
        const totalPoints = team.games.reduce((sum, game) => {
          return sum + game.rulePoints.reduce((pointSum, point) => pointSum + point.points, 0);
        }, 0);
        return { teamId: team.id, totalPoints };
      }).sort((a, b) => b.totalPoints - a.totalPoints);

      teamRank = teamRankings.findIndex(t => t.teamId === teamId) + 1;
    }

    const stats = {
      totalPlayers,
      gamesPlayed: totalGames,
      completedGames,
      totalPoints,
      avgPointsPerGame,
      clubRank,
      teamRank
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}