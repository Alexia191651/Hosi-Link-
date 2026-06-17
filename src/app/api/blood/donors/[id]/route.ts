import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['BLOODBANK_STAFF', 'ADMIN'] as const

const updateDonorSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  bloodType: z.string().min(1).optional(),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']).optional(),
  lastDonation: z.string().datetime().optional(),
})

// GET /api/blood/donors/:id - Get donor by ID
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

    const donor = await prisma.donor.findUnique({
      where: { id },
      include: {
        bloodUnits: true,
      },
    })

    if (!donor) {
      return NextResponse.json({ error: 'Donor not found' }, { status: 404 })
    }

    return NextResponse.json(donor)
  } catch (error) {
    console.error('Error fetching donor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/blood/donors/:id - Update donor
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
    const validatedData = updateDonorSchema.parse(body)

    // Check if email is being changed and if it's already taken
    if (validatedData.email) {
      const existingDonor = await prisma.donor.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id },
        },
      })
      if (existingDonor) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
    }

    const donor = await prisma.donor.update({
      where: { id },
      data: {
        ...validatedData,
        lastDonation: validatedData.lastDonation
          ? new Date(validatedData.lastDonation)
          : undefined,
      },
    })

    return NextResponse.json(donor)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating donor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/blood/donors/:id - Delete donor
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

    // Check if donor has any blood units
    const units = await prisma.bloodUnit.findMany({
      where: { donorId: id },
    })

    if (units.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete donor with associated blood units' },
        { status: 400 }
      )
    }

    await prisma.donor.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Donor deleted successfully' })
  } catch (error) {
    console.error('Error deleting donor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}