// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if (user) {
        document.getElementById('user-name').textContent = user.username;
        initializeDashboard();
    }
});

// Sample data
let bloodInventory = [
    { type: 'A+', quantity: 50 },
    { type: 'A-', quantity: 35 },
    { type: 'B+', quantity: 45 },
    { type: 'B-', quantity: 28 },
    { type: 'AB+', quantity: 22 },
    { type: 'AB-', quantity: 10 },
    { type: 'O+', quantity: 55 },
    { type: 'O-', quantity: 8 }
];

let donations = [
    { id: 'DON001', donorName: 'Alice Kamau', bloodType: 'A+', volume: 450, date: '2024-01-15', barcode: 'BLD-A+-001' },
    { id: 'DON002', donorName: 'Brian Ochieng', bloodType: 'O-', volume: 450, date: '2024-01-15', barcode: 'BLD-O--002' },
    { id: 'DON003', donorName: 'Catherine Wanjiku', bloodType: 'B+', volume: 450, date: '2024-01-14', barcode: 'BLD-B+-003' },
    { id: 'DON004', donorName: 'David Mutua', bloodType: 'AB+', volume: 450, date: '2024-01-14', barcode: 'BLD-AB+-004' },
    { id: 'DON005', donorName: 'Emily Njeri', bloodType: 'A-', volume: 450, date: '2024-01-13', barcode: 'BLD-A--005' }
];

let bloodRequests = [
    { id: 'REQ001', hospital: 'Nairobi Hospital', bloodType: 'O-', quantity: 3, status: 'pending' },
    { id: 'REQ002', hospital: 'Kenyatta National', bloodType: 'A+', quantity: 5, status: 'approved' },
    { id: 'REQ003', hospital: 'Mater Hospital', bloodType: 'B+', quantity: 2, status: 'pending' },
    { id: 'REQ004', hospital: 'MP Shah Hospital', bloodType: 'AB-', quantity: 1, status: 'dispatched' }
];

// Initialize dashboard
function initializeDashboard() {
    renderBloodInventory();
    renderInventoryGrid();
    renderDonations();
    renderBloodRequests();
    checkShortageAlert();
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(sectionId).style.display = 'block';
    
    const titles = {
        'dashboard': 'Dashboard',
        'blood-inventory': 'Blood Bank Inventory',
        'donations': 'Donation Management',
        'requests': 'Blood Requests'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Render blood inventory cards
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

// Render inventory grid
function renderInventoryGrid() {
    const inventoryGrid = document.getElementById('inventory-grid');
    inventoryGrid.innerHTML = '';
    
    bloodInventory.forEach(blood => {
        const bloodCard = document.createElement('div');
        bloodCard.className = 'blood-card';
        bloodCard.innerHTML = `
            <h4>${blood.type}</h4>
            <div class="quantity">${blood.quantity} bags</div>
            <button onclick="updateBloodInventory('${blood.type}')">Update</button>
        `;
        inventoryGrid.appendChild(bloodCard);
    });
}

// Render donations table
function renderDonations() {
    const donationsTable = document.getElementById('donations-table');
    donationsTable.innerHTML = '';
    
    donations.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${donation.id}</td>
            <td>${donation.donorName}</td>
            <td>${donation.bloodType}</td>
            <td>${donation.volume}ml</td>
            <td>${donation.date}</td>
            <td>${donation.barcode}</td>
            <td>
                <button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem;" onclick="printLabel('${donation.barcode}')">Print Label</button>
            </td>
        `;
        donationsTable.appendChild(row);
    });
}

// Render blood requests table
function renderBloodRequests() {
    const requestsTable = document.getElementById('requests-table');
    requestsTable.innerHTML = '';
    
    bloodRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.hospital}</td>
            <td>${request.bloodType}</td>
            <td>${request.quantity}</td>
            <td><span class="request-status ${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span></td>
            <td>
                ${request.status === 'pending' ? '<button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #2ecc71; color: white;" onclick="approveRequest(\'' + request.id + '\')">Approve</button>' : ''}
                ${request.status === 'approved' ? '<button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #3498db; color: white;" onclick="dispatchRequest(\'' + request.id + '\')">Dispatch</button>' : ''}
            </td>
        `;
        requestsTable.appendChild(row);
    });
}

// Check for shortage alerts
function checkShortageAlert() {
    const alertBanner = document.getElementById('alert-banner');
    const lowStock = bloodInventory.filter(b => b.quantity < 10);
    
    if (lowStock.length > 0) {
        const types = lowStock.map(b => b.type).join(', ');
        alertBanner.innerHTML = `<strong>⚠️ Shortage Alert:</strong> Blood type(s) ${types} are below threshold`;
        alertBanner.classList.add('active');
    } else {
        alertBanner.classList.remove('active');
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
        renderInventoryGrid();
        checkShortageAlert();
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

// Donation modal functions
function openDonationModal() {
    document.getElementById('donation-modal').classList.add('active');
    document.getElementById('donor-name').value = '';
    document.getElementById('donor-blood').value = 'A+';
    document.getElementById('donor-volume').value = '450';
}

function closeDonationModal() {
    document.getElementById('donation-modal').classList.remove('active');
}

function saveDonation() {
    const donorName = document.getElementById('donor-name').value;
    const bloodType = document.getElementById('donor-blood').value;
    const volume = parseInt(document.getElementById('donor-volume').value);
    
    if (donorName && bloodType && volume) {
        const donationId = 'DON' + String(donations.length + 1).padStart(3, '0');
        const barcode = 'BLD-' + bloodType.replace('+', 'P').replace('-', 'N') + '-' + String(donations.length + 1).padStart(3, '0');
        const today = new Date().toISOString().split('T')[0];
        
        const newDonation = {
            id: donationId,
            donorName: donorName,
            bloodType: bloodType,
            volume: volume,
            date: today,
            barcode: barcode
        };
        
        donations.unshift(newDonation);
        
        // Update inventory
        const existingBlood = bloodInventory.find(b => b.type === bloodType);
        if (existingBlood) {
            existingBlood.quantity += 1;
        }
        
        renderDonations();
        renderBloodInventory();
        renderInventoryGrid();
        checkShortageAlert();
        closeDonationModal();
        
        alert(`Donation registered successfully!\nBarcode: ${barcode}`);
    }
}

function printLabel(barcode) {
    alert(`Printing label for barcode: ${barcode}`);
}

// Blood request functions
function approveRequest(requestId) {
    const request = bloodRequests.find(r => r.id === requestId);
    if (request) {
        const blood = bloodInventory.find(b => b.type === request.bloodType);
        if (blood && blood.quantity >= request.quantity) {
            request.status = 'approved';
            blood.quantity -= request.quantity;
            renderBloodRequests();
            renderBloodInventory();
            renderInventoryGrid();
            checkShortageAlert();
        } else {
            alert('Insufficient stock to fulfill this request');
        }
    }
}

function dispatchRequest(requestId) {
    const request = bloodRequests.find(r => r.id === requestId);
    if (request) {
        request.status = 'dispatched';
        renderBloodRequests();
    }
}
