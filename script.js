document.addEventListener('DOMContentLoaded', () => {
    const CANVAS_W = 320;
    const CANVAS_H = 480;
    const scaleCanvas = document.getElementById('scaleCanvas');

    const applyScale = () => {
        if (!scaleCanvas) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = Math.min(w / CANVAS_W, h / CANVAS_H);
        scaleCanvas.style.transform = `scale(${scale})`;
    };

    applyScale();
    window.addEventListener('resize', applyScale);

    const video = document.getElementById('videoPlayer');
    const btnPlay = document.getElementById('btnPlay');
    const progressCurrent = document.querySelector('.progress-current');
    const progressBuffered = document.querySelector('.progress-buffered');
    const progressInput = document.querySelector('.progress-input');

    if (!video || !btnPlay) return;

    // Auto-play saat halaman pertama kali dimuat/reload (muted agar browser mengizinkan)
    video.play().catch(() => {});

    const btnSound = document.getElementById('btnSound');
    if (btnSound) {
        btnSound.classList.add('muted');
        btnSound.addEventListener('click', () => {
            video.muted = !video.muted;
            btnSound.classList.toggle('muted', video.muted);
        });
    }

    video.addEventListener('volumechange', () => {
        if (btnSound) btnSound.classList.toggle('muted', video.muted);
    });

    // Play / Pause - unmute saat user klik play (agar suara bisa didengar)
    btnPlay.addEventListener('click', () => {
        if (video.paused) {
            video.muted = false;
            video.play();
            btnPlay.classList.add('playing');
        } else {
            video.pause();
            btnPlay.classList.remove('playing');
        }
    });

    // Update tampilan saat video play/pause
    video.addEventListener('play', () => btnPlay.classList.add('playing'));
    video.addEventListener('pause', () => btnPlay.classList.remove('playing'));

    // Progress bar - update saat video berjalan
    video.addEventListener('timeupdate', () => {
        const percent = (video.currentTime / video.duration) * 100;
        progressCurrent.style.width = `${percent}%`;
        progressInput.value = percent;
    });

    // Duration saat metadata loaded (tidak menampilkan di UI)

    // Buffer progress
    video.addEventListener('progress', () => {
        if (video.buffered.length > 0) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            const percent = (bufferedEnd / video.duration) * 100;
            progressBuffered.style.width = `${percent}%`;
        }
    });

    // Klik/geser progress bar untuk seek
    progressInput.addEventListener('input', (e) => {
        const percent = e.target.value;
        video.currentTime = (percent / 100) * video.duration;
        progressCurrent.style.width = `${percent}%`;
    });

    // Tampilkan gambar KS.jpg saat video selesai
    const videoEndOverlay = document.getElementById('videoEndOverlay');
    const btnReplay = document.getElementById('btnReplay');

    const endImage = document.querySelector('.end-image');

    const endButtons = document.querySelector('.end-buttons');

    const cardGrid = document.getElementById('cardGrid');
    const endButtonsActions = document.querySelector('.btn-row');
    const btnInfoLengkap = document.getElementById('btnInfoLengkap');
    const btnInstruksi = document.getElementById('btnInstruksi');
    const endLogo = document.getElementById('endLogo');
    const btnBelanja = document.getElementById('btnBelanja');
    video.addEventListener('ended', () => {
        if (videoEndOverlay) {
            if (endImage) endImage.src = 'assets/KS.jpg';
            if (endButtonsActions) endButtonsActions.style.display = '';
            if (btnInfoLengkap) btnInfoLengkap.classList.remove('visible');
            if (endLogo) endLogo.classList.remove('visible');
            if (cardGrid) cardGrid.classList.remove('visible');
            if (btnBelanja) btnBelanja.classList.remove('visible');
            if (btnInstruksi) btnInstruksi.style.visibility = '';
            if (placeInfoOverlay) placeInfoOverlay.classList.remove('visible');
            if (btnReplay) btnReplay.style.display = '';
            document.getElementById('countdownReminder')?.classList.remove('visible');
            videoEndOverlay.classList.add('visible');
        }
    });

    if (btnReplay && videoEndOverlay) {
        btnReplay.addEventListener('click', () => {
            videoEndOverlay?.classList.remove('session-bg2');
            if (endImage?.src?.includes('BG_2.jpg')) {
                // Sesi BG_2: kembali ke KS.jpg dengan 3 button (tombol disembunyikan di BG_2, branch ini jarang tercapai)
                if (endImage) endImage.src = 'assets/KS.jpg';
                if (endButtonsActions) endButtonsActions.style.display = '';
                if (btnInfoLengkap) btnInfoLengkap.classList.remove('visible');
                if (btnBelanja) btnBelanja.classList.remove('visible');
                if (btnInstruksi) btnInstruksi.style.visibility = '';
                if (endLogo) endLogo.classList.remove('visible');
                if (cardGrid) {
                    resetCards();
                    cardGrid.classList.remove('visible');
                }
                if (oopsOverlay) oopsOverlay.classList.remove('visible');
                if (placeInfoOverlay) placeInfoOverlay.classList.remove('visible');
                if (countdownReminder) countdownReminder.classList.remove('visible');
                if (countdownInterval) clearInterval(countdownInterval);
                if (cardSelectedTimeout) clearTimeout(cardSelectedTimeout);
                if (btnReplay) btnReplay.style.display = '';
            } else if (btnBelanja?.classList.contains('visible')) {
                // Sesi KS+belanja: tombol disembunyikan, branch ini tidak tercapai
                if (endImage) endImage.src = 'assets/BG_2.jpg';
                if (endButtonsActions) endButtonsActions.style.display = 'none';
                if (btnInfoLengkap) btnInfoLengkap.classList.add('visible');
                if (btnInstruksi) btnInstruksi.style.visibility = '';
                if (endLogo) endLogo.classList.add('visible');
                if (cardGrid) {
                    resetCards();
                    cardGrid.classList.add('visible');
                }
                if (btnBelanja) btnBelanja.classList.remove('visible');
                if (btnReplay) btnReplay.style.display = 'none';
                videoEndOverlay?.classList.add('session-bg2');
            } else {
                // Sesi KS dengan 3 button: kembali ke video
                if (btnBelanja) btnBelanja.classList.remove('visible');
                if (btnInstruksi) btnInstruksi.style.visibility = '';
                if (btnReplay) btnReplay.style.display = '';
                videoEndOverlay?.classList.remove('session-bg2');
                videoEndOverlay.classList.remove('visible');
                video.currentTime = 0;
                video.play();
                btnPlay.classList.add('playing');
            }
        });
    }

    // Handler kartu - memory game: 4 pasang, buka 2 kartu, jika tidak cocok = oops
    const CARD_IMAGES = ['assets/card_01.png', 'assets/card_02.png', 'assets/card_03.png', 'assets/card_04.png'];
    const oopsOverlay = document.getElementById('oopsOverlay');
    const oopsClose = document.getElementById('oopsClose');

    let cardValues = []; // nilai tiap kartu: [0,1,2,3,0,1,2,3] setelah shuffle
    let flippedCards = []; // kartu yang sedang terbuka (maks 2, belum matched)

    const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const resetCards = () => {
        cardValues = shuffle([0, 1, 2, 3, 0, 1, 2, 3]);
        flippedCards = [];
        document.querySelectorAll('.card-item').forEach((card, i) => {
            card.src = 'assets/card_default.png';
            card.dataset.revealed = 'false';
            card.dataset.matched = 'false';
            card.dataset.cardIndex = i;
        });
    };

    const switchToBG2 = () => {
        if (endImage) {
            endImage.src = 'assets/BG_2.jpg';
            endImage.alt = 'Kidzstation';
        }
        if (endButtonsActions) {
            endButtonsActions.style.display = 'none';
        }
        if (btnInfoLengkap) {
            btnInfoLengkap.classList.add('visible');
        }
        if (endLogo) {
            endLogo.classList.add('visible');
        }
        if (cardGrid) {
            resetCards();
            cardGrid.classList.add('visible');
        }
        if (oopsOverlay) {
            oopsOverlay.classList.remove('visible');
        }
        if (placeInfoOverlay) {
            placeInfoOverlay.classList.remove('visible');
        }
        if (countdownReminder) countdownReminder.classList.remove('visible');
        if (countdownInterval) clearInterval(countdownInterval);
        if (cardSelectedTimeout) clearTimeout(cardSelectedTimeout);
        if (btnReplay) btnReplay.style.display = 'none';
        videoEndOverlay?.classList.add('session-bg2');
    };

    let cardSelectedTimeout = null;
    let countdownInterval = null;
    const countdownReminder = document.getElementById('countdownReminder');
    const countdownNumber = document.getElementById('countdownNumber');

    const switchToKSWithBelanja = () => {
        if (endImage) endImage.src = 'assets/KS.jpg';
        if (endButtonsActions) endButtonsActions.style.display = 'none';
        if (btnInfoLengkap) btnInfoLengkap.classList.remove('visible');
        if (btnInstruksi) btnInstruksi.style.visibility = 'hidden';
        if (endLogo) endLogo.classList.remove('visible');
        if (cardGrid) cardGrid.classList.remove('visible');
        if (btnBelanja) btnBelanja.classList.add('visible');
        if (oopsOverlay) oopsOverlay.classList.remove('visible');
        if (placeInfoOverlay) placeInfoOverlay.classList.remove('visible');
        if (countdownReminder) countdownReminder.classList.remove('visible');
        if (countdownInterval) clearInterval(countdownInterval);
        if (btnReplay) btnReplay.style.display = 'none';
        videoEndOverlay?.classList.remove('session-bg2');
    };

    cardGrid?.addEventListener('click', (e) => {
        const card = e.target.closest('.card-item');
        if (!card) return;

        const idx = parseInt(card.dataset.cardIndex, 10);
        const isRevealed = card.dataset.revealed === 'true';
        const isMatched = card.dataset.matched === 'true';

        if (isRevealed || isMatched) return;
        if (flippedCards.length >= 2) return; // tunggu sampai oops ditutup

        card.src = CARD_IMAGES[cardValues[idx]];
        card.dataset.revealed = 'true';
        flippedCards.push({ el: card, idx, value: cardValues[idx] });

        if (flippedCards.length === 2) {
            const [a, b] = flippedCards;
            if (a.value === b.value) {
                a.el.dataset.matched = 'true';
                b.el.dataset.matched = 'true';
                flippedCards = [];
                const allMatched = document.querySelectorAll('.card-item[data-matched="true"]').length === 8;
                if (allMatched) setTimeout(switchToKSWithBelanja, 600);
            } else {
                oopsOverlay?.classList.add('visible');
            }
        }
    });

    oopsClose?.addEventListener('click', () => {
        oopsOverlay?.classList.remove('visible');
        flippedCards.forEach(({ el }) => {
            el.src = 'assets/card_default.png';
            el.dataset.revealed = 'false';
        });
        flippedCards = [];
    });

    const placeInfoOverlay = document.getElementById('placeInfoOverlay');
    const placeInfoClose = document.getElementById('placeInfoClose');

    placeInfoClose?.addEventListener('click', () => {
        placeInfoOverlay?.classList.remove('visible');
    });

    btnInfoLengkap?.addEventListener('click', () => {
        placeInfoOverlay?.classList.add('visible');
    });

    btnInstruksi?.addEventListener('click', () => {
        if (!endImage?.src?.includes('BG_2.jpg')) {
            switchToBG2();
        }
    });
    document.getElementById('btnInfo')?.addEventListener('click', () => {
        placeInfoOverlay?.classList.add('visible');
    });
    document.getElementById('btnMain')?.addEventListener('click', switchToBG2);

});
