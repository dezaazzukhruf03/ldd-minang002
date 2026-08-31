/**
 * SCRIPT.JS - Main application controller
 */
let autoScrollInterval = null;
let isAutoScrolling = false;

/* --------------------------------------------------------------------------
   Cegah Zoom di iOS Safari
   Sejak iOS 10, Safari SENGAJA mengabaikan "user-scalable=no" dan
   "maximum-scale=1" di meta viewport (alasan aksesibilitas Apple) — jadi
   walau HTML-nya sudah benar, iPhone tetap bisa pinch-zoom. Meta viewport
   tetap dipertahankan untuk browser lain (Android/Chrome sudah menghormatinya),
   tapi khusus iOS harus dicegah manual lewat JS: blokir gesture pinch
   ("gesturestart"/"gesturechange") dan double-tap zoom.
   -------------------------------------------------------------------------- */
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});
document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
});
document.addEventListener('gestureend', function (e) {
    e.preventDefault();
});

// Blokir pinch-zoom pakai 2 jari (touchmove dengan >1 titik sentuh)
document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Blokir double-tap zoom (dua ketuk cepat berturut-turut)
let lastTouchEnd = 0;
document.addEventListener('touchend', function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

document.addEventListener('DOMContentLoaded', function() {

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('to');
    const guestNameEl = document.getElementById('guest-name');
    const guestBoxEl = document.getElementById('guest-box');

    // Tampilkan kotak "Kepada Yth." hanya jika link mengandung ?to=NamaTamu
    if (guestParam && guestNameEl) {
        const cleanName = decodeURIComponent(guestParam.replace(/\+/g, ' ')).trim();
        if (cleanName) {
            guestNameEl.textContent = cleanName;
            if (guestBoxEl) guestBoxEl.classList.remove('hide-guest-box');
        }
    }

    const btnOpen = document.getElementById('btn-open-invitation');
    const coverScreen = document.getElementById('cover-screen');
    const floatingNav = document.getElementById('floating-nav');
    const musicContainer = document.getElementById('music-wrapper');
    const btnAutoScroll = document.getElementById('btn-auto-scroll');

    if (btnOpen) {
        btnOpen.addEventListener('click', function() {
            document.body.classList.remove('no-scroll');
            coverScreen.classList.add('opened');

            if (floatingNav) floatingNav.classList.remove('hide-nav');
            if (musicContainer) musicContainer.classList.remove('hide-nav');

            if (typeof MusicController !== 'undefined') {
                MusicController.play();
            }

            // Auto-scroll langsung aktif begitu undangan dibuka
            startContinuousAutoScroll(btnAutoScroll);
        });
    }

    // Klik tombol auto-scroll = toggle manual (nyala/mati)
    if (btnAutoScroll) {
        btnAutoScroll.addEventListener('click', function() {
            toggleContinuousAutoScroll(this);
        });
    }

    // Catatan: auto-scroll TIDAK lagi berhenti otomatis saat user
    // scroll/sentuh/klik layar — hanya berhenti kalau tombol
    // auto-scroll sendiri yang diklik (atau sudah sampai dasar halaman).

    initScrollObserver();
});

function startContinuousAutoScroll(btn) {
    if (isAutoScrolling) return;

    isAutoScrolling = true;
    if (btn) btn.classList.add('scrolling');
    const notice = document.getElementById('auto-scroll-notice');
    if (notice) notice.classList.add('show');

    autoScrollInterval = setInterval(() => {
        window.scrollBy(0, 2);
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
            stopContinuousAutoScroll();
        }
    }, 30);
}

function toggleContinuousAutoScroll(btn) {
    if (isAutoScrolling) {
        stopContinuousAutoScroll();
    } else {
        startContinuousAutoScroll(btn);
    }
}

function stopContinuousAutoScroll() {
    isAutoScrolling = false;
    if (autoScrollInterval) clearInterval(autoScrollInterval);
    const btn = document.getElementById('btn-auto-scroll');
    if (btn) btn.classList.remove('scrolling');
    const notice = document.getElementById('auto-scroll-notice');
    if (notice) notice.classList.remove('show');
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