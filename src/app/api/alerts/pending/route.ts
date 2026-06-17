import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/alerts/pending - Get pending alerts (ICU Manager only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ICU Manager and Admin can view pending alerts
    if (session.user.role !== 'ICU_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const alerts = await prisma.emergencyAlert.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        patient: true,
        paramedic: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: [
        { severity: 'desc' }, // CRITICAL first
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching pending alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}