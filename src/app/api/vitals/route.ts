import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'ADMIN'] as const

const vitalSignsSchema = z.object({
  patientId: z.string().min(1),
  bloodPressureSystolic: z.number().int().positive().optional(),
  bloodPressureDiastolic: z.number().int().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  oxygenSaturation: z.number().int().min(0).max(100).optional(),
  respiratoryRate: z.number().int().positive().optional(),
})

// GET /api/vitals - Get vital signs (optional patientId filter)
// GET /api/vitals?patientId=xxx - Get vitals for specific patient
// GET /api/vitals?limit=10 - Get recent vitals (all patients)
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
    const patientId = searchParams.get('patientId')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    if (patientId) {
      where.patientId = patientId
    }

    const vitals = await prisma.vitalSigns.findMany({
      where,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(vitals)
  } catch (error) {
    console.error('Error fetching vital signs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/vitals - Record vital signs (Paramedic only)
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
    const validatedData = vitalSignsSchema.parse(body)

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const vitalSigns = await prisma.vitalSigns.create({
      data: {
        patientId: validatedData.patientId,
        recordedBy: session.user.id,
        bloodPressureSystolic: validatedData.bloodPressureSystolic,
        bloodPressureDiastolic: validatedData.bloodPressureDiastolic,
        heartRate: validatedData.heartRate,
        temperature: validatedData.temperature,
        oxygenSaturation: validatedData.oxygenSaturation,
        respiratoryRate: validatedData.respiratoryRate,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
      },
    })

    return NextResponse.json(vitalSigns, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error recording vital signs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}