import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma-global';

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

    const rule = await prisma.rule.findUnique({
      where: { id },
      include: {
        conditions: true
      }
    });

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error fetching rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rule' },
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

    // Only ADMIN can update global rules
    if (!player || player.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update global rules' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      pointsAwarded,
      isMultiplier,
      targetScope,
      targetPositions,
      isActive,
      conditions
    } = body;

    // Validate required fields
    if (!name?.trim() || !category || pointsAwarded === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if another rule with this name exists (excluding current rule)
    const existingRule = await prisma.rule.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (existingRule) {
      return NextResponse.json({
        error: 'A rule with this name already exists'
      }, { status: 400 });
    }

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category,
        pointsAwarded,
        isMultiplier: isMultiplier || false,
        targetScope: targetScope || 'ALL_PLAYERS',
        targetPositions: targetPositions || [],
        isActive: isActive !== false,
        conditions: {
          // Delete existing conditions and create new ones
          deleteMany: {},
          create: conditions && Array.isArray(conditions) && conditions.length > 0 ?
            conditions.map((condition: any) => ({
              variable: condition.variable,
              operator: condition.operator,
              value: condition.value,
              compareVariable: condition.compareVariable || null,
              scope: condition.scope || 'GAME'
            })) : []
        }
      },
      include: {
        conditions: true
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      { error: 'Failed to update rule' },
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

    // Only ADMIN can delete global rules
    if (!player || player.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete global rules' }, { status: 403 });
    }

    // Check if rule exists
    const existingRule = await prisma.rule.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rulesProfileRules: true
          }
        }
      }
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Check if rule is being used in any rules profiles
    if (existingRule._count.rulesProfileRules > 0) {
      return NextResponse.json({
        error: `Cannot delete rule - it is being used in ${existingRule._count.rulesProfileRules} rules profiles`
      }, { status: 400 });
    }

    await prisma.rule.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}