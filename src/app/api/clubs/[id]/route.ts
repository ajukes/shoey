import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Global is used here to maintain a cached connection across hot reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, avatar, location, founded, description } = body;

    // Check if the club exists
    const existingClub = await prisma.club.findUnique({
      where: { id }
    });

    if (!existingClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const updatedClub = await prisma.club.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(avatar !== undefined && { avatar: avatar || null }),
        ...(location !== undefined && { location: location || null }),
        ...(founded !== undefined && { founded: founded ? parseInt(founded) : null }),
        ...(description !== undefined && { description: description || null })
      },
      include: {
        _count: {
          select: {
            teams: true,
            players: true
          }
        }
      }
    });

    // Transform the data to match the frontend interface
    const transformedClub = {
      ...updatedClub,
      teamsCount: updatedClub._count.teams,
      playersCount: updatedClub._count.players
    };

    return NextResponse.json(transformedClub);
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if the club exists
    const existingClub = await prisma.club.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            teams: true,
            players: true
          }
        }
      }
    });

    if (!existingClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check if there are any teams or players in this club
    if (existingClub._count.teams > 0) {
      return NextResponse.json({ 
        error: `Cannot delete club with ${existingClub._count.teams} teams. Please move or delete all teams first.` 
      }, { status: 409 });
    }

    if (existingClub._count.players > 0) {
      return NextResponse.json({ 
        error: `Cannot delete club with ${existingClub._count.players} players. Please move or delete all players first.` 
      }, { status: 409 });
    }

    await prisma.club.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 });
  }
}