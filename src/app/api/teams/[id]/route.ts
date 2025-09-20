import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, avatar, clubId, leagueIds, defaultRulesProfileId } = body;

    // Check if the team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id }
    });

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // If club is being changed, verify it exists
    if (clubId && clubId !== existingTeam.clubId) {
      const club = await prisma.club.findUnique({ where: { id: clubId } });
      if (!club) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 });
      }
    }

    // If leagues are being changed, verify they all exist
    if (leagueIds) {
      if (leagueIds.length === 0) {
        return NextResponse.json({ error: 'At least one league is required' }, { status: 400 });
      }

      const leagues = await prisma.league.findMany({
        where: { id: { in: leagueIds } }
      });
      if (leagues.length !== leagueIds.length) {
        return NextResponse.json({ error: 'One or more leagues not found' }, { status: 404 });
      }
    }

    // Validate rules profile if provided
    if (defaultRulesProfileId !== undefined) {
      if (defaultRulesProfileId) {
        const finalClubId = clubId || existingTeam.clubId;
        const rulesProfile = await prisma.rulesProfile.findFirst({
          where: {
            id: defaultRulesProfileId,
            clubId: finalClubId
          }
        });
        if (!rulesProfile) {
          return NextResponse.json({ error: 'Rules profile not found or does not belong to the team\'s club' }, { status: 404 });
        }
      }
    }

    // Update the team using a transaction to handle league relationships
    const updatedTeam = await prisma.$transaction(async (tx) => {
      // Update basic team data
      const team = await tx.team.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(avatar !== undefined && { avatar: avatar || null }),
          ...(clubId && { clubId }),
          ...(defaultRulesProfileId !== undefined && { defaultRulesProfileId: defaultRulesProfileId || null })
        }
      });

      // If leagues are being updated, replace all team-league relationships
      if (leagueIds) {
        // Delete existing team-league relationships
        await tx.teamLeague.deleteMany({
          where: { teamId: id }
        });

        // Create new team-league relationships
        await tx.teamLeague.createMany({
          data: leagueIds.map((leagueId: string) => ({
            teamId: id,
            leagueId
          }))
        });
      }

      // Fetch the updated team with all relationships
      return await tx.team.findUnique({
        where: { id },
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
    });

    // Transform the data to match the frontend interface
    const transformedTeam = {
      ...updatedTeam,
      playersCount: updatedTeam!._count.players,
      gamesPlayed: updatedTeam!._count.games,
      leagues: updatedTeam!.teamLeagues.map(tl => tl.league),
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0
    };

    return NextResponse.json(transformedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if the team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            players: true,
            games: true
          }
        }
      }
    });

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if there are any players or games for this team
    if (existingTeam._count.players > 0) {
      return NextResponse.json({ 
        error: `Cannot delete team with ${existingTeam._count.players} players. Please move or delete all players first.` 
      }, { status: 409 });
    }

    if (existingTeam._count.games > 0) {
      return NextResponse.json({ 
        error: `Cannot delete team with ${existingTeam._count.games} games. Please delete all game records first.` 
      }, { status: 409 });
    }

    await prisma.team.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}