document.addEventListener("DOMContentLoaded", () => {
    // Google Sheets Entegrasyon URL'si (Boş bırakılırsa sadece LocalStorage'a kaydeder)
    const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwWQgLfFd7pLvgzOFE1ncj0TP-3796UX2Tbi2ReP2RNwl0WISKpBJwXv9QAewLTNBlvg/exec"; 

    // ==========================================================================
    // 1. GERİ SAYIM SAYACI (COUNTDOWN TIMER)
    // ==========================================================================
    // Hedef Düğün Tarihi: 12 Eylül 2026 Saat: 13:00
    // JavaScript'te Aylar 0-indekslidir: Ocak = 0, Eylül = 8.
    const weddingDate = new Date(2026, 8, 12, 13, 0, 0).getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const difference = weddingDate - now;

        // Elementleri Seç
        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minutesEl = document.getElementById("minutes");
        const secondsEl = document.getElementById("seconds");
        const countdownWrapper = document.getElementById("wedding-countdown");

        if (difference < 0) {
            // Tarih geçtiyse sayacı durdur ve mesajı göster
            if (countdownWrapper) {
                countdownWrapper.innerHTML = `
                    <div style="font-family: var(--font-serif); font-size: 2.2rem; color: var(--accent-gold); grid-column: 1 / -1; width: 100%; text-align: center; font-style: italic; animation: scaleUp 0.5s ease forwards;">
                        Biz Evlendik!
                    </div>
                `;
            }
            return;
        }

        // Zaman Hesaplamaları
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Değerleri DOM'a yazdır (Tek basamaklı sayıları "0" ile besleyerek)
        if (daysEl) daysEl.innerText = String(days).padStart(2, "0");
        if (hoursEl) hoursEl.innerText = String(hours).padStart(2, "0");
        if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, "0");
        if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, "0");
    };

    // İlk çalıştırma ve saniyelik döngü
    updateCountdown();
    setInterval(updateCountdown, 1000);


    // ==========================================================================
    // 2. LOCALSTORAGE İLE RSVP VERİ YÖNETİMİ
    // ==========================================================================
    const rsvpForm = document.getElementById("wedding-rsvp-form");
    const rsvpSuccess = document.getElementById("rsvp-success");
    const resetRsvpBtn = document.getElementById("btn-rsvp-reset");

    // RSVP Yanıtlarını LocalStorage'dan Çek
    const getRSVPEntries = () => {
        const data = localStorage.getItem("wedding_rsvps");
        return data ? JSON.parse(data) : [];
    };

    // RSVP Yanıtını Kaydet
    const saveRSVPEntry = (entry) => {
        const entries = getRSVPEntries();
        entries.push(entry);
        localStorage.setItem("wedding_rsvps", JSON.stringify(entries));
    };

    // RSVP Tablosunu Render Et
    const renderRSVPTable = () => {
        const entries = getRSVPEntries();
        const tableBody = document.getElementById("rsvp-table-body");
        
        if (!tableBody) return;

        if (entries.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">Kayıtlı RSVP yanıtı bulunmuyor. Formu doldurarak ekleme yapabilirsiniz.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = "";
        
        // Yeniden eskiye sıralama yapalım (en son gelen en üstte)
        const sortedEntries = [...entries].reverse();

        sortedEntries.forEach(entry => {
            const tr = document.createElement("tr");
            
            // 4 seçeneğe göre badge sınıfı ve metnini belirleme
            let badgeClass = "badge-success";
            let badgeText = "Katılıyor";
            
            if (entry.status === "alone") {
                badgeClass = "badge-success";
                badgeText = "Katılıyor (Yalnız)";
            } else if (entry.status === "couple") {
                badgeClass = "badge-success";
                badgeText = "Katılıyor (2 Kişi)";
            } else if (entry.status === "not-sure") {
                badgeClass = "badge-info";
                badgeText = "Emin Değil";
            } else if (entry.status === "cannot-attend") {
                badgeClass = "badge-danger";
                badgeText = "Katılamıyor";
            }
                
            const formattedDate = new Date(entry.timestamp).toLocaleString("tr-TR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            tr.innerHTML = `
                <td style="font-weight: 500;">${escapeHTML(entry.fullName)}</td>
                <td>${escapeHTML(entry.email || "-")}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td style="max-width: 250px; white-space: normal; word-break: break-word;">${escapeHTML(entry.message || "-")}</td>
                <td style="color: var(--text-muted); font-size: 0.8rem;">${formattedDate}</td>
            `;
            
            tableBody.appendChild(tr);
        });
    };

    // HTML Enjeksiyonunu Önleme Yardımcı Fonksiyonu (Security/Sanitization)
    const escapeHTML = (str) => {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    };

    // Form Gönderme Eventi
    if (rsvpForm) {
        rsvpForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const attendance = document.querySelector('input[name="attendance"]:checked').value;
            const message = document.getElementById("message").value.trim();

            const newRSVP = {
                fullName,
                email,
                status: attendance,
                message,
                timestamp: new Date().toISOString()
            };

            // LocalStorage'a Kaydet
            saveRSVPEntry(newRSVP);

            // Google Sheets Entegrasyonu (URL tanımlıysa gönderir)
            if (GOOGLE_SHEET_URL) {
                fetch(GOOGLE_SHEET_URL, {
                    method: "POST",
                    mode: "no-cors", // Yönlendirme sorunlarını aşmak için
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(newRSVP)
                })
                .then(() => console.log("Google Sheets'e gönderildi."))
                .catch(err => console.error("Google Sheets hatası:", err));
            }

            // Tabloyu Güncelle
            renderRSVPTable();

            // Form Durumunu Değiştir (Formu gizle, başarı ekranını göster)
            rsvpForm.style.display = "none";
            if (rsvpSuccess) {
                rsvpSuccess.style.display = "block";
            }
        });
    }

    // Yeni Yanıt Gönderme Butonu (Formu Sıfırlama)
    if (resetRsvpBtn) {
        resetRsvpBtn.addEventListener("click", () => {
            if (rsvpForm) {
                rsvpForm.reset();
                rsvpForm.style.display = "block";
            }
            if (rsvpSuccess) {
                rsvpSuccess.style.display = "none";
            }
        });
    }


    // ==========================================================================
    // 4. TEST / ADMIN PANELİ İÇİN EVENT LISTENERLAR
    // ==========================================================================
    const adminToggleBtn = document.getElementById("btn-toggle-admin");
    const adminTableWrapper = document.getElementById("admin-table-wrapper");
    const clearRsvpBtn = document.getElementById("btn-clear-rsvp");

    if (adminToggleBtn && adminTableWrapper) {
        adminToggleBtn.addEventListener("click", () => {
            const isVisible = adminTableWrapper.style.display === "block";
            
            if (isVisible) {
                adminTableWrapper.style.display = "none";
                adminToggleBtn.classList.remove("active");
            } else {
                adminTableWrapper.style.display = "block";
                adminToggleBtn.classList.add("active");
                // Tabloyu yükle
                renderRSVPTable();
            }
        });
    }

    if (clearRsvpBtn) {
        clearRsvpBtn.addEventListener("click", () => {
            if (confirm("Tüm RSVP veritabanı kayıtlarını silmek istediğinizden emin misiniz?")) {
                localStorage.removeItem("wedding_rsvps");
                renderRSVPTable();
            }
        });
    }

    // CSV/Excel Olarak Dışa Aktarma
    const exportCsvBtn = document.getElementById("btn-export-csv");
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", () => {
            const entries = getRSVPEntries();
            if (entries.length === 0) {
                alert("İndirilecek kayıt bulunmamaktadır.");
                return;
            }

            // Türkçe karakterlerin Excel'de doğru açılması için BOM (Byte Order Mark) ekliyoruz
            let csvContent = "\uFEFF";
            csvContent += "Ad Soyad;E-posta;Katılım Durumu;Mesaj / Not;Tarih\n";

            entries.forEach(entry => {
                let statusText = "Katılmıyor";
                if (entry.status === "alone") statusText = "Katılıyor (Yalnız)";
                else if (entry.status === "couple") statusText = "Katılıyor (2 Kişi)";
                else if (entry.status === "not-sure") statusText = "Emin Değil";

                const formattedDate = new Date(entry.timestamp).toLocaleString("tr-TR");
                
                const name = entry.fullName.replace(/;/g, ",").replace(/"/g, '""');
                const email = (entry.email || "").replace(/;/g, ",").replace(/"/g, '""');
                const message = (entry.message || "").replace(/;/g, ",").replace(/\n/g, " ").replace(/"/g, '""');

                csvContent += `"${name}";"${email}";"${statusText}";"${message}";"${formattedDate}"\n`;
            });

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `rsvp_katilim_listesi_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Sayfa yüklenince ilk tablo render işlemini yapalım
    renderRSVPTable();


    // ==========================================================================
    // 5. SAYFA KAYDIRILDIKÇA BELİRME ANİMASYONLARI (SCROLL REVEAL)
    // ==========================================================================
    const revealElements = document.querySelectorAll(".scroll-reveal");

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 100; // Ekranda 100px belirdiğinde tetiklensin

            if (elementTop < windowHeight - elementVisible) {
                element.classList.add("active");
            }
        });
    };

    window.addEventListener("scroll", revealOnScroll);
    // İlk kontrol (Ekranın üst kısmında zaten görünenler için)
    revealOnScroll();
});
