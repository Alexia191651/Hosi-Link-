import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const BLOOD_BANK_ROLES = ['BLOODBANK_STAFF', 'ADMIN'] as const

// GET /api/blood/requests/pending - Get pending requests (Blood Bank only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BLOOD_BANK_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const requests = await prisma.bloodRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
      orderBy: [
        { urgency: 'desc' }, // EMERGENCY first
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching pending blood requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}