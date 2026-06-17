// User credentials database (simulated)
const users = {
    hospital_staff: { username: 'hospital', password: 'hospital123' },
    blood_bank_staff: { username: 'bloodbank', password: 'bloodbank123' },
    paramedic: { username: 'paramedic', password: 'paramedic123' },
    system_admin: { username: 'admin', password: 'admin123' }
};

// Current user session
let currentUser = null;

// Login form handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const role = document.getElementById('role').value;
    const errorMessage = document.getElementById('error-message');
    
    // For testing: accept any credentials, just check role is selected
    if (role) {
        currentUser = { email, username: username || 'User', role };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        redirectToDashboard(role);
    } else {
        errorMessage.textContent = 'Please select a role.';
    }
});

// Redirect to appropriate dashboard based on role
function redirectToDashboard(role) {
    switch(role) {
        case 'hospital_staff':
            window.location.href = 'hospital-dashboard.html';
            break;
        case 'blood_bank_staff':
            window.location.href = 'bloodbank-dashboard.html';
            break;
        case 'paramedic':
            window.location.href = 'paramedic-dashboard.html';
            break;
        case 'system_admin':
            window.location.href = 'admin-dashboard.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

// Check if user is logged in on dashboard pages
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(user);
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Initialize on login page
if (window.location.pathname.endsWith('index.html')) {
    document.getElementById('loginForm').reset();
}
