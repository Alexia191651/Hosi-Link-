import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const DEFAULT_THRESHOLD = 10

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'BLOODBANK_STAFF' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const minUnits = parseInt(searchParams.get('minUnits') || String(DEFAULT_THRESHOLD))

    const bloodTypes = ['A', 'B', 'AB', 'O']
    const rhFactors = ['POSITIVE', 'NEGATIVE']
    const today = new Date()

    const reorderItems: Array<{
      bloodType: string
      rhFactor: string
      currentStock: number
      recommendedOrder: number
      urgency: string
    }> = []

    for (const bloodType of bloodTypes) {
      for (const rhFactor of rhFactors) {
        const availableUnits = await prisma.bloodUnit.findMany({
          where: {
            bloodType,
            rhFactor,
            status: { in: ['AVAILABLE', 'RESERVED'] },
            expiryDate: { gt: today },
          },
        })

        const stockAlert = await prisma.stockAlert.findFirst({
          where: {
            bloodType,
            rhFactor,
            isEnabled: true,
          },
        })

        const threshold = stockAlert?.minimumThreshold ?? DEFAULT_THRESHOLD
        const currentStock = availableUnits.length

        if (currentStock < threshold) {
          reorderItems.push({
            bloodType,
            rhFactor,
            currentStock,
            recommendedOrder: threshold - currentStock + 10,
            urgency: currentStock < 5 ? 'EMERGENCY' : currentStock < threshold / 2 ? 'URGENT' : 'ROUTINE',
          })
        }
      }
    }

    return NextResponse.json({
      threshold: minUnits,
      reorderCount: reorderItems.length,
      items: reorderItems,
    })
  } catch (error) {
    console.error('Error fetching reorder list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const items = body.items as Array<{
      bloodType: string
      rhFactor: string
      unitsRequired: number
      urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY'
    }>

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 })
    }

    const createdRequests = []

    for (const item of items) {
      const existingPending = await prisma.bloodRequest.findFirst({
        where: {
          bloodType: item.bloodType,
          rhFactor: item.rhFactor,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      })

      if (existingPending) {
        continue
      }

      const bloodRequest = await prisma.bloodRequest.create({
        data: {
          patientId: '00000000-0000-0000-0000-000000000000',
          requestedBy: session.user.id,
          bloodType: item.bloodType,
          rhFactor: item.rhFactor,
          unitsRequired: item.unitsRequired,
          urgency: item.urgency,
          notes: `Bulk reorder request for ${item.bloodType} ${item.rhFactor}. Requested quantity: ${item.unitsRequired} units.`,
        },
      })

      createdRequests.push(bloodRequest)
    }

    return NextResponse.json({
      message: `Created ${createdRequests.length} bulk reorder requests`,
      requests: createdRequests,
    })
  } catch (error) {
    console.error('Error creating bulk reorder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}