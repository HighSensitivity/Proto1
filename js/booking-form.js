document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const startDateCalendar = document.getElementById('startDateCalendar');
    const endDateCalendar = document.getElementById('endDateCalendar');

    // Get the date from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedDate = urlParams.get('date');
    if (selectedDate) {
        startDateInput.value = selectedDate;
    }

    function createMiniCalendar(calendarElement, input) {
        let currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear();
        let bookedDates = [];

        // Get booked dates from localStorage
        function getBookedDates() {
            const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            return bookings.reduce((dates, booking) => {
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
        }

        function isPastDate(year, month, day) {
            const today = new Date();
            const checkDate = new Date(year, month, day);
            checkDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            return checkDate < today;
        }

        function updateCalendar() {
            bookedDates = getBookedDates();
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);
            const monthLength = lastDay.getDate();
            const startingDay = firstDay.getDay();
            
            // Add today's date check
            const today = new Date();
            const isToday = (day) => {
                return currentYear === today.getFullYear() && 
                       currentMonth === today.getMonth() && 
                       day === today.getDate();
            };

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

            calendarElement.innerHTML = `
                <div class="calendar-header">
                    <button class="prev-month"><i class="fas fa-chevron-left"></i></button>
                    <h4>${monthNames[currentMonth]} ${currentYear}</h4>
                    <button class="next-month"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div class="calendar-grid"></div>
            `;

            const grid = calendarElement.querySelector('.calendar-grid');

            // Add empty cells for days before the first day of the month
            for (let i = 0; i < startingDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                grid.appendChild(emptyDay);
            }

            // Add days of the month
            for (let day = 1; day <= monthLength; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = day;

                // Add today's date highlight
                if (isToday(day)) {
                    dayElement.classList.add('today');
                }

                // Check if date is past
                if (isPastDate(currentYear, currentMonth, day)) {
                    dayElement.classList.add('past-date');
                    dayElement.style.backgroundColor = '#e9ecef';
                    dayElement.style.color = '#adb5bd';
                    dayElement.style.cursor = 'not-allowed';
                } else {
                    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    if (bookedDates.includes(dateString)) {
                        dayElement.classList.add('booked');
                        dayElement.style.backgroundColor = '#e76f51';
                        dayElement.style.color = 'white';
                        dayElement.style.cursor = 'not-allowed';
                    } else {
                        dayElement.classList.add('available');
                        dayElement.addEventListener('click', () => {
                            input.value = dateString;
                            calendarElement.classList.remove('active');
                        });
                    }
                }

                grid.appendChild(dayElement);
            }

            // Add event listeners for month navigation
            const prevBtn = calendarElement.querySelector('.prev-month');
            const nextBtn = calendarElement.querySelector('.next-month');

            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                updateCalendar();
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                updateCalendar();
            });
        }

        updateCalendar();
    }

    // Initialize mini calendars
    createMiniCalendar(startDateCalendar, startDateInput);
    createMiniCalendar(endDateCalendar, endDateInput);

    // Show/hide calendars on input focus
    startDateInput.addEventListener('click', () => {
        startDateCalendar.classList.add('active');
        endDateCalendar.classList.remove('active');
    });

    endDateInput.addEventListener('click', () => {
        endDateCalendar.classList.add('active');
        startDateCalendar.classList.remove('active');
    });

    // Hide calendars when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.date-picker-container')) {
            startDateCalendar.classList.remove('active');
            endDateCalendar.classList.remove('active');
        }
    });

    // Prevent calendar from closing when clicking inside it
    startDateCalendar.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    endDateCalendar.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Form submission
    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            checkIn: document.getElementById('startDate').value,
            checkOut: document.getElementById('endDate').value,
            bookingDate: new Date().toISOString(),
            status: 'pending'
        };

        // Store in localStorage instead of making API call for now
        let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        bookings.push(formData);
        localStorage.setItem('bookings', JSON.stringify(bookings));

        alert('Booking submitted successfully!');
        window.location.href = 'calendar.html';
    });
}); 