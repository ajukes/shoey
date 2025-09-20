import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, PlayerRole } from '@prisma/client';
import { getAuthenticatedUser, getUserScope, canManageClub } from '@/lib/auth';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const teamId = searchParams.get('teamId');
    const role = searchParams.get('role');

    const scope = getUserScope(user);
    const whereClause: any = {};

    // Apply role-based filtering
    if (!scope.isAdmin) {
      // Non-admin users can only see players from their club
      whereClause.clubId = scope.clubId;
    }

    // Apply additional filters
    if (clubId && (scope.isAdmin || clubId === scope.clubId)) {
      whereClause.clubId = clubId;
    }

    if (teamId) {
      whereClause.teamId = teamId;
    }

    if (role && Object.values(PlayerRole).includes(role as PlayerRole)) {
      whereClause.role = role;
    }

    const players = await prisma.player.findMany({
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
      orderBy: [
        { role: 'asc' },
        { fullName: 'asc' },
      ],
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !canManageClub(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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

    // Validate required fields
    if (!fullName || !clubId || !teamId || !playingPositionId) {
      return NextResponse.json({
        error: 'Full name, club, team, and playing position are required'
      }, { status: 400 });
    }

    const scope = getUserScope(user);

    // Non-admin users can only create players for their club
    if (!scope.isAdmin && clubId !== scope.clubId) {
      return NextResponse.json({ error: 'You can only create players for your club' }, { status: 403 });
    }

    // Verify that the club, team, and position exist
    const [clubExists, teamExists, positionExists] = await Promise.all([
      prisma.club.findUnique({ where: { id: clubId } }),
      prisma.team.findUnique({ where: { id: teamId } }),
      prisma.playingPosition.findUnique({ where: { id: playingPositionId } }),
    ]);

    if (!clubExists) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (!teamExists) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!positionExists) {
      return NextResponse.json({ error: 'Playing position not found' }, { status: 404 });
    }

    // Check if email is already taken (only if email provided)
    if (email) {
      const existingPlayer = await prisma.player.findUnique({
        where: { email },
      });

      if (existingPlayer) {
        return NextResponse.json({ error: 'Email already taken' }, { status: 409 });
      }
    }

    // Validate role - non-admin users can't create admin players
    const validRole = role && Object.values(PlayerRole).includes(role) ? role : PlayerRole.PLAYER;
    if (!scope.isAdmin && validRole === PlayerRole.ADMIN) {
      return NextResponse.json({ error: 'You cannot create admin players' }, { status: 403 });
    }

    // Special handling for juk3sie@gmail.com
    const finalRole = email === 'juk3sie@gmail.com' ? PlayerRole.ADMIN : validRole;

    const player = await prisma.player.create({
      data: {
        fullName,
        nickname: nickname || null,
        email: email || null,
        mobileNumber: mobileNumber || null,
        avatar: avatar || null,
        role: finalRole,
        clubId,
        teamId,
        playingPositionId,
      },
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

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
  }
}

