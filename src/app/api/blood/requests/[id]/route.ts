import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const BLOOD_REQUEST_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'BLOODBANK_STAFF', 'ADMIN'] as const
const BLOOD_BANK_ROLES = ['BLOODBANK_STAFF', 'ADMIN'] as const

// GET /api/blood/requests/:id - Get request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BLOOD_REQUEST_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        fulfilledBy: {
          select: { id: true, firstName: true, lastName: true }
        },
      },
    })

    if (!bloodRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json(bloodRequest)
  } catch (error) {
    console.error('Error fetching blood request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/blood/requests/:id - Update request status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BLOOD_BANK_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (notes) updateData.notes = notes

    // If fulfilling, set fulfilledBy
    if (status === 'FULFILLED' || status === 'APPROVED') {
      updateData.fulfilledBy = session.user.id
    }

    const bloodRequest = await prisma.bloodRequest.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        fulfilledBy: {
          select: { id: true, firstName: true, lastName: true }
        },
      },
    })

    // If fulfilled, reserve the blood units
    if (status === 'FULFILLED') {
      const units = await prisma.bloodUnit.findMany({
        where: {
          bloodType: bloodRequest.bloodType,
          rhFactor: bloodRequest.rhFactor,
          status: 'AVAILABLE',
        },
        take: bloodRequest.unitsRequired,
        orderBy: { expiryDate: 'asc' },
      })

      // Reserve units
      for (const unit of units) {
        await prisma.bloodUnit.update({
          where: { id: unit.id },
          data: { status: 'RESERVED' },
        })
      }
    }

    return NextResponse.json(bloodRequest)
  } catch (error) {
    console.error('Error updating blood request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/blood/requests/:id - Cancel/reject request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!BLOOD_BANK_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || body.notes

    const bloodRequest = await prisma.bloodRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        notes: bloodRequest?.notes
          ? `${bloodRequest.notes}\n\nRejection reason: ${reason}`
          : `Rejection reason: ${reason}`,
      },
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
      },
    })

    return NextResponse.json(bloodRequest)
  } catch (error) {
    console.error('Error rejecting blood request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}