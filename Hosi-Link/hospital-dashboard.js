// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if (user) {
        document.getElementById('user-name').textContent = user.username;
        initializeDashboard();
    }
});

// Sample data
let beds = [
    { id: 101, status: 'occupied' },
    { id: 102, status: 'available' },
    { id: 103, status: 'occupied' },
    { id: 104, status: 'maintenance' },
    { id: 105, status: 'available' },
    { id: 106, status: 'occupied' },
    { id: 107, status: 'available' },
    { id: 108, status: 'occupied' }
];

let bloodInventory = [
    { type: 'A+', quantity: 50 },
    { type: 'A-', quantity: 35 },
    { type: 'B+', quantity: 45 },
    { type: 'B-', quantity: 28 },
    { type: 'AB+', quantity: 22 },
    { type: 'AB-', quantity: 10 },
    { type: 'O+', quantity: 55 },
    { type: 'O-', quantity: 30 }
];

let emergencyRequests = [
    { id: 1, name: 'John Doe', reason: 'Trauma', bloodType: 'O+', status: 'pending' },
    { id: 2, name: 'Jane Smith', reason: 'Surgery', bloodType: 'A-', status: 'in-progress' },
    { id: 3, name: 'Robert Johnson', reason: 'Accident', bloodType: 'B+', status: 'completed' },
    { id: 4, name: 'Emily Davis', reason: 'Emergency', bloodType: 'AB+', status: 'pending' },
    { id: 5, name: 'Michael Wilson', reason: 'Cardiac', bloodType: 'O-', status: 'in-progress' }
];

// Initialize dashboard
function initializeDashboard() {
    renderBeds();
    renderBloodInventory();
    renderEmergencyRequests();
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'icu-beds': 'ICU Bed Management',
        'blood-inventory': 'Blood Bank Inventory',
        'emergency-requests': 'Emergency Service Requests'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    // Update active nav link
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Render beds
function renderBeds() {
    const bedGrid = document.getElementById('bed-grid');
    bedGrid.innerHTML = '';
    
    beds.forEach(bed => {
        const bedCard = document.createElement('div');
        bedCard.className = `bed-card ${bed.status}`;
        bedCard.innerHTML = `
            <h4>Bed ${bed.id}</h4>
            <span class="status">${bed.status.charAt(0).toUpperCase() + bed.status.slice(1).replace('-', ' ')}</span>
            <button onclick="updateBedStatus(${bed.id})">Update Status</button>
        `;
        bedGrid.appendChild(bedCard);
    });
}

// Render blood inventory
function renderBloodInventory() {
    const bloodGrid = document.getElementById('blood-grid');
    bloodGrid.innerHTML = '';
    
    bloodInventory.forEach(blood => {
        const bloodCard = document.createElement('div');
        bloodCard.className = 'blood-card';
        bloodCard.innerHTML = `
            <h4>${blood.type}</h4>
            <div class="quantity">${blood.quantity} bags</div>
            <button onclick="updateBloodInventory('${blood.type}')">Update</button>
        `;
        bloodGrid.appendChild(bloodCard);
    });
}

// Render emergency requests
function renderEmergencyRequests() {
    const incomingContainer = document.getElementById('incoming-requests');
    const progressContainer = document.getElementById('progress-requests');
    const completedContainer = document.getElementById('completed-requests');
    
    incomingContainer.innerHTML = '';
    progressContainer.innerHTML = '';
    completedContainer.innerHTML = '';
    
    emergencyRequests.forEach(request => {
        const requestCard = document.createElement('div');
        requestCard.className = 'request-card';
        requestCard.innerHTML = `
            <h4>${request.name}</h4>
            <p><strong>Reason:</strong> ${request.reason}</p>
            <p><strong>Blood Type:</strong> ${request.bloodType}</p>
            <span class="request-status ${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('-', ' ')}</span>
            <div class="request-actions">
                <button class="btn-view" onclick="viewRequestDetails(${request.id})">View Details</button>
                ${request.status === 'pending' ? '<button class="btn-update" onclick="updateRequestStatus(' + request.id + ', \'in-progress\')">Update Status</button>' : ''}
                ${request.status === 'in-progress' ? '<button class="btn-update" onclick="updateRequestStatus(' + request.id + ', \'completed\')">Complete</button>' : ''}
                ${request.status === 'completed' ? '<button class="btn-archive" onclick="archiveRequest(' + request.id + ')">Archive</button>' : ''}
            </div>
        `;
        
        if (request.status === 'pending') {
            incomingContainer.appendChild(requestCard);
        } else if (request.status === 'in-progress') {
            progressContainer.appendChild(requestCard);
        } else {
            completedContainer.appendChild(requestCard);
        }
    });
}

// Bed modal functions
function openBedModal() {
    document.getElementById('bed-modal').classList.add('active');
    document.getElementById('bed-number').value = '';
    document.getElementById('bed-status').value = 'available';
}

function closeBedModal() {
    document.getElementById('bed-modal').classList.remove('active');
}

function saveBedStatus() {
    const bedNumber = document.getElementById('bed-number').value;
    const status = document.getElementById('bed-status').value;
    
    if (bedNumber) {
        const bedId = parseInt(bedNumber.replace(/\D/g, ''));
        const existingBed = beds.find(b => b.id === bedId);
        
        if (existingBed) {
            existingBed.status = status;
        } else {
            beds.push({ id: bedId, status: status });
        }
        
        renderBeds();
        closeBedModal();
    }
}

function updateBedStatus(bedId) {
    const bed = beds.find(b => b.id === bedId);
    if (bed) {
        document.getElementById('bed-number').value = `Bed ${bedId}`;
        document.getElementById('bed-status').value = bed.status;
        openBedModal();
    }
}

// Blood inventory modal functions
function openBloodModal() {
    document.getElementById('blood-modal').classList.add('active');
    document.getElementById('blood-type').value = 'A+';
    document.getElementById('blood-quantity').value = '';
}

function closeBloodModal() {
    document.getElementById('blood-modal').classList.remove('active');
}

function saveBloodInventory() {
    const bloodType = document.getElementById('blood-type').value;
    const quantity = parseInt(document.getElementById('blood-quantity').value);
    
    if (bloodType && quantity >= 0) {
        const existingBlood = bloodInventory.find(b => b.type === bloodType);
        
        if (existingBlood) {
            existingBlood.quantity = quantity;
        } else {
            bloodInventory.push({ type: bloodType, quantity: quantity });
        }
        
        renderBloodInventory();
        closeBloodModal();
    }
}

function updateBloodInventory(bloodType) {
    const blood = bloodInventory.find(b => b.type === bloodType);
    if (blood) {
        document.getElementById('blood-type').value = bloodType;
        document.getElementById('blood-quantity').value = blood.quantity;
        openBloodModal();
    }
}

// Emergency request modal functions
function openEmergencyModal() {
    document.getElementById('emergency-modal').classList.add('active');
    document.getElementById('patient-name').value = '';
    document.getElementById('patient-reason').value = '';
    document.getElementById('required-blood').value = '';
}

function closeEmergencyModal() {
    document.getElementById('emergency-modal').classList.remove('active');
}

function saveEmergencyRequest() {
    const name = document.getElementById('patient-name').value;
    const reason = document.getElementById('patient-reason').value;
    const bloodType = document.getElementById('required-blood').value;
    
    if (name && reason && bloodType) {
        const newRequest = {
            id: emergencyRequests.length + 1,
            name: name,
            reason: reason,
            bloodType: bloodType,
            status: 'pending'
        };
        
        emergencyRequests.push(newRequest);
        renderEmergencyRequests();
        closeEmergencyModal();
    }
}

function viewRequestDetails(requestId) {
    const request = emergencyRequests.find(r => r.id === requestId);
    if (request) {
        alert(`Request Details:\n\nName: ${request.name}\nReason: ${request.reason}\nBlood Type: ${request.bloodType}\nStatus: ${request.status}`);
    }
}

function updateRequestStatus(requestId, newStatus) {
    const request = emergencyRequests.find(r => r.id === requestId);
    if (request) {
        request.status = newStatus;
        renderEmergencyRequests();
    }
}

function archiveRequest(requestId) {
    const index = emergencyRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
        emergencyRequests.splice(index, 1);
        renderEmergencyRequests();
    }
}
