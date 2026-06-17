import { z } from 'zod'

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  emergencyContact: z.string().optional(),
})

const transferSchema = z.object({
  patientId: z.string().min(1),
  priority: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
  notes: z.string().max(500).optional(),
})

const alertSchema = z.object({
  patientId: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  location: z.string().min(1),
  description: z.string().optional(),
})

const vitalSignsSchema = z.object({
  patientId: z.string().min(1),
  bloodPressureSystolic: z.number().int().positive().optional(),
  bloodPressureDiastolic: z.number().int().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  oxygenSaturation: z.number().int().min(0).max(100).optional(),
  respiratoryRate: z.number().int().positive().optional(),
})

const bloodUnitSchema = z.object({
  bloodType: z.string().min(1),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
  unitNumber: z.string().min(1),
  volume: z.number().int().positive(),
  collectionDate: z.string().datetime(),
  donorId: z.string().optional().nullable(),
})

const donorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  bloodType: z.string().min(1),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
  lastDonation: z.string().datetime().optional(),
})

const bloodRequestSchema = z.object({
  patientId: z.string().min(1),
  bloodType: z.string().min(1),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
  unitsRequired: z.number().int().positive(),
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
  notes: z.string().optional(),
})

const bedSchema = z.object({
  bedNumber: z.string().min(1),
  ward: z.string().min(1),
  bedType: z.enum(['ICU', 'ICCU', 'NICU', 'PICU']),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).optional(),
})

const stockAlertSchema = z.object({
  bloodType: z.string().min(1),
  rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
  minimumThreshold: z.number().int().positive(),
  isEnabled: z.boolean().optional(),
})

const assignmentSchema = z.object({
  bedId: z.string().uuid(),
  patientId: z.string().uuid(),
  notes: z.string().optional(),
})

describe('Patient Schema Validation', () => {
  it('should validate a valid patient', () => {
    const validPatient = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15T00:00:00Z',
      gender: 'MALE',
      bloodType: 'A',
      allergies: ['Peanuts'],
      medicalConditions: ['Diabetes'],
      emergencyContact: '555-1234',
    }
    expect(() => patientSchema.parse(validPatient)).not.toThrow()
  })

  it('should reject empty first name', () => {
    const invalidPatient = {
      firstName: '',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15T00:00:00Z',
      gender: 'MALE',
    }
    expect(() => patientSchema.parse(invalidPatient)).toThrow()
  })

  it('should reject invalid gender', () => {
    const invalidPatient = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15T00:00:00Z',
      gender: 'INVALID',
    }
    expect(() => patientSchema.parse(invalidPatient)).toThrow()
  })

  it('should reject invalid date format', () => {
    const invalidPatient = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15',
      gender: 'MALE',
    }
    expect(() => patientSchema.parse(invalidPatient)).toThrow()
  })

  it('should accept optional fields', () => {
    const minimalPatient = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15T00:00:00Z',
      gender: 'MALE',
    }
    expect(() => patientSchema.parse(minimalPatient)).not.toThrow()
  })
})

describe('Transfer Schema Validation', () => {
  it('should validate a valid transfer', () => {
    const validTransfer = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      priority: 'URGENT',
      notes: 'Patient requires immediate ICU admission',
    }
    expect(() => transferSchema.parse(validTransfer)).not.toThrow()
  })

  it('should reject empty patientId', () => {
    const invalidTransfer = {
      patientId: '',
      priority: 'ROUTINE',
    }
    expect(() => transferSchema.parse(invalidTransfer)).toThrow()
  })

  it('should reject invalid priority', () => {
    const invalidTransfer = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      priority: 'INVALID',
    }
    expect(() => transferSchema.parse(invalidTransfer)).toThrow()
  })

  it('should reject notes over 500 characters', () => {
    const invalidTransfer = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      priority: 'ROUTINE',
      notes: 'a'.repeat(501),
    }
    expect(() => transferSchema.parse(invalidTransfer)).toThrow()
  })
})

describe('Alert Schema Validation', () => {
  it('should validate a valid alert', () => {
    const validAlert = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      severity: 'HIGH',
      location: 'Emergency Room',
      description: 'Patient showing critical symptoms',
    }
    expect(() => alertSchema.parse(validAlert)).not.toThrow()
  })

  it('should reject empty location', () => {
    const invalidAlert = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      severity: 'LOW',
      location: '',
    }
    expect(() => alertSchema.parse(invalidAlert)).toThrow()
  })

  it('should reject invalid severity', () => {
    const invalidAlert = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      severity: 'INVALID',
      location: 'Emergency Room',
    }
    expect(() => alertSchema.parse(invalidAlert)).toThrow()
  })
})

describe('Vital Signs Schema Validation', () => {
  it('should validate valid vital signs', () => {
    const validVitals = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 72,
      temperature: 98.6,
      oxygenSaturation: 98,
      respiratoryRate: 16,
    }
    expect(() => vitalSignsSchema.parse(validVitals)).not.toThrow()
  })

  it('should validate minimal vital signs', () => {
    const minimalVitals = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      heartRate: 72,
    }
    expect(() => vitalSignsSchema.parse(minimalVitals)).not.toThrow()
  })

  it('should reject negative heart rate', () => {
    const invalidVitals = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      heartRate: -1,
    }
    expect(() => vitalSignsSchema.parse(invalidVitals)).toThrow()
  })

  it('should reject oxygen saturation over 100', () => {
    const invalidVitals = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      oxygenSaturation: 101,
    }
    expect(() => vitalSignsSchema.parse(invalidVitals)).toThrow()
  })

  it('should reject oxygen saturation under 0', () => {
    const invalidVitals = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      oxygenSaturation: -1,
    }
    expect(() => vitalSignsSchema.parse(invalidVitals)).toThrow()
  })
})

describe('Blood Unit Schema Validation', () => {
  it('should validate a valid blood unit', () => {
    const validUnit = {
      bloodType: 'A',
      rhFactor: 'POSITIVE',
      unitNumber: 'BU-001',
      volume: 450,
      collectionDate: '2024-01-15T00:00:00Z',
    }
    expect(() => bloodUnitSchema.parse(validUnit)).not.toThrow()
  })

  it('should reject non-positive volume', () => {
    const invalidUnit = {
      bloodType: 'A',
      rhFactor: 'POSITIVE',
      unitNumber: 'BU-001',
      volume: 0,
      collectionDate: '2024-01-15T00:00:00Z',
    }
    expect(() => bloodUnitSchema.parse(invalidUnit)).toThrow()
  })

  it('should reject invalid rhFactor', () => {
    const invalidUnit = {
      bloodType: 'A',
      rhFactor: 'INVALID',
      unitNumber: 'BU-001',
      volume: 450,
      collectionDate: '2024-01-15T00:00:00Z',
    }
    expect(() => bloodUnitSchema.parse(invalidUnit)).toThrow()
  })
})

describe('Donor Schema Validation', () => {
  it('should validate a valid donor', () => {
    const validDonor = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-9876',
      bloodType: 'O',
      rhFactor: 'NEGATIVE',
      lastDonation: '2023-01-15T00:00:00Z',
    }
    expect(() => donorSchema.parse(validDonor)).not.toThrow()
  })

  it('should reject invalid email', () => {
    const invalidDonor = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'not-an-email',
      phone: '555-9876',
      bloodType: 'O',
      rhFactor: 'NEGATIVE',
    }
    expect(() => donorSchema.parse(invalidDonor)).toThrow()
  })

  it('should reject empty phone', () => {
    const invalidDonor = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '',
      bloodType: 'O',
      rhFactor: 'NEGATIVE',
    }
    expect(() => donorSchema.parse(invalidDonor)).toThrow()
  })
})

describe('Blood Request Schema Validation', () => {
  it('should validate a valid blood request', () => {
    const validRequest = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      bloodType: 'A',
      rhFactor: 'POSITIVE',
      unitsRequired: 2,
      urgency: 'URGENT',
      notes: 'Surgery required',
    }
    expect(() => bloodRequestSchema.parse(validRequest)).not.toThrow()
  })

  it('should reject zero units required', () => {
    const invalidRequest = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      bloodType: 'A',
      rhFactor: 'POSITIVE',
      unitsRequired: 0,
      urgency: 'ROUTINE',
    }
    expect(() => bloodRequestSchema.parse(invalidRequest)).toThrow()
  })

  it('should reject negative units required', () => {
    const invalidRequest = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      bloodType: 'A',
      rhFactor: 'POSITIVE',
      unitsRequired: -1,
      urgency: 'ROUTINE',
    }
    expect(() => bloodRequestSchema.parse(invalidRequest)).toThrow()
  })
})

describe('Bed Schema Validation', () => {
  it('should validate a valid bed', () => {
    const validBed = {
      bedNumber: 'ICU-001',
      ward: 'ICU Ward A',
      bedType: 'ICU',
      status: 'AVAILABLE',
    }
    expect(() => bedSchema.parse(validBed)).not.toThrow()
  })

  it('should reject invalid bed type', () => {
    const invalidBed = {
      bedNumber: 'ICU-001',
      ward: 'ICU Ward A',
      bedType: 'INVALID',
    }
    expect(() => bedSchema.parse(invalidBed)).toThrow()
  })

  it('should reject invalid status', () => {
    const invalidBed = {
      bedNumber: 'ICU-001',
      ward: 'ICU Ward A',
      bedType: 'ICU',
      status: 'INVALID',
    }
    expect(() => bedSchema.parse(invalidBed)).toThrow()
  })
})

describe('Stock Alert Schema Validation', () => {
  it('should validate a valid stock alert', () => {
    const validAlert = {
      bloodType: 'A',
      rhFactor: 'POSITIVE',
      minimumThreshold: 10,
      isEnabled: true,
    }
    expect(() => stockAlertSchema.parse(validAlert)).not.toThrow()
  })

  it('should reject non-positive threshold', () => {
    const invalidAlert = {
      bloodType: 'A',
      rhFactor: 'POSITIVE',
      minimumThreshold: 0,
    }
    expect(() => stockAlertSchema.parse(invalidAlert)).toThrow()
  })

  it('should reject negative threshold', () => {
    const invalidAlert = {
      bloodType: 'A',
      rhFactor: 'POSITIVE',
      minimumThreshold: -5,
    }
    expect(() => stockAlertSchema.parse(invalidAlert)).toThrow()
  })
})

describe('Assignment Schema Validation', () => {
  it('should validate a valid assignment', () => {
    const validAssignment = {
      bedId: '123e4567-e89b-12d3-a456-426614174000',
      patientId: '123e4567-e89b-12d3-a456-426614174001',
      notes: 'Patient requires special monitoring',
    }
    expect(() => assignmentSchema.parse(validAssignment)).not.toThrow()
  })

  it('should reject invalid UUID format', () => {
    const invalidAssignment = {
      bedId: 'not-a-uuid',
      patientId: '123e4567-e89b-12d3-a456-426614174001',
    }
    expect(() => assignmentSchema.parse(invalidAssignment)).toThrow()
  })
})