import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/blood/inventory - Get inventory summary
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'BLOODBANK_STAFF' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all available blood units grouped by blood type and rh factor
    const units = await prisma.bloodUnit.findMany({
      where: {
        status: 'AVAILABLE',
      },
      select: {
        bloodType: true,
        rhFactor: true,
        volume: true,
        expiryDate: true,
      },
    })

    // Group and aggregate by blood type + rh factor
    const inventory: Record<string, { totalUnits: number; totalVolume: number; expiredCount: number }> = {}
    const bloodTypes = ['A', 'B', 'AB', 'O']
    const rhFactors = ['POSITIVE', 'NEGATIVE']
    const today = new Date()

    for (const bt of bloodTypes) {
      for (const rh of rhFactors) {
        const key = `${bt}_${rh}`
        const typeUnits = units.filter(u => u.bloodType === bt && u.rhFactor === rh)
        const expiredCount = typeUnits.filter(u => new Date(u.expiryDate) < today).length

        inventory[key] = {
          totalUnits: typeUnits.length,
          totalVolume: typeUnits.reduce((sum, u) => sum + u.volume, 0),
          expiredCount,
        }
      }
    }

    // Get stock alerts
    const alerts = await prisma.stockAlert.findMany({
      where: { isEnabled: true },
    })

    // Check which blood types are below threshold
    const alertWarnings: string[] = []
    for (const alert of alerts) {
      const key = `${alert.bloodType}_${alert.rhFactor}`
      const inv = inventory[key]
      if (inv && inv.totalUnits < alert.minimumThreshold) {
        alertWarnings.push(`${alert.bloodType} ${alert.rhFactor}: ${inv.totalUnits} units (min: ${alert.minimumThreshold})`)
      }
    }

    return NextResponse.json({
      inventory,
      alerts: alertWarnings,
      summary: {
        totalUnits: units.length,
        totalVolume: units.reduce((sum, u) => sum + u.volume, 0),
      },
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}