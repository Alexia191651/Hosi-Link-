import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const bedSchema = z.object({
  bedNumber: z.string().min(1),
  ward: z.string().min(1),
  bedType: z.enum(['ICU', 'ICCU', 'NICU', 'PICU']),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).optional(),
})

const updateBedSchema = z.object({
  id: z.string().min(1),
  bedNumber: z.string().min(1).optional(),
  ward: z.string().min(1).optional(),
  bedType: z.enum(['ICU', 'ICCU', 'NICU', 'PICU']).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).optional(),
})

// GET /api/beds - List all beds
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const bedType = searchParams.get('bedType')
    const ward = searchParams.get('ward')

    const where: any = {}
    if (status) where.status = status
    if (bedType) where.bedType = bedType
    if (ward) where.ward = ward

    const beds = await prisma.iCUBed.findMany({
      where,
      orderBy: { bedNumber: 'asc' },
    })

    return NextResponse.json(beds)
  } catch (error) {
    console.error('Error fetching beds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/beds - Create new bed (ICU Manager/Admin only)
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
    const validatedData = bedSchema.parse(body)

    const existingBed = await prisma.iCUBed.findUnique({
      where: { bedNumber: validatedData.bedNumber },
    })

    if (existingBed) {
      return NextResponse.json({ error: 'Bed number already exists' }, { status: 400 })
    }

    const bed = await prisma.iCUBed.create({
      data: {
        bedNumber: validatedData.bedNumber,
        ward: validatedData.ward,
        bedType: validatedData.bedType,
        status: validatedData.status || 'AVAILABLE',
        isAvailable: validatedData.status === 'AVAILABLE' || !validatedData.status,
      },
    })

    return NextResponse.json(bed, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating bed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/beds - Update bed status (ICU Manager/Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ICU_MANAGER', 'ADMIN'].includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = updateBedSchema.parse(body)

    const data: Record<string, unknown> = { ...updateData }
    if (updateData.status !== undefined) {
      data.isAvailable = updateData.status === 'AVAILABLE'
    }

    const bed = await prisma.iCUBed.update({
      where: { id },
      data,
    })

    return NextResponse.json(bed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating bed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}