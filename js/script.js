/**
 * SCRIPT.JS - Main application controller
 */
let autoScrollInterval = null;
let isAutoScrolling = false;

document.addEventListener('DOMContentLoaded', function() {

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('to');
    const guestNameEl = document.getElementById('guest-name');

    const btnOpen = document.getElementById('btn-open-invitation');
    const coverScreen = document.getElementById('cover-screen');
    const floatingNav = document.getElementById('floating-nav');
    const musicContainer = document.getElementById('music-wrapper');

    if (btnOpen) {
        btnOpen.addEventListener('click', function() {
            document.body.classList.remove('no-scroll');
            coverScreen.classList.add('opened');
            
            if (floatingNav) floatingNav.classList.remove('hide-nav');
            if (musicContainer) musicContainer.classList.remove('hide-nav');

            if (typeof MusicController !== 'undefined') {
                MusicController.play();
            }
        });
    }

    // Auto scroll button listener
    const btnAutoScroll = document.getElementById('btn-auto-scroll');
    if (btnAutoScroll) {
        btnAutoScroll.addEventListener('click', function() {
            toggleContinuousAutoScroll(this);
        });
    }

    // Stop auto-scroll on manual user touch/scroll
    ['wheel', 'touchstart', 'mousedown'].forEach(evt => {
        window.addEventListener(evt, function() {
            if (isAutoScrolling) {
                stopContinuousAutoScroll();
            }
        }, { passive: true });
    });

    initScrollObserver();
});

function toggleContinuousAutoScroll(btn) {
    if (isAutoScrolling) {
        stopContinuousAutoScroll();
    } else {
        isAutoScrolling = true;
        if (btn) btn.classList.add('scrolling');
        
        autoScrollInterval = setInterval(() => {
            window.scrollBy(0, 2);
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                stopContinuousAutoScroll();
            }
        }, 30);
    }
}

function stopContinuousAutoScroll() {
    isAutoScrolling = false;
    if (autoScrollInterval) clearInterval(autoScrollInterval);
    const btn = document.getElementById('btn-auto-scroll');
    if (btn) btn.classList.remove('scrolling');
}

function copyToClipboard(text, btnElement) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showCopyFeedback(btnElement));
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showCopyFeedback(btnElement);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    }
}

function showCopyFeedback(btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!';
    btnElement.style.background = '#22c55e';
    setTimeout(() => {
        btnElement.innerHTML = originalText;
        btnElement.style.background = '';
    }, 2000);
}

function initScrollObserver() {
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.nav-item[href]');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                const id = entry.target.getAttribute('id');
                navItems.forEach(item => {
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        });
    }, { threshold: 0.2 });

    sections.forEach(section => sectionObserver.observe(section));
}