/**
 * PRELOADER.JS - Handles initial screen loading fade out
 */
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(function() {
            preloader.classList.add('fade-out');
            setTimeout(function() {
                preloader.style.display = 'none';
            }, 600);
        }, 500);
    }
});
