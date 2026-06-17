import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/transfers/pending - Get pending transfers (ICU Manager only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ICU Manager and Admin can view pending transfers
    if (session.user.role !== 'ICU_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const transfers = await prisma.transferRequest.findMany({
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
        { priority: 'desc' }, // EMERGENCY first
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error('Error fetching pending transfers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}