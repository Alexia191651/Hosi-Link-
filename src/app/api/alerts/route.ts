import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'ADMIN'] as const

const alertSchema = z.object({
  patientId: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  location: z.string().min(1),
  description: z.string().optional(),
})

// GET /api/alerts - List all alerts
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
    const severity = searchParams.get('severity')

    const where: any = {}
    if (status) where.status = status
    if (severity) where.severity = severity

    const alerts = await prisma.emergencyAlert.findMany({
      where,
      include: {
        patient: true,
        paramedic: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/alerts - Create new alert (Paramedic only)
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
    const validatedData = alertSchema.parse(body)

    const alert = await prisma.emergencyAlert.create({
      data: {
        patientId: validatedData.patientId,
        paramedicId: session.user.id,
        severity: validatedData.severity,
        location: validatedData.location,
        description: validatedData.description,
      },
      include: {
        patient: true,
        paramedic: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}