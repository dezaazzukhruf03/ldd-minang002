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

            // Animasi foto utama & nama pasangan di Beranda dipicu DI SINI,
            // bukan lewat scroll observer — soalnya section ini sudah
            // "kelihatan" sejak halaman dimuat (cuma ketutup cover-screen),
            // jadi kalau pakai scroll observer, animasinya keburu kelar
            // duluan di belakang layar sebelum undangan sempat dibuka.
            const heroPhoto = document.querySelector('.foto-utama .photo-frame');
            const heroName = document.querySelector('.bride-groom-text-beranda');
            if (heroPhoto) heroPhoto.classList.add('in-view');
            if (heroName) heroName.classList.add('in-view');

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

    // Observer #1 — hanya untuk menyalakan nav aktif (dot di floating-nav).
    // Threshold-nya sengaja lebih longgar karena ini cuma indikator navigasi,
    // bukan pemicu animasi.
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
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
    }, {
        threshold: 0.75,
        rootMargin: '0px 0px -8% 0px'
    });

    sections.forEach(section => sectionObserver.observe(section));

    // Observer #2 — khusus animasi, per ELEMEN INDIVIDUAL (bukan per grup/
    // section). Class .in-view ditambah saat elemen masuk melewati 75%
    // terlihat, dan DICOPOT LAGI (jadi .out-view) saat turun di bawah 60%
    // terlihat. Titik masuk & keluar SENGAJA dibuat beda (hysteresis),
    // bukan angka yang sama persis — kalau sama persis, pas auto-scroll
    // pelan elemen bisa "nongkrong" lama di titik itu dan bolak-balik
    // nyebrang garisnya tiap frame, jadinya keliatan bergetar/flicker.
    // Dengan jeda 0.75→0.6 ini, sekali sudah masuk dia baru dianggap
    // keluar kalau memang benar-benar sudah turun jauh, bukan cuma geser dikit.
    const ANIMATED_SELECTOR =
        '.quran-quote, .section-header, ' +
        '.couple-grid .photo-frame, .bride-groom-text-mempelai, ' +
        '.divider-heart, ' +
        '.story-card, .countdown-item, .event-card, .gallery-item, .atm-card';

    const ENTER_THRESHOLD = 0.75;
    const EXIT_THRESHOLD = 0.6;

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const ratio = entry.intersectionRatio;
            if (ratio >= ENTER_THRESHOLD) {
                entry.target.classList.add('in-view');
                entry.target.classList.remove('out-view');
            } else if (ratio <= EXIT_THRESHOLD && entry.target.classList.contains('in-view')) {
                // Hanya mainkan animasi "keluar" kalau elemen ini memang
                // sudah pernah kelihatan lebih dulu — supaya elemen yang
                // dari awal memang belum pernah masuk layar (misal section
                // paling bawah saat halaman baru dibuka) tidak langsung
                // dikira "keluar" sebelum sempat masuk sama sekali.
                entry.target.classList.remove('in-view');
                entry.target.classList.add('out-view');
            }
            // ratio di antara EXIT_THRESHOLD dan ENTER_THRESHOLD: dibiarkan,
            // ini "zona aman" yang mencegah flicker
        });
    }, {
        threshold: [0, EXIT_THRESHOLD, ENTER_THRESHOLD, 1]
    });

    document.querySelectorAll(ANIMATED_SELECTOR).forEach(item => {
        animationObserver.observe(item);
    });

    // Pengaman: kalau ada script lain (mis. calendar.js) yang me-render
    // ulang elemen bertarget (ganti innerHTML, dsb), node lamanya lenyap
    // dari observer dan node barunya tidak pernah terpantau. MutationObserver
    // ini otomatis mendaftarkan ulang setiap elemen baru yang cocok selector
    // di atas begitu muncul di DOM.
    const domWatcher = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return; // hanya elemen (bukan teks/komentar)
                if (node.matches && node.matches(ANIMATED_SELECTOR)) {
                    animationObserver.observe(node);
                }
                if (node.querySelectorAll) {
                    node.querySelectorAll(ANIMATED_SELECTOR).forEach(child => {
                        animationObserver.observe(child);
                    });
                }
            });
        });
    });
    domWatcher.observe(document.body, { childList: true, subtree: true });
}