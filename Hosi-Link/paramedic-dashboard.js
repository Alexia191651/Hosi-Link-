// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if (user) {
        document.getElementById('user-name').textContent = user.username;
        initializeDashboard();
    }
});

// Sample data
let emergencyRequests = [
    { id: 1, patientName: 'John Doe', condition: 'Cardiac Arrest', bloodType: 'O+', gps: '-1.2921, 36.8219', priority: 'critical', status: 'pending' },
    { id: 2, patientName: 'Jane Smith', condition: 'Trauma', bloodType: 'A-', gps: '-1.2850, 36.8300', priority: 'high', status: 'in-progress' },
    { id: 3, patientName: 'Robert Johnson', condition: 'Stroke', bloodType: 'B+', gps: '-1.3000, 36.8100', priority: 'high', status: 'completed' },
    { id: 4, patientName: 'Emily Davis', condition: 'Respiratory Failure', bloodType: 'AB+', gps: '-1.2950, 36.8250', priority: 'medium', status: 'pending' },
    { id: 5, patientName: 'Michael Wilson', condition: 'Severe Bleeding', bloodType: 'O-', gps: '-1.2880, 36.8350', priority: 'critical', status: 'in-progress' }
];

let facilities = [
    { name: 'Nairobi Hospital', level: 'Level 5', distance: 2.5, icuBeds: 8, bloodTypes: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-'] },
    { name: 'Kenyatta National Hospital', level: 'Level 5', distance: 3.2, icuBeds: 12, bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { name: 'Mater Hospital', level: 'Level 4', distance: 5.1, icuBeds: 5, bloodTypes: ['A+', 'B+', 'O+', 'O-'] },
    { name: 'MP Shah Hospital', level: 'Level 4', distance: 4.8, icuBeds: 6, bloodTypes: ['A+', 'A-', 'B+', 'O+', 'O-'] },
    { name: 'Aga Khan University Hospital', level: 'Level 5', distance: 6.3, icuBeds: 10, bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }
];

let transfers = [
    { id: 'TRF001', patientName: 'Sarah Mwangi', from: 'Scene', to: 'Nairobi Hospital', status: 'in-transit' },
    { id: 'TRF002', patientName: 'James Omondi', from: 'Mater Hospital', to: 'Kenyatta National', status: 'completed' },
    { id: 'TRF003', patientName: 'Grace Wanjiku', from: 'Scene', to: 'MP Shah Hospital', status: 'pending' }
];

let currentGPS = '-1.2921, 36.8219';

// Initialize dashboard
function initializeDashboard() {
    renderEmergencyRequests();
    renderFacilities();
    renderTransfers();
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(sectionId).style.display = 'block';
    
    const titles = {
        'dashboard': 'Dashboard',
        'emergency-requests': 'Emergency Requests',
        'facilities': 'Nearest Facilities',
        'transfers': 'Patient Transfers'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
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
        
        const priorityColors = {
            'low': '#2ecc71',
            'medium': '#f39c12',
            'high': '#e67e22',
            'critical': '#e74c3c'
        };
        
        requestCard.innerHTML = `
            <h4>${request.patientName}</h4>
            <p><strong>Condition:</strong> ${request.condition}</p>
            <p><strong>Blood Type:</strong> ${request.bloodType}</p>
            <p><strong>GPS:</strong> ${request.gps}</p>
            <span class="request-status" style="background: ${priorityColors[request.priority]}; color: white;">Priority: ${request.priority.toUpperCase()}</span>
            <span class="request-status ${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('-', ' ')}</span>
            <div class="request-actions">
                <button class="btn-view" onclick="viewRequestDetails(${request.id})">View Details</button>
                ${request.status === 'pending' ? '<button class="btn-update" onclick="updateRequestStatus(' + request.id + ', \'in-progress\')">Start Response</button>' : ''}
                ${request.status === 'in-progress' ? '<button class="btn-update" onclick="updateRequestStatus(' + request.id + ', \'completed\')">Complete</button>' : ''}
                ${request.status === 'in-progress' ? '<button class="btn-update" style="background: #667eea; color: white;" onclick="initiateTransfer(' + request.id + ')">Initiate Transfer</button>' : ''}
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

// Render facilities
function renderFacilities() {
    const facilitiesTable = document.getElementById('facilities-table');
    facilitiesTable.innerHTML = '';
    
    facilities.sort((a, b) => a.distance - b.distance).forEach(facility => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${facility.name}</td>
            <td>${facility.level}</td>
            <td>${facility.distance}</td>
            <td>${facility.icuBeds}</td>
            <td>${facility.bloodTypes.join(', ')}</td>
            <td>
                <button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #667eea; color: white;" onclick="selectFacility('${facility.name}')">Select</button>
                <button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #3498db; color: white;" onclick="getDirections('${facility.name}')">Get Directions</button>
            </td>
        `;
        facilitiesTable.appendChild(row);
    });
}

// Render transfers
function renderTransfers() {
    const transfersTable = document.getElementById('transfers-table');
    transfersTable.innerHTML = '';
    
    transfers.forEach(transfer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transfer.id}</td>
            <td>${transfer.patientName}</td>
            <td>${transfer.from}</td>
            <td>${transfer.to}</td>
            <td><span class="request-status ${transfer.status}">${transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1).replace('-', ' ')}</span></td>
            <td>
                ${transfer.status === 'pending' ? '<button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #2ecc71; color: white;" onclick="confirmTransfer(\'' + transfer.id + '\')">Confirm</button>' : ''}
                ${transfer.status === 'in-transit' ? '<button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #3498db; color: white;" onclick="completeTransfer(\'' + transfer.id + '\')">Complete</button>' : ''}
            </td>
        `;
        transfersTable.appendChild(row);
    });
}

// Emergency request modal functions
function openEmergencyModal() {
    document.getElementById('emergency-modal').classList.add('active');
    document.getElementById('patient-name').value = '';
    document.getElementById('patient-condition').value = '';
    document.getElementById('required-blood').value = '';
    document.getElementById('gps-coordinates').value = currentGPS;
    document.getElementById('priority').value = 'medium';
}

function closeEmergencyModal() {
    document.getElementById('emergency-modal').classList.remove('active');
}

function saveEmergencyRequest() {
    const patientName = document.getElementById('patient-name').value;
    const condition = document.getElementById('patient-condition').value;
    const bloodType = document.getElementById('required-blood').value;
    const gps = document.getElementById('gps-coordinates').value;
    const priority = document.getElementById('priority').value;
    
    if (patientName && condition && bloodType && gps) {
        const newRequest = {
            id: emergencyRequests.length + 1,
            patientName: patientName,
            condition: condition,
            bloodType: bloodType,
            gps: gps,
            priority: priority,
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
        alert(`Request Details:\n\nPatient: ${request.patientName}\nCondition: ${request.condition}\nBlood Type: ${request.bloodType}\nGPS: ${request.gps}\nPriority: ${request.priority}\nStatus: ${request.status}`);
    }
}

function updateRequestStatus(requestId, newStatus) {
    const request = emergencyRequests.find(r => r.id === requestId);
    if (request) {
        request.status = newStatus;
        renderEmergencyRequests();
    }
}

function initiateTransfer(requestId) {
    const request = emergencyRequests.find(r => r.id === requestId);
    if (request) {
        const transferId = 'TRF' + String(transfers.length + 1).padStart(3, '0');
        const newTransfer = {
            id: transferId,
            patientName: request.patientName,
            from: 'Scene',
            to: 'To be determined',
            status: 'pending'
        };
        
        transfers.push(newTransfer);
        renderTransfers();
        alert(`Transfer initiated for ${request.patientName}. Please select a destination facility.`);
    }
}

// Location functions
function updateLocation() {
    const newGPS = prompt('Enter current GPS coordinates (format: latitude, longitude):', currentGPS);
    if (newGPS) {
        currentGPS = newGPS;
        alert('Location updated successfully!');
    }
}

function locateFacilities() {
    alert('Locating nearest facilities based on current GPS coordinates...');
    renderFacilities();
}

// Facility functions
function selectFacility(facilityName) {
    alert(`Selected ${facilityName} as destination facility.`);
}

function getDirections(facilityName) {
    alert(`Getting directions to ${facilityName}...`);
}

// Transfer functions
function confirmTransfer(transferId) {
    const transfer = transfers.find(t => t.id === transferId);
    if (transfer) {
        transfer.status = 'in-transit';
        renderTransfers();
    }
}

function completeTransfer(transferId) {
    const transfer = transfers.find(t => t.id === transferId);
    if (transfer) {
        transfer.status = 'completed';
        renderTransfers();
    }
}
