import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

    // Fetch all global rules (rules are now global, not team-specific)
    const rules = await prisma.rule.findMany({
      include: {
        conditions: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
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

    // Only ADMIN can create new global rules
    if (!player || player.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create global rules' }, { status: 403 });
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

    // Check if rule name already exists
    const existingRule = await prisma.rule.findFirst({
      where: { name: name.trim() }
    });

    if (existingRule) {
      return NextResponse.json({
        error: 'A rule with this name already exists'
      }, { status: 400 });
    }

    const rule = await prisma.rule.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category,
        pointsAwarded,
        isMultiplier: isMultiplier || false,
        targetScope: targetScope || 'PLAYER',
        targetPositions: targetPositions || [],
        isActive: isActive !== false,
        conditions: conditions && Array.isArray(conditions) && conditions.length > 0 ? {
          create: conditions.map((condition: any) => ({
            variable: condition.variable,
            operator: condition.operator,
            value: condition.value,
            compareVariable: condition.compareVariable || null,
            scope: condition.scope || 'GAME'
          }))
        } : undefined
      },
      include: {
        conditions: true
      }
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}