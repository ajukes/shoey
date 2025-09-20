import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only ADMIN users can manage seasons
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, year, sport, startDate, endDate } = body;

    // Check if the season exists
    const existingSeason = await prisma.season.findUnique({
      where: { id }
    });

    if (!existingSeason) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    // If year is being changed, check it doesn't conflict with another season
    if (year && year !== existingSeason.year) {
      const yearConflict = await prisma.season.findUnique({
        where: { year }
      });
      if (yearConflict) {
        return NextResponse.json({ error: 'Season year already exists' }, { status: 409 });
      }
    }

    const updatedSeason = await prisma.season.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(year && { year }),
        ...(sport && { sport }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) })
      },
      include: {
        _count: {
          select: {
            leagues: true
          }
        }
      }
    });

    return NextResponse.json(updatedSeason);
  } catch (error) {
    console.error('Error updating season:', error);
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only ADMIN users can manage seasons
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Check if the season exists and get league count
    const existingSeason = await prisma.season.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            leagues: true
          }
        }
      }
    });

    if (!existingSeason) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    // Check if there are any leagues for this season
    if (existingSeason._count.leagues > 0) {
      return NextResponse.json({
        error: `Cannot delete season with ${existingSeason._count.leagues} leagues. Please delete or move all leagues first.`
      }, { status: 409 });
    }

    await prisma.season.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Season deleted successfully' });
  } catch (error) {
    console.error('Error deleting season:', error);
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
  }
}