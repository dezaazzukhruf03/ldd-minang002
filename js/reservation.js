(function () {

  /* =====================================================
     GOOGLE APPS SCRIPT
     GANTI SCRIPT_URL di bawah ini dengan URL Web App
     Google Apps Script kamu sendiri untuk undangan ini
     (Deploy > Web app > Copy URL), dan SHEET_NAME dengan
     nama sheet tempat data RSVP/ucapan disimpan.
  ===================================================== */

  const SCRIPT_URL =
    "GANTI_DENGAN_URL_WEB_APP_GOOGLE_APPS_SCRIPT_KAMU";

  const SHEET_NAME = "Ucapan";

  /* -------------------------------
     ELEMEN (ID sesuai index.html project ini)
  -------------------------------- */
  const form = document.getElementById("rsvp-form");
  const list = document.getElementById("wishes-list");
  const wishesCountEl = document.getElementById("wishes-count");
  const loadMoreBtn = document.getElementById("btn-load-more");

  const inputNama = document.getElementById("input-nama");
  const inputKehadiran = document.getElementById("input-kehadiran");
  const inputUcapan = document.getElementById("input-ucapan");

  const statHadir = document.getElementById("stat-hadir");
  const statTidak = document.getElementById("stat-tidak");
  const statRagu = document.getElementById("stat-ragu");

  const hiddenIframe = document.getElementById("hidden_iframe");

  /* -------------------------------
     HELPER
  -------------------------------- */
  const escapeHtml = (str) => {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Format tanggal saja (tanpa jam), contoh: "16 Agustus 2026"
  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const badgeClassFor = (kehadiran) => {
    const status = String(kehadiran || "").trim().toLowerCase();
    if (status === "hadir") return "badge-status badge-hadir";
    if (status === "tidak hadir") return "badge-status badge-tidak";
    return "badge-status badge-ragu";
  };

  /* --------------------------------
     STATISTIK RSVP
  -------------------------------- */
  const updateRsvpStatistics = (data) => {
    if (!statHadir || !statTidak || !statRagu) return;

    let hadir = 0, tidakHadir = 0, ragu = 0;

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const status = String(item.kehadiran || "").trim().toLowerCase();
        if (status === "hadir") hadir++;
        else if (status === "tidak hadir") tidakHadir++;
        else ragu++;
      });
    }

    statHadir.textContent = hadir;
    statTidak.textContent = tidakHadir;
    statRagu.textContent = ragu;
  };

  /* --------------------------------
     RENDER UCAPAN (pakai class CSS yang sudah ada di style.css:
     .wish-item, .wish-header, .wish-name, .badge-status, .wish-time, .wish-text)
  -------------------------------- */
  let allWishesData = [];
  const WISH_PAGE_SIZE = 5;
  let wishVisibleCount = WISH_PAGE_SIZE;

  const renderWishes = (data) => {
    if (!list) return;

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = `<p class="wish-empty">Belum ada ucapan. Jadilah yang pertama mengirim doa.</p>`;
      if (wishesCountEl) wishesCountEl.textContent = "0";
      if (loadMoreBtn) loadMoreBtn.classList.add("hide-btn");
      updateRsvpStatistics([]);
      return;
    }

    updateRsvpStatistics(data);
    if (wishesCountEl) wishesCountEl.textContent = String(data.length);

    // Tampilkan yang paling baru dulu
    allWishesData = data.slice().reverse();
    wishVisibleCount = WISH_PAGE_SIZE;
    renderWishPage();
  };

  const renderWishPage = () => {
    if (!list) return;

    const visible = allWishesData.slice(0, wishVisibleCount);

    const itemsHtml = visible.map((item) => `
      <div class="wish-item">
        <div class="wish-header">
          <span class="wish-name">${escapeHtml(item.nama)}</span>
          <span class="${badgeClassFor(item.kehadiran)}">${escapeHtml(item.kehadiran)}</span>
        </div>
        ${item.ucapan ? `<p class="wish-text">${escapeHtml(item.ucapan)}</p>` : ""}
        ${item.waktu ? `<small class="wish-time">${formatDate(item.waktu)}</small>` : ""}
      </div>
    `).join("");

    list.innerHTML = itemsHtml;

    const hasMore = allWishesData.length > wishVisibleCount;
    if (loadMoreBtn) {
      loadMoreBtn.classList.toggle("hide-btn", !hasMore);
      loadMoreBtn.textContent = hasMore
        ? `Muat Ucapan Lainnya (${allWishesData.length - wishVisibleCount})`
        : "Muat Ucapan Lainnya";
    }
  };

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      wishVisibleCount += WISH_PAGE_SIZE;
      renderWishPage();
    });
  }

  /* --------------------------------
     LOAD UCAPAN DARI GOOGLE SHEETS (JSONP — menghindari CORS
     karena Apps Script Web App tidak selalu mengirim header CORS
     untuk fetch() biasa)
  -------------------------------- */
  const loadWishes = () => {
    if (!list) return;

    const callbackName = "__ldWishesCallback_" + Date.now();
    const script = document.createElement("script");

    window[callbackName] = (data) => {
      try {
        if (data && data.success === false) {
          console.error("Apps Script:", data.message);
          return;
        }
        renderWishes(data);
      } finally {
        delete window[callbackName];
        script.remove();
      }
    };

    script.onerror = () => {
      console.error("Gagal mengambil data ucapan dari Google Sheets.");
      delete window[callbackName];
      script.remove();
    };

    script.src =
      SCRIPT_URL +
      "?sheet=" + encodeURIComponent(SHEET_NAME) +
      "&callback=" + encodeURIComponent(callbackName) +
      "&t=" + Date.now();

    document.body.appendChild(script);

    setTimeout(() => {
      if (window[callbackName]) {
        delete window[callbackName];
        script.remove();
        console.warn("Request ucapan timeout.");
      }
    }, 10000);
  };

  /* --------------------------------
     KIRIM DATA KE GOOGLE SHEETS
     Memakai iframe tersembunyi yang sudah ada di index.html
     (id="hidden_iframe") sebagai target submit form, supaya
     tidak kena masalah CORS seperti kalau pakai fetch() POST.
  -------------------------------- */
  const submitToGoogleSheets = (data) => {
    return new Promise((resolve) => {
      const submitForm = document.createElement("form");
      submitForm.method = "POST";
      submitForm.action = SCRIPT_URL;
      submitForm.target = "hidden_iframe";
      submitForm.style.display = "none";

      Object.entries(data).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value ?? "";
        submitForm.appendChild(input);
      });

      document.body.appendChild(submitForm);

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        submitForm.remove();
        resolve();
      };

      if (hiddenIframe) {
        hiddenIframe.addEventListener("load", finish, { once: true });
      }

      submitForm.submit();

      // Jaga-jaga kalau event "load" iframe tidak terpicu
      setTimeout(finish, 3000);
    });
  };

  /* --------------------------------
     SUBMIT RSVP
  -------------------------------- */
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = inputNama ? inputNama.value.trim() : "";
      const status = inputKehadiran ? inputKehadiran.value : "";
      const msg = inputUcapan ? inputUcapan.value.trim() : "";

      if (!name || !status || !msg) {
        showToast("Mohon lengkapi semua kolom form.");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonHtml = submitButton ? submitButton.innerHTML : "";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
      }

      try {
        const data = {
          sheet: SHEET_NAME,
          nama: name,
          kehadiran: status,
          ucapan: msg,
          waktu: new Date().toISOString()
        };

        await submitToGoogleSheets(data);

        form.reset();
        showToast("Terima kasih, RSVP dan ucapan Anda berhasil dikirim.");

        setTimeout(() => loadWishes(), 1000);

      } catch (error) {
        console.error("Gagal mengirim RSVP:", error);
        showToast("Maaf, ucapan belum berhasil dikirim. Silakan coba lagi.");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonHtml || '<i class="fa-solid fa-paper-plane"></i> Kirim Ucapan';
        }
      }
    });
  }

  /* --------------------------------
     TOAST NOTIFIKASI (dibuat sendiri di sini, tidak perlu
     markup tambahan di index.html — otomatis menyisipkan
     wadahnya sendiri kalau belum ada)
  -------------------------------- */
  window.showToast = window.showToast || function (msg) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = [
        "position:fixed",
        "left:50%",
        "bottom:90px",
        "transform:translateX(-50%)",
        "z-index:5000",
        "display:flex",
        "flex-direction:column",
        "gap:8px",
        "align-items:center",
        "pointer-events:none",
        "width:calc(100% - 40px)",
        "max-width:410px"
      ].join(";");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.cssText = [
      "background:rgba(128,0,0,0.95)",
      "color:#ffffff",
      "padding:10px 18px",
      "border-radius:20px",
      "font-size:0.8rem",
      "text-align:center",
      "box-shadow:0 6px 18px rgba(0,0,0,0.25)",
      "opacity:0",
      "transition:opacity 0.3s ease"
    ].join(";");

    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = "1"; });

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  /* --------------------------------
     LOAD UCAPAN SAAT WEBSITE DIBUKA
  -------------------------------- */
  loadWishes();

})();