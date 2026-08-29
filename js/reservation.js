/**
 * RESERVATION.JS - Handles RSVP submission, live statistics, pagination & fallback demo mode
 */

// Replace with actual deployed Web App URL from Google Apps Script if available
const GAS_URL = "https://script.google.com/macros/s/AKfycbx_EXAMPLE_REPLACE_ME/exec"; 
const SHEET_PROJECT_NAME = "DezaLara"; // Identifies this invitation project

let allWishes = [
    { nama: "Budi Santoso", kehadiran: "Hadir", ucapan: "Selamat Deza & Lara! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.", waktu: "2026-08-20T10:00:00.000Z" },
    { nama: "Siti Rahma", kehadiran: "Hadir", ucapan: "Barakallah! Senang sekali mendengar kabar bahagianya.", waktu: "2026-08-21T14:30:00.000Z" },
    { nama: "Andi Wijaya", kehadiran: "Ragu-ragu", ucapan: "Selamat ya kawan! Semoga lancar sampai hari H.", waktu: "2026-08-22T09:15:00.000Z" },
    { nama: "Dewi Lestari", kehadiran: "Tidak Hadir", ucapan: "Selamat Deza dan Lara! Mohon maaf belum bisa hadir karena ada tugas luar kota.", waktu: "2026-08-23T16:45:00.000Z" }
];

let visibleCount = 3;

document.addEventListener('DOMContentLoaded', function() {
    renderWishes();
    setupFormSubmit();
    
    // Attempt JSONP load if Google Apps Script URL configured
    loadWishesFromGAS();

    const btnLoadMore = document.getElementById('btn-load-more');
    if (btnLoadMore) {
        btnLoadMore.addEventListener('click', function() {
            visibleCount += 3;
            renderWishes();
        });
    }
});

function loadWishesFromGAS() {
    if (GAS_URL.includes("EXAMPLE_REPLACE_ME")) return;

    const callbackName = "handleGASResponse_" + Math.round(Math.random() * 1000000);
    window[callbackName] = function(data) {
        if (Array.isArray(data) && data.length > 0) {
            allWishes = data;
            renderWishes();
        }
        delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `${GAS_URL}?sheet=${SHEET_PROJECT_NAME}&callback=${callbackName}`;
    document.body.appendChild(script);
}

function renderWishes() {
    const listEl = document.getElementById('wishes-list');
    const countEl = document.getElementById('wishes-count');
    const btnLoadMore = document.getElementById('btn-load-more');

    if (!listEl) return;

    listEl.innerHTML = '';
    countEl.innerText = allWishes.length;

    // Calculate RSVP Stats
    let hadir = 0, tidak = 0, ragu = 0;
    allWishes.forEach(item => {
        const k = (item.kehadiran || '').toLowerCase();
        if (k === 'hadir') hadir++;
        else if (k === 'tidak hadir') tidak++;
        else if (k === 'ragu-ragu') ragu++;
    });

    document.getElementById('stat-hadir').innerText = hadir;
    document.getElementById('stat-tidak').innerText = tidak;
    document.getElementById('stat-ragu').innerText = ragu;

    const itemsToDisplay = allWishes.slice(0, visibleCount);

    itemsToDisplay.forEach(item => {
        const wishCard = document.createElement('div');
        wishCard.className = 'wish-item';

        let badgeClass = 'badge-hadir';
        if (item.kehadiran === 'Tidak Hadir') badgeClass = 'badge-tidak';
        if (item.kehadiran === 'Ragu-ragu') badgeClass = 'badge-ragu';

        let formattedDate = 'Baru saja';
        if (item.waktu) {
            try {
                formattedDate = new Date(item.waktu).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
            } catch(e) { formattedDate = item.waktu; }
        }

        wishCard.innerHTML = `
            <div class="wish-header">
                <span class="wish-name">${escapeHtml(item.nama)}</span>
                <span class="badge-status ${badgeClass}">${escapeHtml(item.kehadiran)}</span>
            </div>
            <div class="wish-time">${formattedDate}</div>
            <div class="wish-text">${escapeHtml(item.ucapan)}</div>
        `;
        listEl.appendChild(wishCard);
    });

    if (btnLoadMore) {
        if (visibleCount < allWishes.length) {
            btnLoadMore.classList.remove('hide-btn');
        } else {
            btnLoadMore.classList.add('hide-btn');
        }
    }
}

function setupFormSubmit() {
    const form = document.getElementById('rsvp-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const nama = document.getElementById('input-nama').value.trim();
        const kehadiran = document.getElementById('input-kehadiran').value;
        const ucapan = document.getElementById('input-ucapan').value.trim();

        if (!nama || !kehadiran || !ucapan) return;

        const newWish = {
            nama: nama,
            kehadiran: kehadiran,
            ucapan: ucapan,
            waktu: new Date().toISOString()
        };

        // Add to local array immediately for instant UX feedback
        allWishes.unshift(newWish);
        renderWishes();

        // If real Apps Script URL set, submit via iframe to prevent CORS reload
        if (!GAS_URL.includes("EXAMPLE_REPLACE_ME")) {
            const iframeForm = document.createElement('form');
            iframeForm.method = 'POST';
            iframeForm.action = GAS_URL;
            iframeForm.target = 'hidden_iframe';

            const fields = { sheet: SHEET_PROJECT_NAME, nama, kehadiran, ucapan };
            for (let k in fields) {
                const inp = document.createElement('input');
                inp.type = 'hidden';
                inp.name = k;
                inp.value = fields[k];
                iframeForm.appendChild(inp);
            }
            document.body.appendChild(iframeForm);
            iframeForm.submit();
            document.body.removeChild(iframeForm);
        }

        form.reset();
        alert('Terima kasih! Ucapan & konfirmasi kehadiran Anda telah terkirim.');
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}