document.addEventListener('DOMContentLoaded', async function() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let bookedDates = [];

    // Fetch booked dates from localStorage
    async function fetchBookedDates() {
        try {
            // Get bookings from localStorage
            const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            
            // Create array of all booked dates including dates between check-in and check-out
            bookedDates = bookings.reduce((dates, booking) => {
                if (booking.status === 'confirmed') {  // Only show confirmed bookings
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
        } catch (error) {
            console.error('Error getting booked dates:', error);
        }
    }

    await fetchBookedDates();

    const calendarDays = document.getElementById('calendarDays');
    const monthDisplay = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

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

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarDays.appendChild(emptyDay);
        }

        const today = new Date();
        const isToday = (day) => {
            return year === today.getFullYear() && 
                   month === today.getMonth() && 
                   day === today.getDate();
        };

        // Add this function to check if a date is in the past
        function isPastDate(year, month, day) {
            const today = new Date();
            const checkDate = new Date(year, month, day);
            // Set time to beginning of day for accurate comparison
            checkDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            return checkDate < today;
        }

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
                // Only allow booking for future dates
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (bookedDates.includes(dateString)) {
                    dayElement.classList.add('booked');
                    dayElement.style.backgroundColor = '#e76f51';
                    dayElement.style.color = 'white';
                } else {
                    dayElement.classList.add('available');
                    dayElement.addEventListener('click', () => {
                        window.location.href = `booking-form.html?date=${dateString}`;
                    });
                }
            }

            calendarDays.appendChild(dayElement);
        }
    }

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

    // Generate initial calendar
    generateCalendar(currentMonth, currentYear);
}); 