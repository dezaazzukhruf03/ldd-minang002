/**
 * CALENDAR.JS - Countdown timer & Save to Calendar feature
 */
function initCountdown() {
    // Event Date: Saturday, 24 October 2026, 08:00 WIB
    const targetDate = new Date('October 24, 2026 08:00:00').getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (!daysEl) return;

    function updateTimer() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference < 0) {
            daysEl.innerText = '00';
            hoursEl.innerText = '00';
            minutesEl.innerText = '00';
            secondsEl.innerText = '00';
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.innerText = String(days).padStart(2, '0');
        hoursEl.innerText = String(hours).padStart(2, '0');
        minutesEl.innerText = String(minutes).padStart(2, '0');
        secondsEl.innerText = String(seconds).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);

    // Save to Google Calendar Buttons
    const btnAkad = document.getElementById('btn-save-calendar-akad');
    if (btnAkad) {
        btnAkad.addEventListener('click', function(e) {
            e.preventDefault();
            const googleCalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
                "&text=" + encodeURIComponent("Akad Nikah Lara & Deza") +
                "&dates=20261024T010000Z/20261024T030000Z" +
                "&details=" + encodeURIComponent("Pernikahan Lara & Deza") +
                "&location=" + encodeURIComponent("https://maps.app.goo.gl/X8atifHqncnZfFYd9");
            window.open(googleCalUrl, '_blank');
        });
    }

    const btnResepsi = document.getElementById('btn-save-calendar-resepsi');
    if (btnResepsi) {
        btnResepsi.addEventListener('click', function(e) {
            e.preventDefault();
            const googleCalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
                "&text=" + encodeURIComponent("Resepsi Pernikahan Lara & Deza") +
                "&dates=20261024T040000Z/20261024T070000Z" +
                "&details=" + encodeURIComponent("Resepsi Pernikahan Lara & Deza") +
                "&location=" + encodeURIComponent("https://maps.app.goo.gl/X8atifHqncnZfFYd9");
            window.open(googleCalUrl, '_blank');
        });
    }
}

document.addEventListener('DOMContentLoaded', initCountdown);