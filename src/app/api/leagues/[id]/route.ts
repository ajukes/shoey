import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sport, season, location, startDate, endDate, isActive, image } = body;

    // Check if the league exists
    const existingLeague = await prisma.league.findUnique({
      where: { id }
    });

    if (!existingLeague) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    const updatedLeague = await prisma.league.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sport && { sport }),
        ...(season && { season }),
        ...(location !== undefined && { location: location || null }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isActive !== undefined && { isActive }),
        ...(image !== undefined && { image: image || null })
      },
      include: {
        _count: {
          select: {
            teamLeagues: true
          }
        }
      }
    });

    // Transform the data to match the frontend interface
    const transformedLeague = {
      ...updatedLeague,
      teamsCount: updatedLeague._count.teamLeagues
    };

    return NextResponse.json(transformedLeague);
  } catch (error) {
    console.error('Error updating league:', error);
    return NextResponse.json({ error: 'Failed to update league' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if the league exists
    const existingLeague = await prisma.league.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            teamLeagues: true
          }
        }
      }
    });

    if (!existingLeague) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Check if there are any teams in this league
    if (existingLeague._count.teamLeagues > 0) {
      return NextResponse.json({
        error: `Cannot delete league with ${existingLeague._count.teamLeagues} teams. Please move or delete all teams first.`
      }, { status: 409 });
    }

    await prisma.league.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'League deleted successfully' });
  } catch (error) {
    console.error('Error deleting league:', error);
    return NextResponse.json({ error: 'Failed to delete league' }, { status: 500 });
  }
}