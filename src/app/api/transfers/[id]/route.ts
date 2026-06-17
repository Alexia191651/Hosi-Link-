import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const ALLOWED_ROLES = ['PARAMEDIC', 'ICU_MANAGER', 'ADMIN'] as const

const updateTransferSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']).optional(),
  assignedBedId: z.string().optional().nullable(),
  notes: z.string().max(500).optional(),
})

// GET /api/transfers/:id - Get transfer by ID
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

    const transfer = await prisma.transferRequest.findUnique({
      where: { id },
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        assignedBed: true,
      },
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    // Paramedics can only view their own transfers
    if (session.user.role === 'PARAMEDIC' && transfer.requestedById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(transfer)
  } catch (error) {
    console.error('Error fetching transfer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/transfers/:id - Update transfer (ICU Manager assigns bed)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ICU Manager and Admin can update transfers
    if (session.user.role !== 'ICU_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTransferSchema.parse(body)

    const transfer = await prisma.transferRequest.update({
      where: { id },
      data: validatedData,
      include: {
        patient: true,
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        assignedBed: true,
      },
    })

    // If assigning a bed, update the bed status
    if (validatedData.assignedBedId && validatedData.status === 'ACCEPTED') {
      await prisma.iCUBed.update({
        where: { id: validatedData.assignedBedId },
        data: {
          status: 'OCCUPIED',
          isAvailable: false,
        },
      })
    }

    return NextResponse.json(transfer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating transfer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/transfers/:id - Cancel transfer (Paramedic can only cancel PENDING)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const cancellationReason = body.cancellationReason || body.notes

    // Find the transfer first
    const transfer = await prisma.transferRequest.findUnique({
      where: { id },
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    // Paramedics can only cancel their own PENDING transfers
    if (session.user.role === 'PARAMEDIC') {
      if (transfer.requestedById !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (transfer.status !== 'PENDING') {
        return NextResponse.json({ error: 'Only PENDING transfers can be cancelled' }, { status: 400 })
      }
    }

    // ICU Managers and Admins can cancel any transfer
    if (session.user.role === 'ICU_MANAGER' || session.user.role === 'ADMIN') {
      const updatedTransfer = await prisma.transferRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: transfer.notes
            ? `${transfer.notes}\n\nCancellation: ${cancellationReason}`
            : `Cancellation: ${cancellationReason}`,
        },
      })
      return NextResponse.json(updatedTransfer)
    }

    // For paramedics, update with cancellation notes
    const updatedTransfer = await prisma.transferRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: transfer.notes
          ? `${transfer.notes}\n\nCancellation: ${cancellationReason}`
          : `Cancellation: ${cancellationReason}`,
      },
    })

    return NextResponse.json(updatedTransfer)
  } catch (error) {
    console.error('Error cancelling transfer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}