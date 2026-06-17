import fetch from 'node-fetch'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'

let authToken: string = ''
let testPatientId: string = ''
let testDonorId: string = ''
let testBloodUnitId: string = ''
let testAlertId: string = ''
let testTransferId: string = ''
let testBedId: string = ''
let testBloodRequestId: string = ''

const testUsers = {
  paramedic: { email: 'paramedic@test.com', password: 'Test123!', role: 'PARAMEDIC' },
  icuManager: { email: 'icu@test.com', password: 'Test123!', role: 'ICU_MANAGER' },
  bloodBank: { email: 'bloodbank@test.com', password: 'Test123!', role: 'BLOODBANK_STAFF' },
  admin: { email: 'admin@test.com', password: 'Test123!', role: 'ADMIN' },
}

async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (response.ok) {
    const data = await response.json()
    return data.accessToken || ''
  }
  return ''
}

describe('Authentication API Tests', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await fetch(`${API_BASE_URL}/patients`)
    expect(response.status).toBe(401)
  })

  it('should reject invalid credentials', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid@test.com', password: 'wrong' }),
    })
    expect(response.status).toBe(401)
  })
})

describe('Patients API Tests', () => {
  beforeAll(async () => {
    authToken = await loginUser(testUsers.admin.email, testUsers.admin.password)
  })

  it('should list patients with authentication', async () => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('should create a new patient', async () => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: '1990-01-15T00:00:00Z',
        gender: 'MALE',
        bloodType: 'A',
        allergies: ['Peanuts'],
        medicalConditions: ['None'],
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    testPatientId = data.id
    expect(data.firstName).toBe('Test')
  })

  it('should get patient by ID', async () => {
    const response = await fetch(`${API_BASE_URL}/patients/${testPatientId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe(testPatientId)
  })

  it('should update patient', async () => {
    const response = await fetch(`${API_BASE_URL}/patients/${testPatientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ firstName: 'Updated' }),
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.firstName).toBe('Updated')
  })

  it('should search patients', async () => {
    const response = await fetch(`${API_BASE_URL}/patients?search=Test`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })
})

describe('Emergency Alerts API Tests', () => {
  beforeAll(async () => {
    if (!authToken) {
      authToken = await loginUser(testUsers.admin.email, testUsers.admin.password)
    }
  })

  it('should create a new alert', async () => {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        severity: 'HIGH',
        location: 'Emergency Room',
        description: 'Test alert',
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    testAlertId = data.id
    expect(data.severity).toBe('HIGH')
  })

  it('should list alerts', async () => {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('should get alert by ID', async () => {
    const response = await fetch(`${API_BASE_URL}/alerts/${testAlertId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
  })

  it('should update alert status', async () => {
    const response = await fetch(`${API_BASE_URL}/alerts/${testAlertId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'ACKNOWLEDGED' }),
    })
    expect(response.status).toBe(200)
  })
})

describe('Transfer Requests API Tests', () => {
  beforeAll(async () => {
    if (!authToken) {
      authToken = await loginUser(testUsers.admin.email, testUsers.admin.password)
    }
  })

  it('should create a new transfer', async () => {
    const response = await fetch(`${API_BASE_URL}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        priority: 'URGENT',
        notes: 'Test transfer',
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    testTransferId = data.id
    expect(data.priority).toBe('URGENT')
  })

  it('should list transfers', async () => {
    const response = await fetch(`${API_BASE_URL}/transfers`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
  })

  it('should get transfer by ID', async () => {
    const response = await fetch(`${API_BASE_URL}/transfers/${testTransferId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
  })

  it('should update transfer status', async () => {
    const response = await fetch(`${API_BASE_URL}/transfers/${testTransferId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    })
    expect(response.status).toBe(200)
  })
})

describe('ICU Beds API Tests', () => {
  beforeAll(async () => {
    if (!authToken) {
      authToken = await loginUser(testUsers.admin.email, testUsers.admin.password)
    }
  })

  it('should list beds', async () => {
    const response = await fetch(`${API_BASE_URL}/beds`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
  })

  it('should create a new bed', async () => {
    const response = await fetch(`${API_BASE_URL}/beds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        bedNumber: 'TEST-001',
        ward: 'Test Ward',
        bedType: 'ICU',
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    testBedId = data.id
    expect(data.bedNumber).toBe('TEST-001')
  })

  it('should get available beds', async () => {
    const response = await fetch(`${API_BASE_URL}/beds/available`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
  })

  it('should update bed status', async () => {
    const response = await fetch(`${API_BASE_URL}/beds/${testBedId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'MAINTENANCE' }),
    })
    expect(response.status).toBe(200)
  })
})

describe('Blood Bank API Tests', () => {
  beforeAll(async () => {
    if (!authToken) {
      authToken = await loginUser(testUsers.bloodBank.email, testUsers.bloodBank.password)
    }
  })

  describe('Donors', () => {
    it('should register a new donor', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/donors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Donor',
          email: `donor${Date.now()}@test.com`,
          phone: '555-0000',
          bloodType: 'O',
          rhFactor: 'NEGATIVE',
        }),
      })
      expect(response.status).toBe(201)
      const data = await response.json()
      testDonorId = data.id
      expect(data.firstName).toBe('Test')
    })

    it('should list donors', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/donors`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).toBe(200)
    })
  })

  describe('Blood Units', () => {
    it('should add a new blood unit', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          bloodType: 'A',
          rhFactor: 'POSITIVE',
          unitNumber: `BU-${Date.now()}`,
          volume: 450,
          collectionDate: new Date().toISOString(),
          donorId: testDonorId,
        }),
      })
      expect(response.status).toBe(201)
      const data = await response.json()
      testBloodUnitId = data.id
      expect(data.bloodType).toBe('A')
    })

    it('should list blood units', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/units`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).toBe(200)
    })

    it('should update blood unit status', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/units/${testBloodUnitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: 'RESERVED' }),
      })
      expect(response.status).toBe(200)
    })
  })

  describe('Blood Requests', () => {
    it('should create a blood request', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          patientId: testPatientId,
          bloodType: 'A',
          rhFactor: 'POSITIVE',
          unitsRequired: 2,
          urgency: 'URGENT',
        }),
      })
      expect(response.status).toBe(201)
      const data = await response.json()
      testBloodRequestId = data.id
      expect(data.unitsRequired).toBe(2)
    })

    it('should list blood requests', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/requests`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).toBe(200)
    })

    it('should update blood request status', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/requests/${testBloodRequestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      expect(response.status).toBe(200)
    })
  })

  describe('Inventory', () => {
    it('should get inventory summary', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/inventory`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.inventory).toBeDefined()
    })

    it('should check inventory and create auto-requests', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/check-inventory`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.results).toBeDefined()
    })
  })

  describe('Stock Alerts', () => {
    it('should setup stock alerts', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/setup-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ threshold: 10 }),
      })
      expect(response.status).toBe(200)
    })

    it('should list stock alerts', async () => {
      const response = await fetch(`${API_BASE_URL}/blood/alerts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      expect(response.status).toBe(200)
    })
  })
})

describe('Vital Signs API Tests', () => {
  beforeAll(async () => {
    if (!authToken) {
      authToken = await loginUser(testUsers.paramedic.email, testUsers.paramedic.password)
    }
  })

  it('should record vital signs', async () => {
    const response = await fetch(`${API_BASE_URL}/vitals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        patientId: testPatientId,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 98,
        respiratoryRate: 16,
      }),
    })
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.heartRate).toBe(72)
  })

  it('should list vital signs', async () => {
    const response = await fetch(`${API_BASE_URL}/vitals?patientId=${testPatientId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
  })

  it('should get patient vitals', async () => {
    const response = await fetch(`${API_BASE_URL}/vitals/patient/${testPatientId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
  })
})

describe('Bed Assignments API Tests', () => {
  beforeAll(async () => {
    if (!authToken) {
      authToken = await loginUser(testUsers.icuManager.email, testUsers.icuManager.password)
    }
  })

  it('should create bed assignment', async () => {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        bedId: testBedId,
        patientId: testPatientId,
        notes: 'Test assignment',
      }),
    })
    expect(response.status).toBe(201)
  })

  it('should list assignments', async () => {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    expect(response.status).toBe(200)
  })
})

describe('Role-Based Access Control Tests', () => {
  it('should deny paramedic access to blood bank endpoints', async () => {
    const token = await loginUser(testUsers.paramedic.email, testUsers.paramedic.password)
    const response = await fetch(`${API_BASE_URL}/blood/units`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.status).toBe(403)
  })

  it('should deny blood bank staff access to bed management', async () => {
    const token = await loginUser(testUsers.bloodBank.email, testUsers.bloodBank.password)
    const response = await fetch(`${API_BASE_URL}/beds`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.status).toBe(403)
  })

  it('should deny non-admin from deleting patients', async () => {
    const token = await loginUser(testUsers.paramedic.email, testUsers.paramedic.password)
    const response = await fetch(`${API_BASE_URL}/patients/${testPatientId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.status).toBe(403)
  })
})