import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['BLOODBANK_STAFF', 'ADMIN'] as const

const alertSchema = z.object({
  bloodType: z.string().min(1),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
  minimumThreshold: z.number().int().positive(),
  isEnabled: z.boolean().optional(),
})

// GET /api/blood/alerts - List stock alerts
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ALLOWED_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const alerts = await prisma.stockAlert.findMany({
      orderBy: { bloodType: 'asc' },
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching stock alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/blood/alerts - Create stock alert
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
    const validatedData = alertSchema.parse(body)

    // Check if alert already exists for this blood type + rh factor
    const existingAlert = await prisma.stockAlert.findFirst({
      where: {
        bloodType: validatedData.bloodType,
        rhFactor: validatedData.rhFactor,
      },
    })

    if (existingAlert) {
      return NextResponse.json(
        { error: 'Alert already exists for this blood type and Rh factor' },
        { status: 400 }
      )
    }

    const alert = await prisma.stockAlert.create({
      data: {
        bloodType: validatedData.bloodType,
        rhFactor: validatedData.rhFactor,
        minimumThreshold: validatedData.minimumThreshold,
        isEnabled: validatedData.isEnabled ?? true,
      },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating stock alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/blood/alerts - Update stock alert
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    const alert = await prisma.stockAlert.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error updating stock alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}