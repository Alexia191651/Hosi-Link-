import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['BLOODBANK_STAFF', 'ADMIN'] as const

const updateUnitSchema = z.object({
  status: z.enum(['AVAILABLE', 'RESERVED', 'USED', 'EXPIRED', 'DISCARDED']).optional(),
  volume: z.number().int().positive().optional(),
  donorId: z.string().optional().nullable(),
})

// GET /api/blood/units/:id - Get unit by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const unit = await prisma.bloodUnit.findUnique({
      where: { id },
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error fetching blood unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/blood/units/:id - Update blood unit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUnitSchema.parse(body)

    const unit = await prisma.bloodUnit.update({
      where: { id },
      data: validatedData,
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
    })

    return NextResponse.json(unit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating blood unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/blood/units/:id - Delete/discard blood unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Soft delete - mark as DISCARDED instead of hard delete
    const unit = await prisma.bloodUnit.update({
      where: { id },
      data: { status: 'DISCARDED' },
    })

    return NextResponse.json({ message: 'Unit discarded', unit })
  } catch (error) {
    console.error('Error discarding blood unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}