import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma-global';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: { club: true }
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    let whereClause: any = {};

    // Role-based filtering
    if (player.role === 'ADMIN') {
      // ADMIN can see all profiles
      if (clubId) {
        whereClause.clubId = clubId;
      }
    } else {
      // MANAGER/CAPTAIN/PLAYER can only see their club's profiles
      whereClause.clubId = player.clubId;
    }

    const rulesProfiles = await prisma.rulesProfile.findMany({
      where: whereClause,
      include: {
        club: {
          select: { id: true, name: true }
        },
        rules: {
          include: {
            rule: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                pointsAwarded: true
              }
            }
          }
        },
        teams: {
          select: { id: true, name: true }
        },
        _count: {
          select: { rules: true, teams: true }
        }
      },
      orderBy: [
        { isClubDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(rulesProfiles);
  } catch (error) {
    console.error('Error fetching rules profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules profiles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: { club: true }
    });

    if (!player || !['ADMIN', 'MANAGER', 'CAPTAIN'].includes(player.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, clubId, isClubDefault, rules } = body;

    // Validate clubId access
    if (player.role !== 'ADMIN' && clubId !== player.clubId) {
      return NextResponse.json({ error: 'Cannot create profile for other clubs' }, { status: 403 });
    }

    // If setting as club default, unset existing default
    if (isClubDefault) {
      await prisma.rulesProfile.updateMany({
        where: {
          clubId: clubId,
          isClubDefault: true
        },
        data: { isClubDefault: false }
      });
    }

    const rulesProfile = await prisma.rulesProfile.create({
      data: {
        name,
        description,
        clubId,
        isClubDefault: isClubDefault || false,
        rules: rules ? {
          create: rules.map((rule: any) => ({
            ruleId: rule.ruleId,
            customPoints: rule.customPoints,
            isEnabled: rule.isEnabled !== false
          }))
        } : undefined
      },
      include: {
        club: {
          select: { id: true, name: true }
        },
        rules: {
          include: {
            rule: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                pointsAwarded: true
              }
            }
          }
        },
        _count: {
          select: { rules: true, teams: true }
        }
      }
    });

    return NextResponse.json(rulesProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating rules profile:', error);
    return NextResponse.json(
      { error: 'Failed to create rules profile' },
      { status: 500 }
    );
  }
}