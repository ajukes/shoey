import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        _count: {
          select: {
            leagues: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(seasons);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, year, sport, startDate, endDate } = body;

    if (!name || !year || !sport || !startDate || !endDate) {
      return NextResponse.json({ error: 'Name, year, sport, start date, and end date are required' }, { status: 400 });
    }

    // Check if season year already exists
    const existingSeason = await prisma.season.findUnique({
      where: { year }
    });

    if (existingSeason) {
      return NextResponse.json({ error: 'Season year already exists' }, { status: 409 });
    }

    const season = await prisma.season.create({
      data: {
        name,
        year,
        sport,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      include: {
        _count: {
          select: {
            leagues: true
          }
        }
      }
    });

    return NextResponse.json(season, { status: 201 });
  } catch (error) {
    console.error('Error creating season:', error);
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 });
  }
}