import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/beds/available - Get available beds
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bedType = searchParams.get('bedType')
    const ward = searchParams.get('ward')

    const where: any = {
      status: 'AVAILABLE',
      isAvailable: true,
    }
    if (bedType) where.bedType = bedType
    if (ward) where.ward = ward

    const beds = await prisma.iCUBed.findMany({
      where,
      orderBy: { bedNumber: 'asc' },
    })

    // Get summary counts
    const summary = await prisma.iCUBed.groupBy({
      by: ['bedType', 'status'],
      _count: true,
    })

    return NextResponse.json({ beds, summary })
  } catch (error) {
    console.error('Error fetching available beds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}