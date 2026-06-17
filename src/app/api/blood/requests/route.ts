import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const BLOOD_REQUEST_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'BLOODBANK_STAFF', 'ADMIN'] as const
const BLOOD_BANK_ROLES = ['BLOODBANK_STAFF', 'ADMIN'] as const

const bloodRequestSchema = z.object({
  patientId: z.string().min(1),
  bloodType: z.string().min(1),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
  unitsRequired: z.number().int().positive(),
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
  notes: z.string().optional(),
})

// GET /api/blood/requests - List all requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BLOOD_REQUEST_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const urgency = searchParams.get('urgency')
    const bloodType = searchParams.get('bloodType')

    const where: any = {}
    if (status) where.status = status
    if (urgency) where.urgency = urgency
    if (bloodType) where.bloodType = bloodType

    const requests = await prisma.bloodRequest.findMany({
      where,
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        fulfilledBy: {
          select: { id: true, firstName: true, lastName: true }
        },
      },
      orderBy: [
        { urgency: 'desc' }, // EMERGENCY first
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching blood requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/blood/requests - Create new request (all roles)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BLOOD_REQUEST_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = bloodRequestSchema.parse(body)

    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        patientId: validatedData.patientId,
        requestedBy: session.user.id,
        bloodType: validatedData.bloodType,
        rhFactor: validatedData.rhFactor,
        unitsRequired: validatedData.unitsRequired,
        urgency: validatedData.urgency,
        notes: validatedData.notes,
      },
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
    })

    return NextResponse.json(bloodRequest, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating blood request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/blood/requests - Update request status (Blood Bank only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BLOOD_BANK_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (notes) updateData.notes = notes

    // If fulfilling, set fulfilledBy
    if (status === 'FULFILLED' || status === 'APPROVED') {
      updateData.fulfilledBy = session.user.id
    }

    const bloodRequest = await prisma.bloodRequest.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        fulfilledBy: {
          select: { id: true, firstName: true, lastName: true }
        },
      },
    })

    // If fulfilled, reserve the blood units
    if (status === 'FULFILLED') {
      const units = await prisma.bloodUnit.findMany({
        where: {
          bloodType: bloodRequest.bloodType,
          rhFactor: bloodRequest.rhFactor,
          status: 'AVAILABLE',
        },
        take: bloodRequest.unitsRequired,
        orderBy: { expiryDate: 'asc' },
      })

      // Reserve units
      for (const unit of units) {
        await prisma.bloodUnit.update({
          where: { id: unit.id },
          data: { status: 'RESERVED' },
        })
      }
    }

    return NextResponse.json(bloodRequest)
  } catch (error) {
    console.error('Error updating blood request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}