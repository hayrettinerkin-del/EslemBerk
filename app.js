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
