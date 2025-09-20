import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';
import { CustomVariable } from '@/types/variables';

export async function GET(request: NextRequest) {
  try {
    const variables = await prisma.customVariable.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(variables);
  } catch (error) {
    console.error('Error fetching variables:', error);
    return NextResponse.json({ error: 'Failed to fetch variables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, label, description, scope, dataType, defaultValue } = body;

    if (!key || !label || !description || !scope) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if variable key already exists globally
    const existingVariable = await prisma.customVariable.findFirst({
      where: {
        key: key
      }
    });

    if (existingVariable) {
      return NextResponse.json({ error: 'Variable key already exists' }, { status: 409 });
    }

    const variable = await prisma.customVariable.create({
      data: {
        key,
        label,
        description,
        scope,
        dataType: dataType || 'number',
        defaultValue: defaultValue || 0,
        isActive: true,
        isBuiltIn: false
      }
    });

    return NextResponse.json(variable, { status: 201 });
  } catch (error) {
    console.error('Error creating variable:', error);
    return NextResponse.json({ error: 'Failed to create variable' }, { status: 500 });
  }
}