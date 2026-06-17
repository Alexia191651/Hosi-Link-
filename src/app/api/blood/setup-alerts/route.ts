import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const DEFAULT_THRESHOLD = 10

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'BLOODBANK_STAFF' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const threshold = body.threshold ?? DEFAULT_THRESHOLD

    const bloodTypes = ['A', 'B', 'AB', 'O']
    const rhFactors = ['POSITIVE', 'NEGATIVE']

    const created: string[] = []
    const existing: string[] = []

    for (const bloodType of bloodTypes) {
      for (const rhFactor of rhFactors) {
        const existingAlert = await prisma.stockAlert.findFirst({
          where: {
            bloodType,
            rhFactor,
          },
        })

        if (existingAlert) {
          existing.push(`${bloodType}_${rhFactor}`)
        } else {
          await prisma.stockAlert.create({
            data: {
              bloodType,
              rhFactor,
              minimumThreshold: threshold,
              isEnabled: true,
            },
          })
          created.push(`${bloodType}_${rhFactor}`)
        }
      }
    }

    return NextResponse.json({
      message: 'Stock alerts initialized',
      threshold,
      created,
      existing,
    })
  } catch (error) {
    console.error('Error setting up stock alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'BLOODBANK_STAFF' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const alerts = await prisma.stockAlert.findMany({
      orderBy: [{ bloodType: 'asc' }, { rhFactor: 'asc' }],
    })

    const isFullyConfigured = alerts.length === 8

    return NextResponse.json({
      defaultThreshold: DEFAULT_THRESHOLD,
      isConfigured: isFullyConfigured,
      alerts,
    })
  } catch (error) {
    console.error('Error fetching stock alert status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}