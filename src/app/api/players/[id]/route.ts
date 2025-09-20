import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, PlayerRole } from '@prisma/client';
import { getAuthenticatedUser, getUserScope, canManageClub, isAdmin } from '@/lib/auth';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const scope = getUserScope(user);

    const whereClause: any = { id };

    // Non-admin users can only view players from their club
    if (!scope.isAdmin) {
      whereClause.clubId = scope.clubId;
    }

    const player = await prisma.player.findFirst({
      where: whereClause,
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        playingPosition: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !canManageClub(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      fullName,
      nickname,
      email,
      mobileNumber,
      avatar,
      role,
      clubId,
      teamId,
      playingPositionId,
    } = body;

    const scope = getUserScope(user);

    // Find the existing player with scope validation
    const existingPlayer = await prisma.player.findFirst({
      where: {
        id,
        ...(scope.isAdmin ? {} : { clubId: scope.clubId }),
      },
    });

    if (!existingPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Non-admin users can only update players from their club
    if (!scope.isAdmin && existingPlayer.clubId !== scope.clubId) {
      return NextResponse.json({ error: 'You can only update players from your club' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (nickname !== undefined) updateData.nickname = nickname || null;
    if (email !== undefined) {
      // Check if email is already taken by another player
      const emailTaken = await prisma.player.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (emailTaken) {
        return NextResponse.json({ error: 'Email already taken' }, { status: 409 });
      }

      updateData.email = email;
    }
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;

    // Handle role updates with special permissions
    if (role !== undefined && Object.values(PlayerRole).includes(role)) {
      // Only admins can assign admin role
      if (role === PlayerRole.ADMIN && !scope.isAdmin) {
        return NextResponse.json({ error: 'Only admins can assign admin role' }, { status: 403 });
      }

      // Special handling for juk3sie@gmail.com - always admin
      if (email === 'juk3sie@gmail.com' || existingPlayer.email === 'juk3sie@gmail.com') {
        updateData.role = PlayerRole.ADMIN;
      } else {
        updateData.role = role;
      }
    }

    // Handle club/team updates
    if (clubId !== undefined) {
      if (!scope.isAdmin && clubId !== scope.clubId) {
        return NextResponse.json({ error: 'You can only move players to your club' }, { status: 403 });
      }

      const clubExists = await prisma.club.findUnique({ where: { id: clubId } });
      if (!clubExists) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 });
      }

      updateData.clubId = clubId;
    }

    if (teamId !== undefined) {
      const teamExists = await prisma.team.findUnique({ where: { id: teamId } });
      if (!teamExists) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      updateData.teamId = teamId;
    }

    if (playingPositionId !== undefined) {
      const positionExists = await prisma.playingPosition.findUnique({ where: { id: playingPositionId } });
      if (!positionExists) {
        return NextResponse.json({ error: 'Playing position not found' }, { status: 404 });
      }

      updateData.playingPositionId = playingPositionId;
    }

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: updateData,
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        playingPosition: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !canManageClub(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const scope = getUserScope(user);

    // Find the existing player with scope validation
    const existingPlayer = await prisma.player.findFirst({
      where: {
        id,
        ...(scope.isAdmin ? {} : { clubId: scope.clubId }),
      },
    });

    if (!existingPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Prevent deletion of juk3sie@gmail.com
    if (existingPlayer.email === 'juk3sie@gmail.com') {
      return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 403 });
    }

    await prisma.player.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}