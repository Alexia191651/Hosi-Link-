import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'ADMIN'] as const

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  emergencyContact: z.string().optional(),
})

// GET /api/patients - List all patients
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

    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/patients - Register new patient (Paramedic/ICU Manager/Admin)
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
    const validatedData = patientSchema.parse(body)

    const patient = await prisma.patient.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        gender: validatedData.gender,
        bloodType: validatedData.bloodType,
        allergies: validatedData.allergies || [],
        medicalConditions: validatedData.medicalConditions || [],
        emergencyContact: validatedData.emergencyContact,
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}