import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/beds/:id - Get single bed
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const bed = await prisma.iCUBed.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { dischargeDate: null },
          include: {
            patient: true,
          },
        },
      },
    })

    if (!bed) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 })
    }

    return NextResponse.json(bed)
  } catch (error) {
    console.error('Error fetching bed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/beds/:id - Update bed (ICU Manager/Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ICU_MANAGER', 'ADMIN'].includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const bed = await prisma.iCUBed.update({
      where: { id },
      data: {
        ...body,
        isAvailable: body.status === 'AVAILABLE',
      },
    })

    return NextResponse.json(bed)
  } catch (error) {
    console.error('Error updating bed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/beds/:id - Delete bed (ICU Manager/Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ICU_MANAGER', 'ADMIN'].includes(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if bed has active assignments
    const activeAssignment = await prisma.bedAssignment.findFirst({
      where: { bedId: id, dischargeDate: null },
    })

    if (activeAssignment) {
      return NextResponse.json(
        { error: 'Cannot delete bed with active patient assignment' },
        { status: 400 }
      )
    }

    await prisma.iCUBed.delete({ where: { id } })

    return NextResponse.json({ message: 'Bed deleted' })
  } catch (error) {
    console.error('Error deleting bed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}