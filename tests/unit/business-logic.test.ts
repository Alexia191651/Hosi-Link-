describe('Business Logic - Donor Eligibility', () => {
  const MIN_DONATION_INTERVAL_DAYS = 90

  function isDonorEligible(lastDonation: Date | null): boolean {
    if (!lastDonation) return true
    
    const daysSinceLastDonation = Math.floor(
      (Date.now() - lastDonation.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceLastDonation >= MIN_DONATION_INTERVAL_DAYS
  }

  it('should allow donor with no previous donations', () => {
    expect(isDonorEligible(null)).toBe(true)
  })

  it('should allow donor with last donation > 90 days ago', () => {
    const lastDonation = new Date()
    lastDonation.setDate(lastDonation.getDate() - 100)
    expect(isDonorEligible(lastDonation)).toBe(true)
  })

  it('should reject donor with last donation < 90 days ago', () => {
    const lastDonation = new Date()
    lastDonation.setDate(lastDonation.getDate() - 30)
    expect(isDonorEligible(lastDonation)).toBe(false)
  })

  it('should reject donor with last donation exactly 89 days ago', () => {
    const lastDonation = new Date()
    lastDonation.setDate(lastDonation.getDate() - 89)
    expect(isDonorEligible(lastDonation)).toBe(false)
  })

  it('should allow donor with last donation exactly 90 days ago', () => {
    const lastDonation = new Date()
    lastDonation.setDate(lastDonation.getDate() - 90)
    expect(isDonorEligible(lastDonation)).toBe(true)
  })
})

describe('Business Logic - Blood Unit Expiry', () => {
  const BLOOD_EXPIRY_DAYS = 42

  function calculateExpiryDate(collectionDate: Date): Date {
    const expiryDate = new Date(collectionDate)
    expiryDate.setDate(expiryDate.getDate() + BLOOD_EXPIRY_DAYS)
    return expiryDate
  }

  function isBloodUnitExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate
  }

  function getDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  it('should calculate expiry date as 42 days from collection', () => {
    const collectionDate = new Date('2024-01-01')
    const expiryDate = calculateExpiryDate(collectionDate)
    expect(expiryDate.toDateString()).toBe(new Date('2024-02-12').toDateString())
  })

  it('should detect expired blood unit', () => {
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 10)
    expect(isBloodUnitExpired(expiredDate)).toBe(true)
  })

  it('should detect non-expired blood unit', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    expect(isBloodUnitExpired(futureDate)).toBe(false)
  })

  it('should calculate positive days until future expiry', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)
    expect(getDaysUntilExpiry(futureDate)).toBeGreaterThan(0)
  })

  it('should calculate negative days for past expiry', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 10)
    expect(getDaysUntilExpiry(pastDate)).toBeLessThan(0)
  })
})

describe('Business Logic - Stock Threshold Monitoring', () => {
  const DEFAULT_THRESHOLD = 10
  const CRITICAL_THRESHOLD = 5

  interface StockStatus {
    bloodType: string
    rhFactor: string
    currentStock: number
    threshold: number
    urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY' | null
  }

  function checkStockLevel(
    bloodType: string,
    rhFactor: string,
    currentStock: number,
    threshold: number = DEFAULT_THRESHOLD
  ): StockStatus {
    let urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY' | null = null

    if (currentStock < threshold) {
      if (currentStock < CRITICAL_THRESHOLD) {
        urgency = 'EMERGENCY'
      } else {
        urgency = 'URGENT'
      }
    } else {
      urgency = 'ROUTINE'
    }

    return {
      bloodType,
      rhFactor,
      currentStock,
      threshold,
      urgency,
    }
  }

  it('should mark stock as EMERGENCY when below 5 units', () => {
    const status = checkStockLevel('A', 'POSITIVE', 3)
    expect(status.urgency).toBe('EMERGENCY')
  })

  it('should mark stock as URGENT when between 5-10 units', () => {
    const status = checkStockLevel('A', 'POSITIVE', 7)
    expect(status.urgency).toBe('URGENT')
  })

  it('should mark stock as ROUTINE when above threshold', () => {
    const status = checkStockLevel('A', 'POSITIVE', 15)
    expect(status.urgency).toBe('ROUTINE')
  })

  it('should mark stock as URGENT when exactly at critical threshold', () => {
    const status = checkStockLevel('A', 'POSITIVE', 5)
    expect(status.urgency).toBe('URGENT')
  })

  it('should use custom threshold when provided', () => {
    const status = checkStockLevel('A', 'POSITIVE', 8, 15)
    expect(status.urgency).toBe('URGENT')
    expect(status.threshold).toBe(15)
  })

  it('should correctly identify low stock for all blood types', () => {
    const bloodTypes = ['A', 'B', 'AB', 'O']
    const rhFactors = ['POSITIVE', 'NEGATIVE']
    
    const lowStockItems: StockStatus[] = []
    
    for (const bt of bloodTypes) {
      for (const rh of rhFactors) {
        const status = checkStockLevel(bt, rh, 3)
        if (status.urgency === 'EMERGENCY') {
          lowStockItems.push(status)
        }
      }
    }
    
    expect(lowStockItems.length).toBe(8)
  })
})

describe('Business Logic - Blood Unit Reservation', () => {
  function getUnitsToReserve(
    availableUnits: Array<{ id: string; expiryDate: Date }>,
    unitsRequired: number
  ): string[] {
    return availableUnits
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
      .slice(0, unitsRequired)
      .map(u => u.id)
  }

  it('should reserve units with earliest expiry first', () => {
    const availableUnits = [
      { id: '1', expiryDate: new Date('2024-06-01') },
      { id: '2', expiryDate: new Date('2024-05-01') },
      { id: '3', expiryDate: new Date('2024-07-01') },
    ]
    
    const toReserve = getUnitsToReserve(availableUnits, 2)
    expect(toReserve).toEqual(['2', '1'])
  })

  it('should reserve exact number of units requested', () => {
    const availableUnits = [
      { id: '1', expiryDate: new Date('2024-06-01') },
      { id: '2', expiryDate: new Date('2024-05-15') },
      { id: '3', expiryDate: new Date('2024-06-15') },
    ]
    
    const toReserve = getUnitsToReserve(availableUnits, 2)
    expect(toReserve.length).toBe(2)
  })

  it('should handle request for more units than available', () => {
    const availableUnits = [
      { id: '1', expiryDate: new Date('2024-06-01') },
    ]
    
    const toReserve = getUnitsToReserve(availableUnits, 5)
    expect(toReserve.length).toBe(1)
  })

  it('should handle empty available units', () => {
    const availableUnits: Array<{ id: string; expiryDate: Date }> = []
    
    const toReserve = getUnitsToReserve(availableUnits, 2)
    expect(toReserve.length).toBe(0)
  })
})

describe('Business Logic - Patient Transfer Status', () => {
  type TransferStatus = 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
  type TransferPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY'

  function canCancelTransfer(status: TransferStatus): boolean {
    return status === 'PENDING'
  }

  function canUpdateStatus(
    currentStatus: TransferStatus,
    newStatus: TransferStatus
  ): boolean {
    const validTransitions: Record<TransferStatus, TransferStatus[]> = {
      PENDING: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['IN_TRANSIT', 'CANCELLED'],
      IN_TRANSIT: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    }
    return validTransitions[currentStatus].includes(newStatus)
  }

  function getProcessingOrder(priority: TransferPriority): number {
    const order: Record<TransferPriority, number> = {
      EMERGENCY: 1,
      URGENT: 2,
      ROUTINE: 3,
    }
    return order[priority]
  }

  it('should allow cancellation of PENDING transfers', () => {
    expect(canCancelTransfer('PENDING')).toBe(true)
  })

  it('should not allow cancellation of ACCEPTED transfers', () => {
    expect(canCancelTransfer('ACCEPTED')).toBe(false)
  })

  it('should not allow cancellation of IN_TRANSIT transfers', () => {
    expect(canCancelTransfer('IN_TRANSIT')).toBe(false)
  })

  it('should not allow cancellation of COMPLETED transfers', () => {
    expect(canCancelTransfer('COMPLETED')).toBe(false)
  })

  it('should allow valid status transition from PENDING to ACCEPTED', () => {
    expect(canUpdateStatus('PENDING', 'ACCEPTED')).toBe(true)
  })

  it('should not allow invalid transition from PENDING to COMPLETED', () => {
    expect(canUpdateStatus('PENDING', 'COMPLETED')).toBe(false)
  })

  it('should not allow transition from COMPLETED to any status', () => {
    expect(canUpdateStatus('COMPLETED', 'PENDING')).toBe(false)
  })

  it('should prioritize EMERGENCY over URGENT', () => {
    expect(getProcessingOrder('EMERGENCY')).toBeLessThan(getProcessingOrder('URGENT'))
  })

  it('should prioritize URGENT over ROUTINE', () => {
    expect(getProcessingOrder('URGENT')).toBeLessThan(getProcessingOrder('ROUTINE'))
  })
})

describe('Business Logic - Bed Assignment Validation', () => {
  type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'

  function canAssignBed(status: BedStatus): boolean {
    return status === 'AVAILABLE'
  }

  function canDischargeBed(status: BedStatus): boolean {
    return status === 'OCCUPIED'
  }

  function calculateBedOccupancyDays(admissionDate: Date, dischargeDate: Date | null): number {
    if (!dischargeDate) {
      return Math.floor((Date.now() - admissionDate.getTime()) / (1000 * 60 * 60 * 24))
    }
    return Math.floor((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  it('should allow assignment to AVAILABLE bed', () => {
    expect(canAssignBed('AVAILABLE')).toBe(true)
  })

  it('should not allow assignment to OCCUPIED bed', () => {
    expect(canAssignBed('OCCUPIED')).toBe(false)
  })

  it('should not allow assignment to MAINTENANCE bed', () => {
    expect(canAssignBed('MAINTENANCE')).toBe(false)
  })

  it('should allow discharge from OCCUPIED bed', () => {
    expect(canDischargeBed('OCCUPIED')).toBe(true)
  })

  it('should not allow discharge from AVAILABLE bed', () => {
    expect(canDischargeBed('AVAILABLE')).toBe(false)
  })

  it('should calculate occupancy days correctly', () => {
    const admission = new Date('2024-01-01')
    const discharge = new Date('2024-01-05')
    expect(calculateBedOccupancyDays(admission, discharge)).toBe(4)
  })

  it('should calculate current occupancy when not discharged', () => {
    const admission = new Date()
    admission.setDate(admission.getDate() - 3)
    const days = calculateBedOccupancyDays(admission, null)
    expect(days).toBeGreaterThanOrEqual(3)
  })
})

describe('Business Logic - Alert Severity Processing', () => {
  type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED'

  function getNotificationPriority(severity: AlertSeverity): number {
    const priority: Record<AlertSeverity, number> = {
      CRITICAL: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4,
    }
    return priority[severity]
  }

  function shouldAutoAcknowledge(severity: AlertSeverity): boolean {
    return severity === 'CRITICAL'
  }

  function canUpdateAlertStatus(current: AlertStatus, newStatus: AlertStatus): boolean {
    const validTransitions: Record<AlertStatus, AlertStatus[]> = {
      PENDING: ['ACKNOWLEDGED', 'RESOLVED'],
      ACKNOWLEDGED: ['RESOLVED', 'PENDING'],
      RESOLVED: [],
    }
    return validTransitions[current].includes(newStatus)
  }

  it('should assign highest priority to CRITICAL', () => {
    expect(getNotificationPriority('CRITICAL')).toBe(1)
  })

  it('should assign lowest priority to LOW', () => {
    expect(getNotificationPriority('LOW')).toBe(4)
  })

  it('should auto-acknowledge CRITICAL alerts', () => {
    expect(shouldAutoAcknowledge('CRITICAL')).toBe(true)
  })

  it('should not auto-acknowledge LOW alerts', () => {
    expect(shouldAutoAcknowledge('LOW')).toBe(false)
  })

  it('should allow PENDING to ACKNOWLEDGED transition', () => {
    expect(canUpdateAlertStatus('PENDING', 'ACKNOWLEDGED')).toBe(true)
  })

  it('should allow PENDING to RESOLVED transition', () => {
    expect(canUpdateAlertStatus('PENDING', 'RESOLVED')).toBe(true)
  })

  it('should not allow RESOLVED to PENDING transition', () => {
    expect(canUpdateAlertStatus('RESOLVED', 'PENDING')).toBe(false)
  })
})