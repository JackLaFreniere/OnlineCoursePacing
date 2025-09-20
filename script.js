/**
 * Trimester to Online Course Day Mapper - JavaScript Functions
 * This file contains all the functionality for mapping trimester dates to online course dates
 */

// Configuration constants
const TRIMESTER_WEEKS = 12;
const COURSE_WEEKS = 20;

/**
 * Initialize the application when the page loads
 */
function initializeApp() {
    setDefaultDate();
    setupFormHandler();
    fixIOSViewport();
}

/**
 * Fix iOS Safari viewport height issues
 */
function fixIOSViewport() {
    // Calculate actual viewport height for iOS Safari
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Recalculate on resize/orientation change
    window.addEventListener('resize', () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
    
    // Also handle orientation change specifically for mobile devices
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }, 500); // Delay to ensure viewport has adjusted
    });
}

/**
 * Set default value of target_date to today
 */
function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    const targetDateInput = document.getElementById('target_date');
    if (targetDateInput) {
        targetDateInput.value = todayStr;
    }
}

/**
 * Parse a date string as UTC to avoid timezone issues
 * @param {string} str - Date string in YYYY-MM-DD format
 * @returns {Date} - UTC Date object
 */
function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCHours(0, 0, 0, 0);
    return date;
}

/**
 * Format a date as YYYY-MM-DD in UTC
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

/**
 * Get all weekdays (Mon-Fri) between two dates
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Date[]} - Array of weekday dates
 */
function getWeekdaysBetween(start, end) {
    const days = [];
    const current = new Date(start.getTime());
    
    while (current <= end) {
        const day = current.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        if (day >= 1 && day <= 5) { // Mon-Fri
            days.push(new Date(current.getTime()));
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }
    
    return days;
}

/**
 * Calculate the end date given a start date and number of weeks
 * @param {Date} startDate - Starting date
 * @param {number} weeks - Number of weeks to add
 * @returns {Date} - End date
 */
function calculateEndDate(startDate, weeks) {
    const endDate = new Date(startDate.getTime());
    endDate.setUTCDate(endDate.getUTCDate() + (weeks * 7) - 1);
    return endDate;
}

/**
 * Validate date ranges
 * @param {Date} trimesterStart - Trimester start date
 * @param {Date} trimesterEnd - Trimester end date
 * @param {Date} courseStart - Course start date
 * @param {Date} courseEnd - Course end date
 * @param {Date} targetDate - Target date to check
 * @returns {boolean} - True if dates are valid
 */
function validateDates(trimesterStart, trimesterEnd, courseStart, courseEnd, targetDate) {
    return !(trimesterEnd < trimesterStart || 
             courseEnd < courseStart || 
             targetDate < trimesterStart || 
             targetDate > trimesterEnd);
}

/**
 * Display error message
 * @param {string} message - Error message to display
 */
function displayError(message) {
    const outputElement = document.getElementById('output');
    if (outputElement) {
        outputElement.style.display = 'block';
        outputElement.className = 'info error';
        outputElement.innerHTML = `<span style="color:red;">${message}</span>`;
    }
}

/**
 * Display calculation results
 * @param {Date} trimesterStart - Trimester start date
 * @param {Date} trimesterEnd - Trimester end date
 * @param {Date} courseStart - Course start date
 * @param {Date} courseEnd - Course end date
 * @param {Date} courseDate - Calculated course date
 */
function displayResults(trimesterStart, trimesterEnd, courseStart, courseEnd, courseDate) {
    const outputElement = document.getElementById('output');
    if (outputElement) {
        const info = `
            <strong>Trimester Period:</strong><br>
            Start: ${formatDate(trimesterStart)} | End: ${formatDate(trimesterEnd)}<br><br>
            <strong>Online Course Period:</strong><br>
            Start: ${formatDate(courseStart)} | End: ${formatDate(courseEnd)}<br><br>
            <strong>On your trimester date, you should be at:</strong><br>
            <span class='result'>${formatDate(courseDate)}</span><br>
            <em>in your online course.</em>
        `;
        
        outputElement.style.display = 'block';
        outputElement.className = 'info';
        outputElement.innerHTML = info;
    }
}

/**
 * Main calculation function to map trimester date to course date
 * @param {Date} trimesterStart - Trimester start date
 * @param {Date} courseStart - Course start date
 * @param {Date} targetDate - Target trimester date
 * @returns {Date} - Corresponding course date
 */
function calculateCorrespondingDate(trimesterStart, courseStart, targetDate) {
    const trimesterEnd = calculateEndDate(trimesterStart, TRIMESTER_WEEKS);
    const courseEnd = calculateEndDate(courseStart, COURSE_WEEKS);
    
    // Calculate days into trimester (including weekends)
    const daysIntoTrimester = Math.floor((targetDate.getTime() - trimesterStart.getTime()) / (1000 * 60 * 60 * 24));
    const totalTrimesterDays = Math.floor((trimesterEnd.getTime() - trimesterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get all online course weekdays
    const courseWeekdays = getWeekdaysBetween(courseStart, courseEnd);
    
    // Map real day index to online course weekday index
    let courseIndex = Math.round(daysIntoTrimester * (courseWeekdays.length / totalTrimesterDays));
    
    // Ensure courseIndex is within bounds
    if (courseIndex < 0) courseIndex = 0;
    if (courseIndex >= courseWeekdays.length) courseIndex = courseWeekdays.length - 1;
    
    return {
        courseDate: courseWeekdays[courseIndex],
        trimesterEnd,
        courseEnd
    };
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const trimesterStartValue = document.getElementById('trimester_start')?.value;
    const courseStartValue = document.getElementById('course_start')?.value;
    const targetDateValue = document.getElementById('target_date')?.value;
    
    // Validate inputs
    if (!trimesterStartValue || !courseStartValue || !targetDateValue) {
        displayError('Please fill in all required fields.');
        return;
    }
    
    // Parse dates
    const trimesterStart = parseDate(trimesterStartValue);
    const courseStart = parseDate(courseStartValue);
    const targetDate = parseDate(targetDateValue);
    
    // Calculate end dates
    const trimesterEnd = calculateEndDate(trimesterStart, TRIMESTER_WEEKS);
    const courseEnd = calculateEndDate(courseStart, COURSE_WEEKS);
    
    // Validate date ranges
    if (!validateDates(trimesterStart, trimesterEnd, courseStart, courseEnd, targetDate)) {
        displayError('Please check your date ranges. Make sure the target date falls within the trimester period.');
        return;
    }
    
    // Calculate corresponding date
    const result = calculateCorrespondingDate(trimesterStart, courseStart, targetDate);
    
    // Display results
    displayResults(trimesterStart, result.trimesterEnd, courseStart, result.courseEnd, result.courseDate);
}

/**
 * Setup form event handler
 */
function setupFormHandler() {
    const form = document.getElementById('dateForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Fallback for older browsers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}