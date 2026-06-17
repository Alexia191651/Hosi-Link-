import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, getCurrentUser } from '@/lib/auth'

const DEFAULT_THRESHOLD = 10

interface InventoryCheckResult {
  bloodType: string
  rhFactor: string
  currentStock: number
  threshold: number
  isLowStock: boolean
  autoRequestCreated: boolean
}

async function checkInventoryAndCreateRequests(requestedByUserId?: string): Promise<InventoryCheckResult[]> {
  const results: InventoryCheckResult[] = []
  
  const bloodTypes = ['A', 'B', 'AB', 'O']
  const rhFactors = ['POSITIVE', 'NEGATIVE']
  const today = new Date()

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

      const currentStock = availableUnits.length

      const stockAlert = await prisma.stockAlert.findFirst({
        where: {
          bloodType,
          rhFactor,
          isEnabled: true,
        },
      })

      const threshold = stockAlert?.minimumThreshold ?? DEFAULT_THRESHOLD

      const result: InventoryCheckResult = {
        bloodType,
        rhFactor,
        currentStock,
        threshold,
        isLowStock: currentStock < threshold,
        autoRequestCreated: false,
      }

      if (currentStock < threshold && requestedByUserId) {
        const existingPendingRequest = await prisma.bloodRequest.findFirst({
          where: {
            bloodType,
            rhFactor,
            status: { in: ['PENDING', 'APPROVED'] },
          },
        })

        if (!existingPendingRequest) {
          await prisma.bloodRequest.create({
            data: {
              patientId: '00000000-0000-0000-0000-000000000000',
              requestedBy: requestedByUserId,
              bloodType,
              rhFactor,
              unitsRequired: threshold - currentStock + 5,
              urgency: currentStock < 5 ? 'EMERGENCY' : 'URGENT',
              notes: `Auto-generated: Stock low (${currentStock} units, threshold: ${threshold}). System reorder request.`,
            },
          })
          result.autoRequestCreated = true
        }
      }

      results.push(result)
    }
  }

  return results
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

    const results = await checkInventoryAndCreateRequests(session.user.id)

    const lowStockItems = results.filter(r => r.isLowStock)
    const createdRequests = results.filter(r => r.autoRequestCreated)

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      defaultThreshold: DEFAULT_THRESHOLD,
      totalChecked: results.length,
      lowStockCount: lowStockItems.length,
      requestsCreated: createdRequests.length,
      results,
    })
  } catch (error) {
    console.error('Error checking inventory:', error)
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
    const forceCheck = body.force === true

    if (forceCheck) {
      const results = await checkInventoryAndCreateRequests(session.user.id)
      
      return NextResponse.json({
        message: 'Inventory check completed',
        checkedAt: new Date().toISOString(),
        results,
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error running inventory check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}