// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if (user) {
        document.getElementById('user-name').textContent = user.username;
        initializeDashboard();
    }
});

// Sample data
let auditLogs = [
    { id: 'LOG001', userId: 'hospital_staff', action: 'update', timestamp: '2024-01-15 14:32:15', details: 'Updated ICU bed 101 status to occupied' },
    { id: 'LOG002', userId: 'blood_bank_staff', action: 'create', timestamp: '2024-01-15 14:28:45', details: 'Registered new blood donation from Alice Kamau' },
    { id: 'LOG003', userId: 'paramedic', action: 'create', timestamp: '2024-01-15 14:25:30', details: 'Submitted emergency request for John Doe' },
    { id: 'LOG004', userId: 'hospital_staff', action: 'update', timestamp: '2024-01-15 14:20:10', details: 'Updated blood inventory for A+ to 50 bags' },
    { id: 'LOG005', userId: 'system_admin', action: 'login', timestamp: '2024-01-15 14:15:00', details: 'User logged in successfully' },
    { id: 'LOG006', userId: 'blood_bank_staff', action: 'update', timestamp: '2024-01-15 14:10:25', details: 'Approved blood request REQ001' },
    { id: 'LOG007', userId: 'paramedic', action: 'update', timestamp: '2024-01-15 14:05:40', details: 'Updated emergency request status to in-progress' },
    { id: 'LOG008', userId: 'hospital_staff', action: 'delete', timestamp: '2024-01-15 14:00:15', details: 'Archived completed emergency request' },
    { id: 'LOG009', userId: 'blood_bank_staff', action: 'create', timestamp: '2024-01-15 13:55:30', details: 'Dispatched blood unit to Nairobi Hospital' },
    { id: 'LOG010', userId: 'system_admin', action: 'create', timestamp: '2024-01-15 13:50:00', details: 'Performed system backup' }
];

let users = [
    { id: 'USR001', username: 'hospital', role: 'hospital_staff', status: 'active', lastLogin: '2024-01-15 14:32:15' },
    { id: 'USR002', username: 'bloodbank', role: 'blood_bank_staff', status: 'active', lastLogin: '2024-01-15 14:28:45' },
    { id: 'USR003', username: 'paramedic', role: 'paramedic', status: 'active', lastLogin: '2024-01-15 14:25:30' },
    { id: 'USR004', username: 'admin', role: 'system_admin', status: 'active', lastLogin: '2024-01-15 14:15:00' },
    { id: 'USR005', username: 'nurse_jane', role: 'hospital_staff', status: 'active', lastLogin: '2024-01-15 10:30:00' },
    { id: 'USR006', username: 'dr_smith', role: 'hospital_staff', status: 'inactive', lastLogin: '2024-01-14 16:45:00' }
];

let backupHistory = [
    { id: 'BKP001', type: 'Full', date: '2024-01-15 14:30:00', size: '2.4 GB', status: 'Success' },
    { id: 'BKP002', type: 'Incremental', date: '2024-01-15 10:00:00', size: '150 MB', status: 'Success' },
    { id: 'BKP003', type: 'Full', date: '2024-01-14 22:00:00', size: '2.3 GB', status: 'Success' },
    { id: 'BKP004', type: 'Incremental', date: '2024-01-14 16:00:00', size: '120 MB', status: 'Success' },
    { id: 'BKP005', type: 'Full', date: '2024-01-13 22:00:00', size: '2.2 GB', status: 'Failed' }
];

// Initialize dashboard
function initializeDashboard() {
    renderAuditLogs();
    renderUsers();
    renderBackupHistory();
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(sectionId).style.display = 'block';
    
    const titles = {
        'dashboard': 'Dashboard',
        'audit-logs': 'Audit Logs',
        'user-management': 'User Management',
        'system-backup': 'System Backup'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Render audit logs
function renderAuditLogs(logsToRender = auditLogs) {
    const logsTable = document.getElementById('audit-logs-table');
    logsTable.innerHTML = '';
    
    logsToRender.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${log.id}</td>
            <td>${log.userId}</td>
            <td><span class="request-status ${log.action}">${log.action.charAt(0).toUpperCase() + log.action.slice(1)}</span></td>
            <td>${log.timestamp}</td>
            <td>${log.details}</td>
        `;
        logsTable.appendChild(row);
    });
}

// Filter logs
function filterLogs() {
    const searchTerm = document.getElementById('log-search').value.toLowerCase();
    const actionFilter = document.getElementById('log-filter').value;
    
    let filteredLogs = auditLogs;
    
    if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
            log.details.toLowerCase().includes(searchTerm) ||
            log.userId.toLowerCase().includes(searchTerm) ||
            log.action.toLowerCase().includes(searchTerm)
        );
    }
    
    if (actionFilter) {
        filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
    }
    
    renderAuditLogs(filteredLogs);
}

// Export logs
function exportLogs() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Log ID,User ID,Action,Timestamp,Details\n"
        + auditLogs.map(log => `${log.id},${log.userId},${log.action},${log.timestamp},"${log.details}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Clear old logs
function clearLogs() {
    if (confirm('Are you sure you want to clear logs older than 30 days?')) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const initialCount = auditLogs.length;
        auditLogs = auditLogs.filter(log => new Date(log.timestamp) >= thirtyDaysAgo);
        
        const clearedCount = initialCount - auditLogs.length;
        alert(`Cleared ${clearedCount} old log entries.`);
        renderAuditLogs();
    }
}

// Render users
function renderUsers() {
    const usersTable = document.getElementById('users-table');
    usersTable.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        const roleLabels = {
            'hospital_staff': 'Hospital Staff',
            'blood_bank_staff': 'Blood Bank Staff',
            'paramedic': 'Paramedic',
            'system_admin': 'System Admin'
        };
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${roleLabels[user.role] || user.role}</td>
            <td><span class="request-status ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
            <td>${user.lastLogin}</td>
            <td>
                <button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #3498db; color: white;" onclick="editUser('${user.id}')">Edit</button>
                ${user.status === 'active' ? '<button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #f39c12; color: white;" onclick="deactivateUser(\'' + user.id + '\')">Deactivate</button>' : '<button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #2ecc71; color: white;" onclick="activateUser(\'' + user.id + '\')">Activate</button>'}
                <button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #e74c3c; color: white;" onclick="deleteUser(\'' + user.id + '\')">Delete</button>
            </td>
        `;
        usersTable.appendChild(row);
    });
}

// User modal functions
function openUserModal() {
    document.getElementById('user-modal').classList.add('active');
    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('new-role').value = 'hospital_staff';
    document.getElementById('new-name').value = '';
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
}

function saveUser() {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;
    const name = document.getElementById('new-name').value;
    
    if (username && password && role && name) {
        const userId = 'USR' + String(users.length + 1).padStart(3, '0');
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        const newUser = {
            id: userId,
            username: username,
            role: role,
            status: 'active',
            lastLogin: 'Never'
        };
        
        users.push(newUser);
        
        // Add audit log
        const logId = 'LOG' + String(auditLogs.length + 1).padStart(3, '0');
        auditLogs.unshift({
            id: logId,
            userId: 'system_admin',
            action: 'create',
            timestamp: now,
            details: `Created new user ${username} with role ${role}`
        });
        
        renderUsers();
        renderAuditLogs();
        closeUserModal();
        
        alert(`User ${username} created successfully!`);
    }
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        alert(`Edit user: ${user.username}\n\nThis feature would open an edit modal for the user.`);
    }
}

function deactivateUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user && confirm(`Are you sure you want to deactivate user ${user.username}?`)) {
        user.status = 'inactive';
        
        // Add audit log
        const logId = 'LOG' + String(auditLogs.length + 1).padStart(3, '0');
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        auditLogs.unshift({
            id: logId,
            userId: 'system_admin',
            action: 'update',
            timestamp: now,
            details: `Deactivated user ${user.username}`
        });
        
        renderUsers();
        renderAuditLogs();
    }
}

function activateUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user && confirm(`Are you sure you want to activate user ${user.username}?`)) {
        user.status = 'active';
        
        // Add audit log
        const logId = 'LOG' + String(auditLogs.length + 1).padStart(3, '0');
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        auditLogs.unshift({
            id: logId,
            userId: 'system_admin',
            action: 'update',
            timestamp: now,
            details: `Activated user ${user.username}`
        });
        
        renderUsers();
        renderAuditLogs();
    }
}

function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user && confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) {
        const index = users.findIndex(u => u.id === userId);
        users.splice(index, 1);
        
        // Add audit log
        const logId = 'LOG' + String(auditLogs.length + 1).padStart(3, '0');
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        auditLogs.unshift({
            id: logId,
            userId: 'system_admin',
            action: 'delete',
            timestamp: now,
            details: `Deleted user ${user.username}`
        });
        
        renderUsers();
        renderAuditLogs();
    }
}

// Render backup history
function renderBackupHistory() {
    const backupTable = document.getElementById('backup-history-table');
    backupTable.innerHTML = '';
    
    backupHistory.forEach(backup => {
        const row = document.createElement('tr');
        const statusClass = backup.status === 'Success' ? 'completed' : 'pending';
        
        row.innerHTML = `
            <td>${backup.id}</td>
            <td>${backup.type}</td>
            <td>${backup.date}</td>
            <td>${backup.size}</td>
            <td><span class="request-status ${statusClass}">${backup.status}</span></td>
            <td>
                <button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #3498db; color: white;" onclick="downloadBackup('${backup.id}')">Download</button>
                <button class="card-btn" style="padding: 5px 10px; font-size: 0.8rem; background: #e74c3c; color: white;" onclick="deleteBackup('${backup.id}')">Delete</button>
            </td>
        `;
        backupTable.appendChild(row);
    });
}

// Backup functions
function performBackup() {
    if (confirm('Are you sure you want to perform a full system backup? This may take several minutes.')) {
        const backupId = 'BKP' + String(backupHistory.length + 1).padStart(3, '0');
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        const newBackup = {
            id: backupId,
            type: 'Full',
            date: now,
            size: 'Processing...',
            status: 'In Progress'
        };
        
        backupHistory.unshift(newBackup);
        renderBackupHistory();
        
        // Simulate backup completion
        setTimeout(() => {
            newBackup.size = '2.5 GB';
            newBackup.status = 'Success';
            
            // Add audit log
            const logId = 'LOG' + String(auditLogs.length + 1).padStart(3, '0');
            auditLogs.unshift({
                id: logId,
                userId: 'system_admin',
                action: 'create',
                timestamp: now,
                details: 'Performed full system backup'
            });
            
            renderBackupHistory();
            renderAuditLogs();
            alert('Backup completed successfully!');
        }, 3000);
    }
}

function scheduleBackup() {
    const scheduleTime = prompt('Enter backup schedule (e.g., "daily at 22:00", "weekly on Sunday"):');
    if (scheduleTime) {
        alert(`Backup scheduled: ${scheduleTime}\n\nThis feature would configure automated backups.`);
        
        // Add audit log
        const logId = 'LOG' + String(auditLogs.length + 1).padStart(3, '0');
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        auditLogs.unshift({
            id: logId,
            userId: 'system_admin',
            action: 'create',
            timestamp: now,
            details: `Scheduled backup for ${scheduleTime}`
        });
        
        renderAuditLogs();
    }
}

function restoreBackup() {
    const backupId = prompt('Enter backup ID to restore (e.g., BKP001):');
    if (backupId) {
        const backup = backupHistory.find(b => b.id === backupId);
        if (backup) {
            if (confirm(`Are you sure you want to restore from backup ${backupId} (${backup.date})?\n\nThis will overwrite current data!`)) {
                alert(`Restoring from backup ${backupId}...\n\nThis feature would restore the database from the selected backup.`);
                
                // Add audit log
                const logId = 'LOG' + String(auditLogs.length + 1).padStart(3, '0');
                const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
                auditLogs.unshift({
                    id: logId,
                    userId: 'system_admin',
                    action: 'update',
                    timestamp: now,
                    details: `Restored system from backup ${backupId}`
                });
                
                renderAuditLogs();
            }
        } else {
            alert('Backup not found.');
        }
    }
}

function downloadBackup(backupId) {
    alert(`Downloading backup ${backupId}...\n\nThis feature would download the backup file.`);
}

function deleteBackup(backupId) {
    const backup = backupHistory.find(b => b.id === backupId);
    if (backup && confirm(`Are you sure you want to delete backup ${backupId}?`)) {
        const index = backupHistory.findIndex(b => b.id === backupId);
        backupHistory.splice(index, 1);
        
        // Add audit log
        const logId = 'LOG' + String(auditLogs.length + 1).padStart(3, '0');
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        auditLogs.unshift({
            id: logId,
            userId: 'system_admin',
            action: 'delete',
            timestamp: now,
            details: `Deleted backup ${backupId}`
        });
        
        renderBackupHistory();
        renderAuditLogs();
    }
}
