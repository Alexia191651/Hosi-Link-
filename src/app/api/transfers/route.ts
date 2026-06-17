import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'ADMIN'] as const

const transferSchema = z.object({
  patientId: z.string().min(1),
  priority: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
  notes: z.string().max(500).optional(),
})

// GET /api/transfers - List all transfers
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const patientId = searchParams.get('patientId')

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (patientId) where.patientId = patientId

    // Paramedics can only see their own transfers
    if (session.user.role === 'PARAMEDIC') {
      where.requestedBy = session.user.id
    }

    const transfers = await prisma.transferRequest.findMany({
      where,
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        assignedBed: true,
      },
      orderBy: [
        { priority: 'desc' }, // EMERGENCY first
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/transfers - Create new transfer (Paramedic only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PARAMEDIC' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = transferSchema.parse(body)

    const transfer = await prisma.transferRequest.create({
      data: {
        patientId: validatedData.patientId,
        requestedBy: session.user.id,
        priority: validatedData.priority,
        notes: validatedData.notes,
      },
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating transfer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}