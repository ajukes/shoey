import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const game = await prisma.game.findUnique({
      where: { id },
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
        gamePlayers: {
          include: {
            player: {
              select: {
                id: true,
                fullName: true,
                nickname: true,
                avatar: true
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
        _count: {
          select: {
            playerStats: true,
            gamePlayers: true
          }
        }
      }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user || !user.player) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
        }
      }
    });

    if (!existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Simple permission check - ADMIN can do everything
    const { role, clubId, teamId } = user.player;

    if (role !== 'ADMIN') {
      // MANAGER can edit games for their club
      if (role === 'MANAGER' && existingGame.team.clubId !== clubId) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      // CAPTAIN can only edit games for their team
      if (role === 'CAPTAIN' && existingGame.teamId !== teamId) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      // PLAYER cannot edit games
      if (role === 'PLAYER') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    const updateData: any = {};

    // Only include fields that are provided in the request
    if (body.date !== undefined) updateData.dateTime = new Date(body.date);
    if (body.gameTime !== undefined) updateData.gameTime = body.gameTime;
    if (body.meetTime !== undefined) updateData.meetTime = body.meetTime;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.kit !== undefined) updateData.kit = body.kit;
    if (body.homeAway !== undefined) updateData.homeAway = body.homeAway;
    if (body.opponent !== undefined) updateData.opponent = body.opponent;
    if (body.goalsFor !== undefined) updateData.goalsFor = body.goalsFor;
    if (body.goalsAgainst !== undefined) updateData.goalsAgainst = body.goalsAgainst;
    if (body.status !== undefined) updateData.status = body.status;

    const game = await prisma.game.update({
      where: { id },
      data: updateData,
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
            playerStats: true,
            gamePlayers: true
          }
        }
      }
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user || !user.player || user.player.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Delete related records first
    await prisma.playerGameRulePoints.deleteMany({
      where: { gameId: id }
    });

    await prisma.gamePlayerStats.deleteMany({
      where: { gameId: id }
    });

    await prisma.gamePlayer.deleteMany({
      where: { gameId: id }
    });

    // Delete the game
    await prisma.game.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}