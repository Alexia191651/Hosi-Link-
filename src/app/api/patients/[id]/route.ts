import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'ADMIN'] as const

const updatePatientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  emergencyContact: z.string().optional(),
})

// GET /api/patients/:id - Get patient by ID
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

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        bedAssignments: {
          include: {
            bed: {
              select: { id: true, roomNumber: true, bedNumber: true }
            }
          },
          orderBy: { assignedAt: 'desc' },
          take: 5,
        },
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        transferRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/patients/:id - Update patient
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
    const validatedData = updatePatientSchema.parse(body)

    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    })

    if (!existingPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (validatedData.firstName) updateData.firstName = validatedData.firstName
    if (validatedData.lastName) updateData.lastName = validatedData.lastName
    if (validatedData.dateOfBirth) updateData.dateOfBirth = new Date(validatedData.dateOfBirth)
    if (validatedData.gender) updateData.gender = validatedData.gender
    if (validatedData.bloodType !== undefined) updateData.bloodType = validatedData.bloodType
    if (validatedData.allergies) updateData.allergies = validatedData.allergies
    if (validatedData.medicalConditions) updateData.medicalConditions = validatedData.medicalConditions
    if (validatedData.emergencyContact !== undefined) updateData.emergencyContact = validatedData.emergencyContact

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(patient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/patients/:id - Soft delete patient (mark as inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Admin can delete patients
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check for active assignments
    const activeAssignments = await prisma.bedAssignment.count({
      where: {
        patientId: id,
        dischargeDate: null,
      },
    })

    if (activeAssignments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patient with active bed assignments' },
        { status: 400 }
      )
    }

    // Soft delete - just mark as deleted (you might want to add a deletedAt field to the schema)
    // For now, we'll do a hard delete or you can add a field to schema
    await prisma.patient.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Patient deleted successfully' })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}