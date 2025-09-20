import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { RulesEngine } from '@/lib/rules-engine';
import {
  RuleEvaluationContext,
  GameVariables,
  PlayerVariables,
  PositionCategory
} from '@/types/rules';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.player) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            club: true
          }
        },
        gamePlayers: {
          include: {
            player: {
              include: {
                playingPosition: true
              }
            }
          }
        },
        playerStats: true
      }
    });

    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if user can administer this game
    const { role, clubId, teamId } = user.player;
    const canAdminister =
      role === 'ADMIN' ||
      (role === 'MANAGER' && existingGame.team.clubId === clubId) ||
      (role === 'CAPTAIN' && existingGame.teamId === teamId);

    if (!canAdminister) {
      return NextResponse.json({
        error: 'You do not have permission to complete this game'
      }, { status: 403 });
    }

    // Allow re-completion of completed games
    const isRecompletion = existingGame.status === 'COMPLETED';
    if (isRecompletion) {
      console.log('Re-completing game:', id);
    }

    const { playerStats, goalsFor, goalsAgainst, status } = body;

    // Validate required completion data
    if (!playerStats || status !== 'COMPLETED') {
      return NextResponse.json({
        error: 'Player stats and completed status are required'
      }, { status: 400 });
    }

    // Start transaction for game completion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update game with final score and status
      const updatedGame = await tx.game.update({
        where: { id },
        data: {
          goalsFor: goalsFor || 0,
          goalsAgainst: goalsAgainst || 0,
          status: 'COMPLETED'
        }
      });

      // 2. Clear existing player stats and rule points (in case of recompletion)
      await tx.gamePlayerStats.deleteMany({
        where: { gameId: id }
      });

      await tx.playerGameRulePoints.deleteMany({
        where: { gameId: id }
      });

      // 3. Create player stats
      const statsData = playerStats.map((stat: any) => ({
        gameId: id,
        playerId: stat.playerId,
        goalsScored: stat.goalsScored || 0,
        goalAssists: stat.goalAssists || 0,
        greenCards: stat.greenCards || 0,
        yellowCards: stat.yellowCards || 0,
        redCards: stat.redCards || 0,
        saves: stat.saves || 0,
        tackles: stat.tackles || 0,
        passes: stat.passes || 0,
        played: stat.played !== false // Default to true unless explicitly set to false
      }));

      await tx.gamePlayerStats.createMany({
        data: statsData
      });

      // 4. Get team and club rules profiles
      const teamProfile = existingGame.team.defaultRulesProfileId
        ? await tx.rulesProfile.findUnique({
            where: {
              id: existingGame.team.defaultRulesProfileId,
              isActive: true
            },
            include: {
              rules: {
                where: { isEnabled: true },
                include: {
                  rule: {
                    include: {
                      conditions: true
                    }
                  }
                }
              }
            }
          })
        : null;

      const clubProfile = await tx.rulesProfile.findFirst({
        where: {
          clubId: existingGame.team.club.id,
          isClubDefault: true,
          isActive: true
        },
        include: {
          rules: {
            where: { isEnabled: true },
            include: {
              rule: {
                include: {
                  conditions: true
                }
              }
            }
          }
        }
      });

      // 5. Prepare rule evaluation context
      const gameVariables: GameVariables = {
        goalsFor: goalsFor || 0,
        goalsAgainst: goalsAgainst || 0
      };

      const playerVariables: PlayerVariables[] = playerStats.map((stat: any) => {
        const gamePlayer = existingGame.gamePlayers.find(gp => gp.playerId === stat.playerId);
        const position = gamePlayer?.player?.playingPosition?.category as PositionCategory || PositionCategory.MIDFIELDER;

        return {
          playerId: stat.playerId,
          goalsScored: stat.goalsScored || 0,
          goalAssists: stat.goalAssists || 0,
          greenCards: stat.greenCards || 0,
          yellowCards: stat.yellowCards || 0,
          redCards: stat.redCards || 0,
          saves: stat.saves || 0,
          tackles: stat.tackles || 0,
          passes: stat.passes || 0,
          position,
          played: stat.played !== false // Default to true unless explicitly set to false
        };
      });

      const evaluationContext: RuleEvaluationContext = {
        gameVariables,
        playerVariables
      };

      // 6. Process manual rule assignments from wizard
      const manualRulePoints: any[] = [];

      for (const stat of playerStats) {
        if (stat.ruleAssignments && stat.ruleAssignments.length > 0) {
          for (const assignment of stat.ruleAssignments) {
            // Create TEAM points
            if (teamProfile) {
              manualRulePoints.push({
                playerId: stat.playerId,
                gameId: id,
                ruleId: assignment.ruleId,
                points: assignment.points,
                pointType: 'TEAM' as const,
                profileId: teamProfile.id,
                isManual: true,
                notes: `Manual assignment: ${assignment.count} instances`
              });
            }

            // Create CLUB points
            if (clubProfile) {
              manualRulePoints.push({
                playerId: stat.playerId,
                gameId: id,
                ruleId: assignment.ruleId,
                points: assignment.points,
                pointType: 'CLUB' as const,
                profileId: clubProfile.id,
                isManual: true,
                notes: `Manual assignment: ${assignment.count} instances`
              });
            }
          }
        }
      }

      // Save manual rule points
      if (manualRulePoints.length > 0) {
        await tx.playerGameRulePoints.createMany({
          data: manualRulePoints
        });
        console.log('Created manual rule points:', manualRulePoints.length);
      } else {
        console.log('No manual rule assignments to process');
      }

      return updatedGame;
    });

    // 8. Return completed game with all data
    const completedGame = await prisma.game.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            club: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        playerStats: {
          include: {
            player: {
              select: {
                id: true,
                fullName: true,
                nickname: true
              }
            }
          }
        },
        rulePoints: {
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
                name: true
              }
            },
            profile: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(completedGame);
  } catch (error) {
    console.error('Error completing game:', error);
    return NextResponse.json(
      { error: 'Failed to complete game' },
      { status: 500 }
    );
  }
}

