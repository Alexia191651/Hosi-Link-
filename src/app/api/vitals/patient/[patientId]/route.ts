import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ALLOWED_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'ADMIN'] as const

// GET /api/vitals/patient/:patientId - Get patient vitals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { patientId } = await params

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const vitals = await prisma.vitalSigns.findMany({
      where: { patientId },
      include: {
        recordedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
      },
      orderBy: { recordedAt: 'desc' },
    })

    return NextResponse.json(vitals)
  } catch (error) {
    console.error('Error fetching patient vitals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}