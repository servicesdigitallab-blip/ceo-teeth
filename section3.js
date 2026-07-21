/* ══════════════════════════════════════════════════════
   SECTION 3 – LUMEN Horizontal Pinned 5-Treatment Gallery
   ══════════════════════════════════════════════════════ */
(() => {
    'use strict';

    const section = document.getElementById('services-section');
    const video = document.getElementById('services-video');
    const craftTrack = document.querySelector('.craft-h-track');
    const dots = document.querySelectorAll('.craft-h-dots span');
    const cards = document.querySelectorAll('.craft-h-card');

    if (!section || !craftTrack) return;

    let wasInSection = false;
    let ticking = false;

    /* ── Render Frame Update ── */
    function updateSection3() {
        ticking = false;

        const rect = section.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const sectionHeight = section.offsetHeight;
        const maxScroll = sectionHeight - winHeight;

        // Check visibility of Section 3
        const isInSection = (rect.bottom > 0) && (rect.top < winHeight);

        /* ── Video Playback Management ── */
        if (video) {
            video.muted = true;
            if (isInSection) {
                if (video.paused) {
                    video.play().catch(() => {});
                }
            }
        }

        /* ── Desktop Horizontal Scroll Translation ── */
        if (window.innerWidth > 900 && maxScroll > 0) {
            const scrolled = -rect.top;
            const rawProgress = Math.max(0, Math.min(1.0, scrolled / maxScroll)); // 0.0 to 1.0

            // Map 0% to 80% of scroll progress to horizontal translation
            // The remaining 20% holds Card 5 static so Section 3 finishes 100% before Section 4 arrives
            const horizProgress = Math.min(1.0, rawProgress / 0.80);

            // Calculate exact distance from first card to last card
            let maxTranslateX = 0;
            if (cards.length > 1) {
                maxTranslateX = cards[cards.length - 1].offsetLeft - cards[0].offsetLeft;
            } else {
                maxTranslateX = Math.max(0, craftTrack.scrollWidth - window.innerWidth + 60);
            }

            const translateX = horizProgress * maxTranslateX;
            craftTrack.style.transform = `translate3d(-${translateX.toFixed(2)}px, 0, 0)`;

            // Active indicator dots calculation (0 to 4)
            if (cards.length > 0 && dots.length > 0) {
                const cardCount = cards.length;
                const activeIdx = Math.min(cardCount - 1, Math.floor(horizProgress * cardCount * 0.999));
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === activeIdx);
                });
            }
        }
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateSection3);
            ticking = true;
        }
    }

    /* ── Events ── */
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);

    if (video) {
        video.muted = true;
        video.playsInline = true;
        const playVideo = () => {
            if (video.paused) {
                video.play().catch(() => {});
            }
        };
        playVideo();
        setInterval(playVideo, 1000); // 1-second heartbeat play check guarantee
        window.addEventListener('scroll', playVideo, { passive: true });
        window.addEventListener('touchstart', playVideo, { passive: true });
        window.addEventListener('click', playVideo, { passive: true });
    }

    updateSection3();
})();
