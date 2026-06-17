import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'ADMIN'] as const

const updateAlertSchema = z.object({
  status: z.enum(['PENDING', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  location: z.string().min(1).optional(),
  description: z.string().optional(),
})

// GET /api/alerts/:id - Get alert by ID
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

    const alert = await prisma.emergencyAlert.findUnique({
      where: { id },
      include: {
        patient: true,
        paramedic: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error fetching alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/alerts/:id - Update alert (ICU Manager can acknowledge/resolve)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ICU Manager and Admin can update alerts
    if (session.user.role !== 'ICU_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateAlertSchema.parse(body)

    const alert = await prisma.emergencyAlert.update({
      where: { id },
      data: validatedData,
      include: {
        patient: true,
        paramedic: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
    })

    return NextResponse.json(alert)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/alerts/:id - Delete alert (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    await prisma.emergencyAlert.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Alert deleted successfully' })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}