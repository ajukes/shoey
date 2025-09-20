import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, teamId: true }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get current squad for this game
    const squad = await prisma.gamePlayer.findMany({
      where: {
        gameId: gameId,
        isSquad: true
      },
      include: {
        player: {
          include: {
            playingPosition: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        player: {
          fullName: 'asc'
        }
      }
    });

    return NextResponse.json(squad);
  } catch (error) {
    console.error('Error fetching game squad:', error);
    return NextResponse.json({ error: 'Failed to fetch game squad' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;
    const body = await request.json();
    const { playerIds } = body;

    if (!Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'playerIds must be an array' }, { status: 400 });
    }

    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, teamId: true }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Verify all players belong to the game's team (or club for flexibility)
    if (playerIds.length > 0) {
      const players = await prisma.player.findMany({
        where: {
          id: { in: playerIds },
          // Players can be from the same club but different teams
          club: {
            teams: {
              some: {
                id: game.teamId
              }
            }
          }
        },
        select: { id: true }
      });

      if (players.length !== playerIds.length) {
        return NextResponse.json({
          error: 'Some players do not belong to the same club as the game team'
        }, { status: 400 });
      }
    }

    // Use a transaction to update the squad
    await prisma.$transaction(async (tx) => {
      // Remove all current squad members for this game
      await tx.gamePlayer.deleteMany({
        where: {
          gameId: gameId
        }
      });

      // Add new squad members
      if (playerIds.length > 0) {
        await tx.gamePlayer.createMany({
          data: playerIds.map((playerId: string) => ({
            gameId: gameId,
            playerId: playerId,
            teamId: game.teamId,
            isSquad: true
          }))
        });
      }
    });

    // Fetch and return the updated squad
    const updatedSquad = await prisma.gamePlayer.findMany({
      where: {
        gameId: gameId,
        isSquad: true
      },
      include: {
        player: {
          include: {
            playingPosition: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        player: {
          fullName: 'asc'
        }
      }
    });

    return NextResponse.json(updatedSquad);
  } catch (error) {
    console.error('Error updating game squad:', error);
    return NextResponse.json({ error: 'Failed to update game squad' }, { status: 500 });
  }
}