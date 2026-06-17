import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
// Role type - using string instead of enum for flexibility
import { z } from 'zod'

const dischargeSchema = z.object({
  dischargeDate: z.string().datetime(),
  notes: z.string().optional(),
})

// GET /api/assignments/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const assignment = await prisma.bedAssignment.findUnique({
      where: { id },
      include: {
        bed: true,
        patient: true,
        assignedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/assignments/:id - Update assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ICU_MANAGER', 'ADMIN'].includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const assignment = await prisma.bedAssignment.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/assignments/:id - Discharge patient
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ICU_MANAGER', 'ADMIN'].includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = dischargeSchema.parse(body)

    const assignment = await prisma.bedAssignment.findUnique({
      where: { id },
      include: { bed: true },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const [updatedAssignment] = await prisma.$transaction([
      prisma.bedAssignment.update({
        where: { id },
        data: {
          dischargeDate: new Date(validatedData.dischargeDate),
          notes: validatedData.notes || assignment.notes,
        },
      }),
      prisma.iCUBed.update({
        where: { id: assignment.bedId },
        data: {
          status: 'AVAILABLE',
          isAvailable: true,
        },
      }),
    ])

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error discharging patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}