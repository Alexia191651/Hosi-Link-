import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['BLOODBANK_STAFF', 'ADMIN'] as const

const donorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  bloodType: z.string().min(1),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
  lastDonation: z.string().datetime().optional(),
})

// GET /api/blood/donors - List all donors
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
    const search = searchParams.get('search')
    const bloodType = searchParams.get('bloodType')

    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (bloodType) where.bloodType = bloodType

    const donors = await prisma.donor.findMany({
      where,
      orderBy: { lastName: 'asc' },
      include: {
        bloodUnits: {
          select: { id: true, status: true, expiryDate: true }
        }
      },
    })

    return NextResponse.json(donors)
  } catch (error) {
    console.error('Error fetching donors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/blood/donors - Register new donor
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
    const validatedData = donorSchema.parse(body)

    // Check if email already exists
    const existingDonor = await prisma.donor.findUnique({
      where: { email: validatedData.email },
    })

    if (existingDonor) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Check last donation eligibility (minimum 90 days)
    if (validatedData.lastDonation) {
      const lastDonation = new Date(validatedData.lastDonation)
      const daysSinceLastDonation = Math.floor(
        (Date.now() - lastDonation.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceLastDonation < 90) {
        return NextResponse.json(
          { error: 'Donor must wait at least 90 days between donations' },
          { status: 400 }
        )
      }
    }

    const donor = await prisma.donor.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        bloodType: validatedData.bloodType,
        rhFactor: validatedData.rhFactor,
        lastDonation: validatedData.lastDonation
          ? new Date(validatedData.lastDonation)
          : null,
      },
    })

    return NextResponse.json(donor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating donor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}