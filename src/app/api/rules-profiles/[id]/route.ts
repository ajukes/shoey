import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const rulesProfile = await prisma.rulesProfile.findUnique({
      where: { id },
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
                pointsAwarded: true,
                isMultiplier: true,
                targetScope: true,
                targetPositions: true
              }
            }
          },
          orderBy: { rule: { name: 'asc' } }
        },
        teams: {
          select: { id: true, name: true }
        },
        _count: {
          select: { rules: true, teams: true }
        }
      }
    });

    if (!rulesProfile) {
      return NextResponse.json({ error: 'Rules profile not found' }, { status: 404 });
    }

    // Check access permissions
    if (player.role !== 'ADMIN' && rulesProfile.clubId !== player.clubId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(rulesProfile);
  } catch (error) {
    console.error('Error fetching rules profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existingProfile = await prisma.rulesProfile.findUnique({
      where: { id },
      select: { clubId: true, isClubDefault: true }
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Rules profile not found' }, { status: 404 });
    }

    // Check access permissions
    if (player.role !== 'ADMIN' && existingProfile.clubId !== player.clubId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isClubDefault, rules } = body;

    // If setting as club default, unset existing default
    if (isClubDefault && !existingProfile.isClubDefault) {
      await prisma.rulesProfile.updateMany({
        where: {
          clubId: existingProfile.clubId,
          isClubDefault: true,
          id: { not: id }
        },
        data: { isClubDefault: false }
      });
    }

    const rulesProfile = await prisma.rulesProfile.update({
      where: { id },
      data: {
        name,
        description,
        isClubDefault: isClubDefault || false,
        rules: rules ? {
          deleteMany: {},
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

    return NextResponse.json(rulesProfile);
  } catch (error) {
    console.error('Error updating rules profile:', error);
    return NextResponse.json(
      { error: 'Failed to update rules profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: { club: true }
    });

    if (!player || !['ADMIN', 'MANAGER'].includes(player.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existingProfile = await prisma.rulesProfile.findUnique({
      where: { id },
      select: { clubId: true, isClubDefault: true }
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Rules profile not found' }, { status: 404 });
    }

    // Check access permissions
    if (player.role !== 'ADMIN' && existingProfile.clubId !== player.clubId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prevent deletion of club default profile
    if (existingProfile.isClubDefault) {
      return NextResponse.json({
        error: 'Cannot delete club default profile'
      }, { status: 400 });
    }

    // Check if any teams are using this profile
    const teamsUsingProfile = await prisma.team.count({
      where: { defaultRulesProfileId: id }
    });

    if (teamsUsingProfile > 0) {
      return NextResponse.json({
        error: `Cannot delete profile - ${teamsUsingProfile} teams are using it`
      }, { status: 400 });
    }

    await prisma.rulesProfile.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Rules profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting rules profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete rules profile' },
      { status: 500 }
    );
  }
}