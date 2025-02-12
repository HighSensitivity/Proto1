document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!sessionStorage.getItem('adminAuthenticated')) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Initialize variables
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const bookingsTableBody = document.getElementById('bookingsTableBody');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.querySelector('.header-search input');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const calendarView = document.getElementById('calendar-view');
    const bookingsSection = document.querySelector('.bookings-section');
    const calendarDays = document.getElementById('calendarDays');
    const monthDisplay = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let currentSortColumn = 'bookingId';
    let currentSortOrder = 'asc';

    // Add this at the top of your file, outside any function
    const CLEARED_NOTIFICATIONS_KEY = 'clearedNotifications';

    // Update stats
    function updateStats() {
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        const stats = {
            total: bookings.length,
            active: bookings.filter(b => b.status === 'confirmed').length,
            pending: bookings.filter(b => b.status === 'pending').length,
            revenue: bookings
                .filter(b => b.status === 'confirmed')
                .length * 150 // Assuming $150 per booking
        };

        // Update stats in the DOM
        document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = stats.total;
        document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = stats.active;
        document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = `$${stats.revenue}`;
        document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = stats.pending;
    }

    // Load bookings with search and filter
    function loadBookings() {
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        const selectedStatus = statusFilter.value;
        const selectedDate = dateFilter.value;
        const searchTerm = searchInput.value.toLowerCase();

        // Sort bookings based on current sort column and order
        bookings.sort((a, b) => {
            if (currentSortOrder === 'desc') {
                [a, b] = [b, a]; // Swap elements for descending order
            }

            switch (currentSortColumn) {
                case 'bookingId':
                    return new Date(a.bookingDate) - new Date(b.bookingDate);
                
                case 'guest':
                    const guestA = `${a.firstName} ${a.lastName}`.toLowerCase();
                    const guestB = `${b.firstName} ${b.lastName}`.toLowerCase();
                    return guestA.localeCompare(guestB);
                
                case 'checkIn':
                    return new Date(a.checkIn) - new Date(b.checkIn);
                
                case 'checkOut':
                    return new Date(a.checkOut) - new Date(b.checkOut);
                
                case 'status':
                    return a.status.localeCompare(b.status);
                
                case 'amount':
                    // Assuming fixed amount of $150 per booking
                    return 150 - 150; // Will always be 0 since amount is fixed
                
                default:
                    return 0;
            }
        });

        const filteredBookings = bookings.filter(booking => {
            const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
            const matchesDate = !selectedDate || booking.checkIn === selectedDate;
            const matchesSearch = 
                booking.firstName.toLowerCase().includes(searchTerm) ||
                booking.lastName.toLowerCase().includes(searchTerm) ||
                booking.email.toLowerCase().includes(searchTerm);

            return matchesStatus && matchesDate && matchesSearch;
        });

        bookingsTableBody.innerHTML = '';

        filteredBookings.forEach((booking, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${String(index + 1000).padStart(4, '0')}</td>
                <td>
                    <div class="guest-info">
                        ${booking.firstName} ${booking.lastName}
                        <span class="guest-email">${booking.email}</span>
                    </div>
                </td>
                <td>${booking.checkIn}</td>
                <td>${booking.checkOut}</td>
                <td>
                    <span class="status-badge status-${booking.status}">
                        ${booking.status}
                    </span>
                </td>
                <td>$150</td>
                <td class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewBooking(${index})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn confirm-btn" onclick="updateStatus(${index}, 'confirmed')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn cancel-btn" onclick="updateStatus(${index}, 'cancelled')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            bookingsTableBody.appendChild(row);
        });
    }

    // Event listeners
    statusFilter.addEventListener('change', loadBookings);
    dateFilter.addEventListener('change', loadBookings);
    searchInput.addEventListener('input', loadBookings);
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.removeItem('adminAuthenticated');
        window.location.href = 'admin-login.html';
    });

    // Export functionality
    document.querySelector('.export-btn').addEventListener('click', function() {
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        const csv = convertToCSV(bookings);
        downloadCSV(csv, 'bookings.csv');
    });

    // Helper function to convert bookings to CSV
    function convertToCSV(bookings) {
        const headers = ['Booking Date', 'Guest Name', 'Email', 'Check In', 'Check Out', 'Status'];
        const rows = bookings.map(booking => [
            new Date(booking.bookingDate).toLocaleDateString(),
            `${booking.firstName} ${booking.lastName}`,
            booking.email,
            booking.checkIn,
            booking.checkOut,
            booking.status
        ]);

        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    }

    // Helper function to download CSV
    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Add this with other event listeners
    mobileMenuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Close sidebar when window is resized above mobile breakpoint
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('active');
        }
    });

    // Update the tab switching code to include settings
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            
            // Remove active class from all links
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Show/hide sections based on selected tab
            const bookingsSection = document.querySelector('.bookings-section');
            const calendarView = document.getElementById('calendar-view');
            const dashboardView = document.getElementById('dashboard-view');
            const settingsView = document.getElementById('settings-view');

            // Hide all sections first
            [bookingsSection, calendarView, dashboardView, settingsView].forEach(section => {
                if (section) section.style.display = 'none';
            });

            // Show selected section
            switch(target) {
                case 'dashboard':
                    dashboardView.style.display = 'block';
                    updateStats();
                    break;
                case 'bookings':
                    bookingsSection.style.display = 'block';
                    loadBookings();
                    break;
                case 'calendar':
                    calendarView.style.display = 'block';
                    generateCalendar(currentMonth, currentYear);
                    break;
                case 'settings':
                    settingsView.style.display = 'block';
                    break;
            }
        });
    });

    // Show dashboard view by default
    const dashboardLink = document.querySelector('.sidebar-nav a[href="#dashboard"]');
    if (dashboardLink) {
        dashboardLink.click();
    }

    // Calendar functions
    function isPastDate(year, month, day) {
        const today = new Date();
        const checkDate = new Date(year, month, day);
        checkDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return checkDate < today;
    }

    function generateCalendar(month, year) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const monthLength = lastDay.getDate();

        // Clear previous calendar
        calendarDays.innerHTML = '';

        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        monthDisplay.textContent = `${monthNames[month]} ${year}`;

        // Get booked dates
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        const bookedDates = bookings.reduce((dates, booking) => {
            if (booking.status === 'confirmed') {
                const start = new Date(booking.checkIn);
                const end = new Date(booking.checkOut);
                const dateArray = [];
                
                let currentDate = new Date(start);
                while (currentDate <= end) {
                    dateArray.push(currentDate.toISOString().split('T')[0]);
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                return [...dates, ...dateArray];
            }
            return dates;
        }, []);

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarDays.appendChild(emptyDay);
        }

        // Get current date for comparison
        const today = new Date();
        const isToday = (day) => {
            return year === today.getFullYear() && 
                   month === today.getMonth() && 
                   day === today.getDate();
        };

        // Add days of the month
        for (let day = 1; day <= monthLength; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            // Check if it's today
            if (isToday(day)) {
                dayElement.classList.add('today');
            }

            // Check if date is past
            if (isPastDate(year, month, day)) {
                dayElement.classList.add('past-date');
                dayElement.style.backgroundColor = '#e9ecef';
                dayElement.style.color = '#adb5bd';
                dayElement.style.cursor = 'not-allowed';
            } else {
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (bookedDates.includes(dateString)) {
                    dayElement.classList.add('booked');
                } else {
                    dayElement.classList.add('available');
                }
            }

            calendarDays.appendChild(dayElement);
        }
    }

    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });

    // Add these functions for the action buttons
    window.viewBooking = function(index) {
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        const booking = bookings[index];
        
        // Create a modal to show booking details
        const modalHtml = `
            <div class="modal" id="bookingModal">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>Booking Details</h2>
                    <div class="booking-details">
                        <p><strong>Guest:</strong> ${booking.firstName} ${booking.lastName}</p>
                        <p><strong>Email:</strong> ${booking.email}</p>
                        <p><strong>Phone:</strong> ${booking.phone}</p>
                        <p><strong>Check In:</strong> ${booking.checkIn}</p>
                        <p><strong>Check Out:</strong> ${booking.checkOut}</p>
                        <p><strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status}</span></p>
                        <p><strong>Address:</strong> ${booking.address}</p>
                        <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('bookingModal');
        const closeBtn = modal.querySelector('.close-modal');
        
        closeBtn.onclick = function() {
            modal.remove();
        }
        
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.remove();
            }
        }
    };

    window.updateStatus = function(index, newStatus) {
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        bookings[index].status = newStatus;
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Show success message
        const message = `Booking ${newStatus} successfully`;
        showNotification(message, 'success');
        
        // Refresh the table and stats
        loadBookings();
        updateStats();
    };

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Add form submission handlers
    document.getElementById('profileForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Profile updated successfully', 'success');
    });

    document.getElementById('securityForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        
        if (newPass !== confirmPass) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        showNotification('Password changed successfully', 'success');
        this.reset();
    });

    // Update the click handler for sorting
    document.querySelectorAll('th.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const sortColumn = this.dataset.sort;
            const sortIcon = this.querySelector('.sort-icon i');
            
            // Reset all other sort icons
            document.querySelectorAll('th.sortable .sort-icon i').forEach(icon => {
                if (icon !== sortIcon) {
                    icon.className = 'fas fa-sort';
                }
            });

            // If clicking the same column, toggle order; if different column, set to asc
            if (sortColumn === currentSortColumn) {
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortColumn;
                currentSortOrder = 'asc';
            }
            
            // Update sort icon
            sortIcon.className = currentSortOrder === 'asc' 
                ? 'fas fa-sort-up' 
                : 'fas fa-sort-down';
            
            // Reload bookings with new sort order
            loadBookings();
        });
    });

    // Initial load
    updateStats();
    loadBookings();

    // Update the notification functions
    function updateNotificationCount() {
        const notificationBadge = document.querySelector('.notification-badge');
        const badge = notificationBadge.querySelector('.badge');
        const dropdown = notificationBadge.querySelector('.notification-dropdown');
        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        const clearedNotifications = JSON.parse(localStorage.getItem(CLEARED_NOTIFICATIONS_KEY)) || [];
        
        // Get recent activities (last 24 hours) that haven't been cleared
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const recentActivities = bookings.filter(booking => {
            const bookingDate = new Date(booking.bookingDate);
            const isRecent = bookingDate > last24Hours;
            const isNotCleared = !clearedNotifications.includes(booking.bookingDate);
            return isRecent && isNotCleared;
        });

        // Update the badge number
        const count = recentActivities.length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';

        // Create notification items
        const notificationList = recentActivities.map(activity => {
            const date = new Date(activity.bookingDate);
            const timeAgo = getTimeAgo(date);
            return `
                <div class="notification-item" data-booking-id="${activity.bookingDate}" role="button">
                    <div class="notification-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="notification-content">
                        <p><strong>${activity.firstName} ${activity.lastName}</strong> made a new booking</p>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Update dropdown content
        dropdown.innerHTML = recentActivities.length > 0 
            ? `
                <div class="notification-header">
                    <h3>Recent Activities</h3>
                    <button class="clear-all">Clear All</button>
                </div>
                <div class="notification-list">
                    ${notificationList}
                </div>
            `
            : '<div class="no-notifications">No recent activities</div>';

        // Add clear all functionality
        const clearAllBtn = dropdown.querySelector('.clear-all');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Store all current notification IDs as cleared
                const notificationIds = recentActivities.map(activity => activity.bookingDate);
                localStorage.setItem(
                    CLEARED_NOTIFICATIONS_KEY, 
                    JSON.stringify([...clearedNotifications, ...notificationIds])
                );
                badge.style.display = 'none';
                badge.textContent = '0';
                dropdown.innerHTML = '<div class="no-notifications">No recent activities</div>';
                notificationBadge.classList.remove('active');
            });
        }

        // Add click handlers for notification items
        dropdown.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                // Navigate to bookings section
                const bookingsLink = document.querySelector('a[href="#bookings"]');
                if (bookingsLink) {
                    bookingsLink.click();
                    
                    // Clear this specific notification
                    const bookingId = item.dataset.bookingId;
                    const updatedClearedNotifications = [...clearedNotifications, bookingId];
                    localStorage.setItem(
                        CLEARED_NOTIFICATIONS_KEY, 
                        JSON.stringify(updatedClearedNotifications)
                    );
                    
                    // Close dropdown and update notifications
                    notificationBadge.classList.remove('active');
                    updateNotificationCount();
                }
            });
        });
    }

    // Helper function to format time ago
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';
        
        return Math.floor(seconds) + ' seconds ago';
    }

    // Toggle notification dropdown
    const notificationBadge = document.querySelector('.notification-badge');
    
    notificationBadge?.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationBadge?.contains(e.target)) {
            notificationBadge?.classList.remove('active');
        }
    });

    // Prevent dropdown close when clicking inside
    document.querySelector('.notification-dropdown')?.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Initial update
    updateNotificationCount();

    // Update every minute
    setInterval(updateNotificationCount, 60000);

    // Add these functions to handle settings
    function saveSettings(settingType, data) {
        const settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
        settings[settingType] = data;
        localStorage.setItem('adminSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('adminSettings')) || {};
        
        // Load profile settings
        if (settings.profile) {
            document.getElementById('adminName').value = settings.profile.name || '';
            document.getElementById('adminEmail').value = settings.profile.email || '';
            document.getElementById('adminPhone').value = settings.profile.phone || '';
        }

        // Load notification settings
        if (settings.notifications) {
            document.getElementById('emailNotif').checked = settings.notifications.email;
            document.getElementById('bookingNotif').checked = settings.notifications.booking;
            document.getElementById('systemNotif').checked = settings.notifications.system;
        }
    }

    // Load saved settings
    loadSettings();

    // Profile form submission
    document.getElementById('profileForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const profileData = {
            name: document.getElementById('adminName').value,
            email: document.getElementById('adminEmail').value,
            phone: document.getElementById('adminPhone').value
        };

        saveSettings('profile', profileData);
        showNotification('Profile updated successfully', 'success');
    });

    // Security form submission
    document.getElementById('securityForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Basic validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('All password fields are required', 'error');
            return;
        }

        if (currentPassword === 'password123') { // Check against default password
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showNotification('Password must be at least 8 characters', 'error');
                return;
            }

            // Save new password
            saveSettings('security', { password: newPassword });
            showNotification('Password changed successfully', 'success');
            this.reset();
        } else {
            showNotification('Current password is incorrect', 'error');
        }
    });

    // Notification toggle handlers
    const notificationToggles = [
        'emailNotif',
        'bookingNotif',
        'systemNotif'
    ];

    notificationToggles.forEach(toggleId => {
        document.getElementById(toggleId)?.addEventListener('change', function() {
            const notificationSettings = {
                email: document.getElementById('emailNotif').checked,
                booking: document.getElementById('bookingNotif').checked,
                system: document.getElementById('systemNotif').checked
            };

            saveSettings('notifications', notificationSettings);
            showNotification('Notification settings updated', 'success');
        });
    });
}); 