import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const assignmentSchema = z.object({
  bedId: z.string().uuid(),
  patientId: z.string().uuid(),
  notes: z.string().optional(),
})

// GET /api/assignments - List all assignments
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dischargeDate = searchParams.get('dischargeDate')

    const where: any = {}
    if (dischargeDate === 'null') {
      where.dischargeDate = null
    } else if (dischargeDate === 'set') {
      where.dischargeDate = { not: null }
    }

    const assignments = await prisma.bedAssignment.findMany({
      where,
      include: {
        bed: true,
        patient: true,
        assignedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { admissionDate: 'desc' },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/assignments - Create new assignment (admit patient)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ICU_MANAGER', 'ADMIN'].includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = assignmentSchema.parse(body)
    const user = await getCurrentUser()

    // Check if bed is available
    const bed = await prisma.iCUBed.findUnique({
      where: { id: validatedData.bedId },
    })

    if (!bed || bed.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Bed is not available' }, { status: 400 })
    }

    // Create assignment and update bed status in transaction
    const [assignment] = await prisma.$transaction([
      prisma.bedAssignment.create({
        data: {
          bedId: validatedData.bedId,
          patientId: validatedData.patientId,
          assignedBy: user!.id,
          notes: validatedData.notes,
        },
      }),
      prisma.iCUBed.update({
        where: { id: validatedData.bedId },
        data: {
          status: 'OCCUPIED',
          isAvailable: false,
        },
      }),
    ])

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}