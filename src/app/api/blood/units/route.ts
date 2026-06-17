import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['BLOODBANK_STAFF', 'ADMIN'] as const

const bloodUnitSchema = z.object({
  bloodType: z.string().min(1),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
  unitNumber: z.string().min(1),
  volume: z.number().int().positive(),
  collectionDate: z.string().datetime(),
  donorId: z.string().optional().nullable(),
})

// GET /api/blood/units - List all blood units
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
    const bloodType = searchParams.get('bloodType')
    const rhFactor = searchParams.get('rhFactor')

    const where: any = {}
    if (status) where.status = status
    if (bloodType) where.bloodType = bloodType
    if (rhFactor) where.rhFactor = rhFactor

    const units = await prisma.bloodUnit.findMany({
      where,
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { expiryDate: 'asc' }, // Soonest expiring first
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error('Error fetching blood units:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/blood/units - Add new blood unit
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = bloodUnitSchema.parse(body)

    // Check if unit number already exists
    const existingUnit = await prisma.bloodUnit.findUnique({
      where: { unitNumber: validatedData.unitNumber },
    })

    if (existingUnit) {
      return NextResponse.json({ error: 'Unit number already exists' }, { status: 400 })
    }

    // Calculate expiry date (42 days from collection for whole blood)
    const collectionDate = new Date(validatedData.collectionDate)
    const expiryDate = new Date(collectionDate)
    expiryDate.setDate(expiryDate.getDate() + 42)

    const unit = await prisma.bloodUnit.create({
      data: {
        bloodType: validatedData.bloodType,
        rhFactor: validatedData.rhFactor,
        unitNumber: validatedData.unitNumber,
        volume: validatedData.volume,
        collectionDate,
        expiryDate,
        donorId: validatedData.donorId,
        status: 'AVAILABLE',
      },
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating blood unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/blood/units - Update blood unit status
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, volume } = body

    if (!id) {
      return NextResponse.json({ error: 'Unit ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (volume !== undefined) updateData.volume = volume

    const unit = await prisma.bloodUnit.update({
      where: { id },
      data: updateData,
      include: {
        donor: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error updating blood unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}