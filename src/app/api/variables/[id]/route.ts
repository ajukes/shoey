import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-global';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { key, label, description, scope, dataType, defaultValue, isActive } = body;

    // Check if the variable exists
    const existingVariable = await prisma.customVariable.findUnique({
      where: { id }
    });

    if (!existingVariable) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
    }

    // If key is being changed, check if new key already exists for this team
    if (key && key !== existingVariable.key) {
      const conflictingVariable = await prisma.customVariable.findFirst({
        where: {
          key: key,
          teamId: existingVariable.teamId,
          id: {
            not: id
          }
        }
      });

      if (conflictingVariable) {
        return NextResponse.json({ error: 'Variable key already exists for this team' }, { status: 409 });
      }
    }

    const updatedVariable = await prisma.customVariable.update({
      where: { id },
      data: {
        ...(key && { key }),
        ...(label && { label }),
        ...(description && { description }),
        ...(scope && { scope }),
        ...(dataType && { dataType }),
        ...(defaultValue !== undefined && { defaultValue }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(updatedVariable);
  } catch (error) {
    console.error('Error updating variable:', error);
    return NextResponse.json({ error: 'Failed to update variable' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if the variable exists
    const existingVariable = await prisma.customVariable.findUnique({
      where: { id }
    });

    if (!existingVariable) {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
    }

    // Check if variable is used in any rules (you may want to implement this check)
    // For now, we'll allow deletion but in production you might want to prevent deletion of variables in use

    await prisma.customVariable.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Variable deleted successfully' });
  } catch (error) {
    console.error('Error deleting variable:', error);
    return NextResponse.json({ error: 'Failed to delete variable' }, { status: 500 });
  }
}