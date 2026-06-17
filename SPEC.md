# HOSI-LINK Healthcare System Specification

## 1. Project Overview

### 1.1 Project Name
**HOSI-LINK** (Hospital Link System)

### 1.2 Project Type
Full-stack web application using Next.js (JavaScript)

### 1.3 Project Description
HOSI-LINK is a centralized healthcare management system designed to streamline coordination between paramedics, ICU bed management staff, and blood bank personnel. The system enables real-time patient intake, ICU bed allocation, and blood inventory management to improve emergency response and patient care outcomes.

### 1.4 Technology Stack
- **Frontend & Backend**: Next.js (JavaScript)
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js
- **State Management**: React Context + SWR
- **UI Framework**: Custom CSS with CSS Modules
- **API**: RESTful via Next.js API Routes

---

## 2. Actor Definitions

### 2.1 Paramedic
| Attribute | Description |
|-----------|-------------|
| Role Code | PARAMEDIC |
| Description | Emergency medical personnel who respond to calls, provide pre-hospital care, and transport patients |
| Responsibilities | Patient intake, emergency alerts, patient transfer requests, vital signs recording |
| Access Level | Read/Write own reports, Read ICU bed availability, Create transfer requests |

### 2.2 ICU Bed Manager
| Attribute | Description |
|-----------|-------------|
| Role Code | ICU_MANAGER |
| Description | Hospital staff responsible for managing ICU bed allocation and patient flow |
| Responsibilities | Bed availability tracking, patient admission/discharge, bed assignment, transfer acceptance |
| Access Level | Full CRUD on ICU beds, Manage patient bed assignments, View all incoming transfers |

### 2.3 Blood Bank Staff
| Attribute | Description |
|-----------|-------------|
| Role Code | BLOODBANK_STAFF |
| Description | Personnel managing blood inventory, donors, and blood product distribution |
| Responsibilities | Blood inventory management, donor records, blood request fulfillment, stock alerts |
| Access Level | Full CRUD on blood inventory, Manage donors, Process blood requests |

### 2.4 System Administrator
| Attribute | Description |
|-----------|-------------|
| Role Code | ADMIN |
| Description | System administration personnel |
| Responsibilities | User management, system configuration, audit logs |
| Access Level | Full system access |

---

## 3. Use Case Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            HOSI-LINK Use Cases                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
    │  Paramedic   │          │ ICU Manager  │          │Blood Bank    │
    │              │          │              │          │   Staff      │
    └──────┬───────┘          └──────┬───────┘          └──────┬───────┘
           │                         │                         │
           ▼                         ▼                         ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                         Use Cases                                    │
    ├─────────────────────────────────────────────────────────────────────┤
    │                                                                      │
    │  [UC-001] Register New Patient         [UC-007] View ICU Bed List   │
    │  [UC-002] Record Vital Signs          [UC-008] Update Bed Status   │
    │  [UC-003] Send Emergency Alert        [UC-009] Admit Patient to Bed│
    │  [UC-004] Create Transfer Request     [UC-010] Discharge Patient  │
    │  [UC-005] View Transfer Status        [UC-011] Manage Blood Stock │
    │  [UC-006] Cancel Transfer Request     [UC-012] Register Donor     │
    │                                     [UC-013] Process Blood Request│
    │                                     [UC-014] View Blood Requests   │
    │                                     [UC-015] Set Stock Alert       │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Domain Model (Class Diagram)

### 4.1 Core Entities

```
┌─────────────────────────┐       ┌─────────────────────────┐
│        User             │       │        Patient           │
├─────────────────────────┤       ├─────────────────────────┤
│ - id: UUID              │       │ - id: UUID               │
│ - email: String        │       │ - firstName: String      │
│ - password: String      │◄──────│ - lastName: String       │
│ - role: Enum           │       │ - dateOfBirth: Date      │
│ - firstName: String    │       │ - gender: Enum            │
│ - lastName: String     │       │ - bloodType: String       │
│ - createdAt: Date      │       │ - allergies: String[]    │
│ - updatedAt: Date      │       │ - medicalConditions: Str[]│
└─────────────────────────┘       │ - emergencyContact: Str  │
                                  │ - createdAt: Date        │
                                  │ - updatedAt: Date        │
                                  └─────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EmergencyAlert                                    │
├─────────────────────────────────────────────────────────────────────┤
│ - id: UUID                                                         │
│ - patientId: UUID (FK)                                            │
│ - paramedicId: UUID (FK)                                          │
│ - severity: Enum (LOW, MEDIUM, HIGH, CRITICAL)                   │
│ - location: String                                                │
│ - description: String                                             │
│ - status: Enum (PENDING, ACKNOWLEDGED, RESOLVED)                  │
│ - createdAt: Date                                                 │
│ - updatedAt: Date                                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐       ┌─────────────────────────┐
│    TransferRequest       │       │        ICUBed           │
├─────────────────────────┤       ├─────────────────────────┤
│ - id: UUID              │       │ - id: UUID               │
│ - patientId: UUID (FK) │       │ - bedNumber: String      │
│ - requestedBy: UUID(FK)│       │ - ward: String           │
│ - assignedBedId: UUID  │       │ - bedType: Enum          │
│ - status: Enum         │◄──────│ - status: Enum           │
│ - priority: Enum        │       │ - isAvailable: Boolean   │
│ - notes: String        │       │ - createdAt: Date        │
│ - createdAt: Date      │       │ - updatedAt: Date        │
│ - updatedAt: Date      │       └─────────────────────────┘
└─────────────────────────┘                  │
                                             │ 1:1
                                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BedAssignment                                     │
├─────────────────────────────────────────────────────────────────────┤
│ - id: UUID                                                         │
│ - bedId: UUID (FK)                                                │
│ - patientId: UUID (FK)                                            │
│ - assignedBy: UUID (FK)                                           │
│ - admissionDate: Date                                             │
│ - dischargeDate: Date (nullable)                                  │
│ - notes: String                                                   │
│ - createdAt: Date                                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐       ┌─────────────────────────┐
│       BloodUnit         │       │        Donor             │
├─────────────────────────┤       ├─────────────────────────┤
│ - id: UUID              │       │ - id: UUID               │
│ - bloodType: String    │       │ - firstName: String      │
│ - rhFactor: Enum       │       │ - lastName: String       │
│ - unitNumber: String   │       │ - email: String          │
│ - volume: Integer      │       │ - phone: String          │
│ - collectionDate: Date│       │ - bloodType: String      │
│ - expiryDate: Date    │       │ - rhFactor: Enum         │
│ - status: Enum         │       │ - lastDonation: Date     │
│ - donorId: UUID (FK)  │◄──────│ - createdAt: Date        │
└─────────────────────────┘       │ - updatedAt: Date        │
                                  └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    BloodRequest                                      │
├─────────────────────────────────────────────────────────────────────┤
│ - id: UUID                                                         │
│ - patientId: UUID (FK)                                            │
│ - requestedBy: UUID (FK)                                          │
│ - bloodType: String                                               │
│ - rhFactor: Enum                                                  │
│ - unitsRequired: Integer                                          │
│ - urgency: Enum (ROUTINE, URGENT, EMERGENCY)                     │
│ - status: Enum (PENDING, APPROVED, FULFILLED, REJECTED)           │
│ - notes: String                                                   │
│ - fulfilledBy: UUID (FK)                                         │
│ - createdAt: Date                                                 │
│ - updatedAt: Date                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Enumerations

| Enum Name | Values |
|-----------|--------|
| UserRole | PARAMEDIC, ICU_MANAGER, BLOODBANK_STAFF, ADMIN |
| AlertSeverity | LOW, MEDIUM, HIGH, CRITICAL |
| AlertStatus | PENDING, ACKNOWLEDGED, RESOLVED |
| TransferStatus | PENDING, ACCEPTED, IN_TRANSIT, COMPLETED, CANCELLED |
| TransferPriority | ROUTINE, URGENT, EMERGENCY |
| BedStatus | AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED |
| BedType | ICU, ICCU, NICU, PICU |
| BloodUnitStatus | AVAILABLE, RESERVED, USED, EXPIRED, DISCARDED |
| BloodRequestStatus | PENDING, APPROVED, FULFILLED, REJECTED |
| BloodRequestUrgency | ROUTINE, URGENT, EMERGENCY |

---

## 5. Use Case Specifications

### 5.1 Paramedic Use Cases

#### UC-001: Register New Patient
**Actor**: Paramedic
**Pre-condition**: User is authenticated as Paramedic
**Post-condition**: New patient record created in system

**Flow**:
1. Paramedic navigates to "New Patient" form
2. Paramedic enters patient demographics (name, DOB, gender)
3. Paramedic records vital signs (BP, HR, temp, SpO2)
4. Paramedic notes allergies and medical conditions
5. System validates all required fields
6. System creates patient record
7. System returns success confirmation with patient ID

**Business Rules**:
- All patients must have unique identifier (auto-generated)
- At least first name, last name, and date of birth required
- Vital signs are optional but recommended

---

#### UC-002: Record Vital Signs
**Actor**: Paramedic
**Pre-condition**: Patient is registered in system
**Post-condition**: Vital signs recorded and stored

**Flow**:
1. Paramedic searches for existing patient
2. Paramedic opens vital signs recording form
3. Paramedic enters vital measurements
4. System timestamps the recording
5. System stores vital signs with patient association

**Business Rules**:
- Vital signs must be associated with existing patient
- Multiple vital sign entries allowed per patient
- Timestamp automatically captured

---

#### UC-003: Send Emergency Alert
**Actor**: Paramedic
**Pre-condition**: User is authenticated as Paramedic
**Post-condition**: Emergency alert created and visible to ICU managers

**Flow**:
1. Paramedic initiates new emergency alert
2. Paramedic selects or creates patient
3. Paramedic sets alert severity level
4. Paramedic enters location and description
5. System creates alert with PENDING status
6. Alert notification sent to ICU managers

**Business Rules**:
- Alert severity: LOW, MEDIUM, HIGH, CRITICAL
- CRITICAL alerts trigger immediate notifications
- Alert must be associated with a patient

---

#### UC-004: Create Transfer Request
**Actor**: Paramedic
**Pre-condition**: Patient is registered, alert sent
**Post-condition**: Transfer request created

**Flow**:
1. Paramedic views patient's emergency alert
2. Paramedic clicks "Request Transfer"
3. Paramedic selects priority (ROUTINE, URGENT, EMERGENCY)
4. Paramedic adds clinical notes
5. System creates transfer request with PENDING status
6. Request visible to ICU managers

**Business Rules**:
- Transfer request requires associated emergency alert
- Priority determines processing order
- Notes field limited to 500 characters

---

#### UC-005: View Transfer Status
**Actor**: Paramedic
**Pre-condition**: User is authenticated
**Post-condition**: Transfer request details displayed

**Flow**:
1. Paramedic navigates to "My Transfers"
2. System displays list of paramedic's transfer requests
3. Paramedic selects specific transfer
4. System shows full transfer details and status history

---

#### UC-006: Cancel Transfer Request
**Actor**: Paramedic
**Pre-condition**: Transfer request exists with PENDING status
**Post-condition**: Transfer request cancelled

**Flow**:
1. Paramedic views pending transfer request
2. Paramedic clicks "Cancel"
3. System prompts for confirmation
4. Paramedic confirms cancellation
5. System updates status to CANCELLED

**Business Rules**:
- Only PENDING transfers can be cancelled
- Cancellation reason required

---

### 5.2 ICU Bed Manager Use Cases

#### UC-007: View ICU Bed List
**Actor**: ICU Manager
**Pre-condition**: User is authenticated as ICU Manager
**Post-condition**: List of all ICU beds displayed

**Flow**:
1. ICU Manager navigates to "Bed Management"
2. System displays all beds with current status
3. Manager can filter by ward, bed type, availability
4. System shows bed availability count by category

**Business Rules**:
- Real-time bed status display
- Filters: ward, bed type, status

---

#### UC-008: Update Bed Status
**Actor**: ICU Manager
**Pre-condition**: User is authenticated as ICU Manager
**Post-condition**: Bed status updated

**Flow**:
1. ICU Manager selects a bed
2. Manager clicks "Update Status"
3. Manager selects new status
4. System validates status change
5. System updates bed status and timestamp

**Business Rules**:
- Cannot set OCCUPIED without patient assignment
- MAINTENANCE requires notes

---

#### UC-009: Admit Patient to Bed
**Actor**: ICU Manager
**Pre-condition**: Bed available, transfer request exists
**Post-condition**: Patient assigned to bed

**Flow**:
1. ICU Manager views pending transfer requests
2. Manager selects a transfer request
3. Manager assigns available bed
4. Manager confirms admission
5. System updates bed to OCCUPIED
6. System creates bed assignment record
7. System updates transfer status to ACCEPTED

**Business Rules**:
- Only AVAILABLE beds can be assigned
- Bed type must match patient requirements
- Assignment creates audit trail

---

#### UC-010: Discharge Patient
**Actor**: ICU Manager
**Pre-condition**: Bed is OCCUPIED
**Post-condition**: Patient discharged, bed becomes AVAILABLE

**Flow**:
1. ICU Manager selects occupied bed
2. Manager clicks "Discharge Patient"
3. Manager enters discharge notes
4. Manager confirms discharge
5. System updates bed to AVAILABLE
6. System records discharge date in assignment

**Business Rules**:
- Discharge date required
- Notes field limited to 500 characters

---

### 5.3 Blood Bank Staff Use Cases

#### UC-011: Manage Blood Stock
**Actor**: Blood Bank Staff
**Pre-condition**: User is authenticated as Blood Bank Staff
**Post-condition**: Blood inventory updated

**Flow**:
1. Blood Bank Staff navigates to "Blood Inventory"
2. System displays current blood stock by type
3. Staff can add new blood units
4. Staff can update unit status (reserve, use, discard)
5. System maintains audit trail of all changes

**Business Rules**:
- Each unit has unique unit number
- Expiry date automatically calculated from collection date (42 days for whole blood)
- Status changes logged

---

#### UC-012: Register Donor
**Actor**: Blood Bank Staff
**Pre-condition**: User is authenticated as Blood Bank Staff
**Post-condition**: Donor record created

**Flow**:
1. Blood Bank Staff navigates to "Donor Registration"
2. Staff enters donor information
3. System validates donor eligibility
4. System creates donor record
5. System assigns donor ID

**Business Rules**:
- Donor must be 18-65 years old
- Email and phone required
- Minimum 90 days between donations

---

#### UC-013: Process Blood Request
**Actor**: Blood Bank Staff
**Pre-condition**: Blood request exists with PENDING status
**Post-condition**: Request fulfilled or rejected

**Flow**:
1. Blood Bank Staff views pending blood requests
2. Staff checks available inventory
3. If available, staff reserves units
4. Staff updates request status to APPROVED/FULFILLED
5. System reduces available inventory
6. System notifies requester

**Business Rules**:
- Cannot fulfill if insufficient inventory
- Reserved units marked as UNAVAILABLE
- Emergency requests prioritized

---

#### UC-014: View Blood Requests
**Actor**: Blood Bank Staff
**Pre-condition**: User is authenticated as Blood Bank Staff
**Post-condition**: Blood request list displayed

**Flow**:
1. Blood Bank Staff navigates to "Blood Requests"
2. System displays all requests filtered by status
3. Staff can filter by urgency, blood type, date range
4. Staff can sort by urgency, date, status

---

#### UC-015: Set Stock Alert
**Actor**: Blood Bank Staff
**Pre-condition**: User is authenticated as Blood Bank Staff
**Post-condition**: Stock alert threshold configured

**Flow**:
1. Blood Bank Staff navigates to "Stock Alerts"
2. Staff selects blood type for alert
3. Staff sets minimum threshold
4. Staff enables/disables alert
5. System saves alert configuration

**Business Rules**:
- Threshold must be positive integer
- Alert triggers when inventory drops below threshold

---

## 6. Activity Diagrams

### 6.1 Patient Transfer Flow

```
┌─────────────┐
│  Paramedic  │
│  arrives    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Register Patient    │────Yes──► [New Patient]
│ (UC-001)            │
└──────┬──────┘
       │ No
       ▼
┌─────────────────────┐
│ Find Existing       │
│ Patient             │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Record Vital Signs  │
│ (UC-002)            │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Send Emergency      │────CRITICAL──► [Notify ICU Mgr]
│ Alert (UC-003)      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Create Transfer     │
│ Request (UC-004)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Pending   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ ICU Manager │────►│ Accept      │
│ reviews     │     │ Transfer    │
└─────────────┘     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Assign Bed  │
                     │ (UC-009)   │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Patient     │
                     │ Admitted    │
                     └─────────────┘
```

### 6.2 Blood Request Flow

```
┌─────────────────┐
│ Blood Request   │
│ Created         │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Check Inventory│
│ for Blood Type  │
└──────┬──────────┘
       │
       ▼
   ┌───┴───┐
   │Enough?│
   └───┬───┘
   Yes  │  No
   ┌────┴────┐
   ▼         ▼
┌────────┐  ┌────────────┐
│Reserve │  │ Set Status │
│Units   │  │ to PENDING │
└───┬────┘  │ (Await     │
    │       │  Stock)    │
    ▼       └────────────┘
┌────────────┐
│ Approve &  │
│ Fulfill    │
└─────┬──────┘
      │
      ▼
┌────────────┐
│ Reduce     │
│ Inventory  │
└─────┬──────┘
      │
      ▼
┌────────────┐
│ Notify      │
│ Requester   │
└────────────┘
```

---

## 7. Sequence Diagrams

### 7.1 Create Transfer Request Sequence

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│Paramedic │    │ Frontend │    │  API     │    │ Database │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Fill form  │               │               │
     │──────────────►│               │               │
     │               │               │               │
     │ 2. Submit    │               │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │ 3. POST      │               │
     │               │─────────────►│               │
     │               │               │               │
     │               │               │ 4. Insert    │
     │               │               │──────────────►│
     │               │               │               │
     │               │               │ 5. Return    │
     │               │               │◄──────────────│
     │               │               │               │
     │               │ 6. Response  │               │
     │               │◄─────────────│               │
     │               │               │               │
     │ 7. Success    │               │               │
     │◄──────────────│               │               │
     │               │               │               │
```

### 7.2 ICU Bed Assignment Sequence

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ICU Mgr   │    │ Frontend │    │  API     │    │ Database │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. View      │               │               │
     │ transfers   │               │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │ 2. GET       │               │
     │               │─────────────►│               │
     │               │               │               │
     │               │               │ 3. Query     │
     │               │               │──────────────►│
     │               │               │               │
     │               │               │ 4. Results   │
     │               │               │◄──────────────│
     │               │               │               │
     │               │ 5. Response  │               │
     │               │◄─────────────│               │
     │               │               │               │
     │ 6. Display   │               │               │
     │◄──────────────│               │               │
     │               │               │               │
     │ 7. Assign Bed│               │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │ 8. PUT      │               │
     │               │─────────────►│               │
     │               │               │               │
     │               │               │ 9. Update   │
     │               │               │──────────────►│
     │               │               │               │
     │               │               │10. Confirm  │
     │               │               │◄──────────────│
     │               │               │               │
     │              11. Response    │               │
     │               │◄─────────────│               │
     │               │               │               │
     │12. Confirmation│              │               │
     │◄──────────────│               │               │
     │               │               │               │
```

---

## 8. Database Schema

### 8.1 User Table
```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('PARAMEDIC', 'ICU_MANAGER', 'BLOODBANK_STAFF', 'ADMIN')),
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.2 Patient Table
```sql
CREATE TABLE "Patient" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  dateOfBirth DATE NOT NULL,
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  bloodType VARCHAR(10),
  allergies TEXT[],
  medicalConditions TEXT[],
  emergencyContact VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.3 EmergencyAlert Table
```sql
CREATE TABLE "EmergencyAlert" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID REFERENCES "Patient"(id),
  paramedicId UUID REFERENCES "User"(id),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  location VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACKNOWLEDGED', 'RESOLVED')),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.4 TransferRequest Table
```sql
CREATE TABLE "TransferRequest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID REFERENCES "Patient"(id),
  requestedBy UUID REFERENCES "User"(id),
  assignedBedId UUID REFERENCES "ICUBed"(id),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('ROUTINE', 'URGENT', 'EMERGENCY')),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.5 ICUBed Table
```sql
CREATE TABLE "ICUBed" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bedNumber VARCHAR(20) UNIQUE NOT NULL,
  ward VARCHAR(100) NOT NULL,
  bedType VARCHAR(20) NOT NULL CHECK (bedType IN ('ICU', 'ICCU', 'NICU', 'PICU')),
  status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
  isAvailable BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.6 BedAssignment Table
```sql
CREATE TABLE "BedAssignment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bedId UUID REFERENCES "ICUBed"(id),
  patientId UUID REFERENCES "Patient"(id),
  assignedBy UUID REFERENCES "User"(id),
  admissionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dischargeDate TIMESTAMP,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.7 BloodUnit Table
```sql
CREATE TABLE "BloodUnit" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloodType VARCHAR(10) NOT NULL,
  rhFactor VARCHAR(20) NOT NULL CHECK (rhFactor IN ('POSITIVE', 'NEGATIVE')),
  unitNumber VARCHAR(50) UNIQUE NOT NULL,
  volume INTEGER NOT NULL,
  collectionDate DATE NOT NULL,
  expiryDate DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'USED', 'EXPIRED', 'DISCARDED')),
  donorId UUID REFERENCES "Donor"(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.8 Donor Table
```sql
CREATE TABLE "Donor" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  bloodType VARCHAR(10) NOT NULL,
  rhFactor VARCHAR(20) NOT NULL CHECK (rhFactor IN ('POSITIVE', 'NEGATIVE')),
  lastDonation DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.9 BloodRequest Table
```sql
CREATE TABLE "BloodRequest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID REFERENCES "Patient"(id),
  requestedBy UUID REFERENCES "User"(id),
  bloodType VARCHAR(10) NOT NULL,
  rhFactor VARCHAR(20) NOT NULL CHECK (rhFactor IN ('POSITIVE', 'NEGATIVE')),
  unitsRequired INTEGER NOT NULL,
  urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('ROUTINE', 'URGENT', 'EMERGENCY')),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'FULFILLED', 'REJECTED')),
  notes TEXT,
  fulfilledBy UUID REFERENCES "User"(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.10 VitalSigns Table
```sql
CREATE TABLE "VitalSigns" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID REFERENCES "Patient"(id),
  recordedBy UUID REFERENCES "User"(id),
  bloodPressureSystolic INTEGER,
  bloodPressureDiastolic INTEGER,
  heartRate INTEGER,
  temperature DECIMAL(4,2),
  oxygenSaturation INTEGER,
  respiratoryRate INTEGER,
  recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.11 StockAlert Table
```sql
CREATE TABLE "StockAlert" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloodType VARCHAR(10) NOT NULL,
  rhFactor VARCHAR(20) NOT NULL,
  minimumThreshold INTEGER NOT NULL,
  isEnabled BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. API Endpoints

### 9.1 Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | User login | Public |
| GET | /api/auth/session | Get current session | Authenticated |

### 9.2 Patients
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/patients | List all patients | Paramedic, ICU Manager |
| GET | /api/patients/:id | Get patient by ID | Paramedic, ICU Manager |
| POST | /api/patients | Create new patient | Paramedic |
| PUT | /api/patients/:id | Update patient | Paramedic |

### 9.3 Emergency Alerts
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/alerts | List all alerts | Paramedic, ICU Manager |
| GET | /api/alerts/:id | Get alert by ID | Paramedic, ICU Manager |
| POST | /api/alerts | Create new alert | Paramedic |
| PUT | /api/alerts/:id | Update alert status | ICU Manager |
| GET | /api/alerts/pending | Get pending alerts | ICU Manager |

### 9.4 Transfer Requests
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/transfers | List all transfers | Paramedic, ICU Manager |
| GET | /api/transfers/:id | Get transfer by ID | Paramedic, ICU Manager |
| POST | /api/transfers | Create new transfer | Paramedic |
| PUT | /api/transfers/:id | Update transfer | ICU Manager |
| DELETE | /api/transfers/:id | Cancel transfer | Paramedic |
| GET | /api/transfers/pending | Get pending transfers | ICU Manager |

### 9.5 ICU Beds
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/beds | List all beds | All roles |
| GET | /api/beds/:id | Get bed by ID | ICU Manager |
| POST | /api/beds | Create new bed | ICU Manager |
| PUT | /api/beds/:id | Update bed | ICU Manager |
| GET | /api/beds/available | Get available beds | ICU Manager |

### 9.6 Bed Assignments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/assignments | List all assignments | ICU Manager |
| POST | /api/assignments | Create assignment | ICU Manager |
| PUT | /api/assignments/:id | Update assignment | ICU Manager |
| PUT | /api/assignments/:id/discharge | Discharge patient | ICU Manager |

### 9.7 Blood Units
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/blood/units | List all blood units | Blood Bank Staff |
| GET | /api/blood/units/:id | Get unit by ID | Blood Bank Staff |
| POST | /api/blood/units | Add new blood unit | Blood Bank Staff |
| PUT | /api/blood/units/:id | Update unit | Blood Bank Staff |
| GET | /api/blood/inventory | Get inventory summary | Blood Bank Staff |

### 9.8 Donors
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/blood/donors | List all donors | Blood Bank Staff |
| GET | /api/blood/donors/:id | Get donor by ID | Blood Bank Staff |
| POST | /api/blood/donors | Register new donor | Blood Bank Staff |
| PUT | /api/blood/donors/:id | Update donor | Blood Bank Staff |

### 9.9 Blood Requests
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/blood/requests | List all requests | Blood Bank Staff |
| GET | /api/blood/requests/:id | Get request by ID | Blood Bank Staff |
| POST | /api/blood/requests | Create new request | All roles |
| PUT | /api/blood/requests/:id | Update request status | Blood Bank Staff |
| GET | /api/blood/requests/pending | Get pending requests | Blood Bank Staff |

### 9.10 Stock Alerts
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/blood/alerts | List stock alerts | Blood Bank Staff |
| POST | /api/blood/alerts | Create stock alert | Blood Bank Staff |
| PUT | /api/blood/alerts/:id | Update stock alert | Blood Bank Staff |
| DELETE | /api/blood/alerts/:id | Delete stock alert | Blood Bank Staff |

### 9.11 Vital Signs
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/vitals/patient/:patientId | Get patient vitals | Paramedic, ICU Manager |
| POST | /api/vitals | Record vital signs | Paramedic |

---

## 10. UI/UX Design Guidelines

### 10.1 Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #1E3A5F | Headers, primary buttons |
| Secondary | #4A90A4 | Secondary elements, links |
| Accent | #FF6B6B | Alerts, urgent items, CTAs |
| Success | #28A745 | Success states, available |
| Warning | #FFC107 | Warnings, pending states |
| Danger | #DC3545 | Errors, critical alerts |
| Background | #F8FAFC | Page background |
| Surface | #FFFFFF | Cards, panels |
| Text Primary | #1A202C | Main text |
| Text Secondary | #718096 | Secondary text |

### 10.2 Typography
| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 32px | 700 |
| H2 | Inter | 24px | 600 |
| H3 | Inter | 20px | 600 |
| Body | Inter | 16px | 400 |
| Small | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |

### 10.3 Layout Structure
- **Header**: Fixed top, 64px height, contains logo, navigation, user menu
- **Sidebar**: Fixed left, 240px width, collapsible to 64px, role-based navigation
- **Main Content**: Fluid width, 24px padding, max-width 1400px centered
- **Cards**: 16px padding, 8px border-radius, subtle shadow

### 10.4 Responsive Breakpoints
| Breakpoint | Width | Description |
|------------|-------|-------------|
| Mobile | < 640px | Single column, hidden sidebar |
| Tablet | 640px - 1024px | Collapsed sidebar |
| Desktop | > 1024px | Full layout |

---

## 11. Security Requirements

### 11.1 Authentication
- Passwords must be hashed using bcrypt (cost factor 12)
- Session-based authentication via NextAuth.js
- JWT tokens with 24-hour expiration

### 11.2 Authorization
- Role-based access control (RBAC)
- All API endpoints require authentication
- Role checks on all mutations

### 11.3 Data Validation
- All inputs validated using Zod schema validation
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via React auto-escaping

### 11.4 Audit Logging
- All data mutations logged with user ID, timestamp, and changes
- Audit logs retained for 7 years

---

## 12. Non-Functional Requirements

### 12.1 Performance
- Page load time < 3 seconds
- API response time < 500ms (95th percentile)
- Support for 1000 concurrent users

### 12.2 Availability
- System uptime target: 99.5%
- Planned maintenance window: Sunday 2AM-4AM UTC

### 12.3 Scalability
- Horizontal scaling via container orchestration
- Database read replicas for reporting queries

---

## 13. Project Phases

### Phase 1: Foundation (Week 1-2)
- Setup Next.js project with TypeScript
- Configure Prisma with PostgreSQL
- Implement authentication system
- Create base UI components and layout

### Phase 2: Paramedic Module (Week 3-4)
- Patient registration and lookup
- Vital signs recording
- Emergency alerts
- Transfer request creation

### Phase 3: ICU Module (Week 5-6)
- Bed management dashboard
- Bed assignment and discharge
- Transfer request handling
- Real-time bed availability

### Phase 4: Blood Bank Module (Week 7-8)
- Blood inventory management
- Donor registration
- Blood request processing
- Stock alerts

### Phase 5: Testing & Polish (Week 9-10)
- Integration testing
- User acceptance testing
- Performance optimization
- Documentation

---

## 14. Success Criteria

| Metric | Target |
|--------|--------|
| All Use Cases Implemented | 100% |
| Unit Test Coverage | > 80% |
| Critical Bugs | 0 |
| High Priority Bugs | < 5 |
| User Satisfaction Score | > 4/5 |

---

*Document Version: 1.0*
*Created: 2026-05-29*
*Author: Claude Opus 4.7*