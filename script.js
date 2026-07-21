/* ══════════════════════════════════════════════════════
   SECTION 1 – Buttery-Smooth Canvas Video Scroll Player
   ══════════════════════════════════════════════════════ */
(() => {
    'use strict';

    const canvas = document.getElementById('video-canvas');
    const ctx    = canvas.getContext('2d');
    const hero   = document.getElementById('hero');

    if (!canvas || !ctx || !hero) return;

    /* ── Configuration ── */
    const TOTAL_FRAMES  = 254;
    const FRAME_PATH    = 'frames/new_frame_';
    const LERP_FACTOR   = 0.25; // Snappy ultra-fast scroll reaction
    const SCROLL_LENGTH = '3800vh';
    const RESIZE_WIDTH  = 960; // Ultra-fast 60fps GPU texture size

    /* ── Render Queues & Cache ── */
    const bitmaps      = new Array(TOTAL_FRAMES);
    const fallbackImgs = new Array(TOTAL_FRAMES); // Temparary loaded image cache
    let allDecoded     = false;

    /* Animation states */
    let currentFrame = 0;
    let targetFrame  = 0;
    let lastDrawnIdx = -1;
    let animActive   = false;

    /* Cached layout dimensions to bypass layout thrashing */
    let canvasWidth = 0;
    let canvasHeight = 0;
    let cachedHeroHeight = 0;
    let cachedWindowHeight = 0;
    let cachedMaxScroll = 0;

    let drawX = 0;
    let drawY = 0;
    let drawWidth = 0;
    let drawHeight = 0;
    let boundsCalculated = false;

    /* ── Calculate Letterbox/Aspect Cover Bounds ── */
    function calculateBounds(imgWidth, imgHeight) {
        const cw = canvasWidth, ch = canvasHeight;
        const ir = imgWidth / imgHeight, cr = cw / ch;
        if (cr > ir) {
            drawWidth = cw;
            drawHeight = cw / ir;
            drawX = 0;
            drawY = (ch - drawHeight) / 2;
        } else {
            drawHeight = ch;
            drawWidth = ch * ir;
            drawX = (cw - drawWidth) / 2;
            drawY = 0;
        }
        boundsCalculated = true;
    }

    /* ── High-Performance Canvas Resizer ── */
    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.2);
        let targetW = window.innerWidth * dpr;
        let targetH = window.innerHeight * dpr;
        
        // Cap the render buffer size at 960px width for 60fps/120fps lag-free scrolling
        const MAX_RENDER_WIDTH = 960;
        if (targetW > MAX_RENDER_WIDTH) {
            const scale = MAX_RENDER_WIDTH / targetW;
            targetW = MAX_RENDER_WIDTH;
            targetH = targetH * scale;
        }

        canvasWidth = Math.round(targetW);
        canvasHeight = Math.round(targetH);
        
        canvas.width  = canvasWidth;
        canvas.height = canvasHeight;
        
        // Display size stretched to cover viewport
        canvas.style.width  = window.innerWidth  + 'px';
        canvas.style.height = window.innerHeight + 'px';
        
        cachedHeroHeight = hero.offsetHeight;
        cachedWindowHeight = window.innerHeight;
        cachedMaxScroll = cachedHeroHeight - cachedWindowHeight;
        
        boundsCalculated = false;
        ctx.imageSmoothingEnabled = true;
        
        paint(Math.round(currentFrame));
    }

    /* ── Render Single Frame ── */
    function paint(idx) {
        // Draw pre-decoded GPU bitmap for zero-lag
        const bitmap = bitmaps[idx];
        if (bitmap) {
            if (!boundsCalculated) {
                calculateBounds(bitmap.width, bitmap.height);
            }
            ctx.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
            return true;
        }
        
        // Fallback: draw raw image if loaded
        const img = fallbackImgs[idx];
        if (img && img.complete && img.naturalWidth) {
            if (!boundsCalculated) {
                calculateBounds(img.naturalWidth, img.naturalHeight);
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            return true;
        }
        return false;
    }

    /* ── Asynchronous GPU Texture Preloader ── */
    function preloadAndDecodeAll() {
        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = FRAME_PATH + String(i + 1).padStart(4, '0') + '.jpg';
            fallbackImgs[i] = img;
            
            img.onload = () => {
                startAnimation();
                if (typeof createImageBitmap === 'function') {
                    createImageBitmap(img, { resizeWidth: RESIZE_WIDTH, resizeQuality: 'high' })
                        .then(bitmap => {
                            bitmaps[i] = bitmap;
                            startAnimation();
                        })
                        .catch(() => {});
                }
            };
        }
    }

    /* ── Scroll Calculation ── */
    function updateTargetFrame() {
        const top = window.scrollY || window.pageYOffset;
        
        // Update Top Scroll Progress Bar
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) {
            const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalDocHeight > 0) {
                const scrollPct = (top / totalDocHeight) * 100;
                progressBar.style.width = scrollPct.toFixed(2) + '%';
            }
        }

        // Hide fixed canvas ONLY when Section 2 has fully covered the viewport
        const isPastHero = top >= cachedHeroHeight;
        canvas.style.display = isPastHero ? 'none' : 'block';

        if (top < cachedHeroHeight) {
            const progress = Math.min(Math.max(top / cachedMaxScroll, 0), 0.9999);
            targetFrame = progress * (TOTAL_FRAMES - 1);
            startAnimation();
        }
    }

    /* ── Active-On-Demand Animation Loop ── */
    function startAnimation() {
        if (!animActive) {
            animActive = true;
            requestAnimationFrame(tick);
        }
    }

    function tick() {
        const diff = targetFrame - currentFrame;
        
        if (Math.abs(diff) < 0.005) {
            currentFrame = targetFrame;
        } else {
            currentFrame += diff * LERP_FACTOR;
        }
        
        const drawIdx = Math.round(currentFrame);
        const painted = paint(drawIdx);
        if (painted) {
            lastDrawnIdx = drawIdx;
        }
        
        if (Math.abs(diff) >= 0.005 || !painted) {
            animActive = true;
            requestAnimationFrame(tick);
        } else {
            animActive = false;
        }
    }

    /* ── Award-Winning GSAP ScrollTrigger Clip-Path Reveal for Section 2 ── */
    function initSection2GSAP() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);

        const cards = document.querySelectorAll(".process-card");
        if (!cards.length) return;

        // Guarantee all cards start formatted for clip-path reveal
        gsap.set(cards, { opacity: 0, scale: 1.1 });

        // Create a timeline that will be scrubbed smoothly by scroll in both directions
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".process-section",
                start: "top top",
                end: "bottom bottom",
                pin: ".process-inner",
                scrub: 0.8,
                invalidateOnRefresh: true
            }
        });

        cards.forEach((card, index) => {
            tl.to(card, {
                clipPath: "inset(0% 0% 0% 0%)",
                opacity: 1,
                scale: 1,
                duration: 1,
                ease: "power2.out"
            }, index * 0.3);
        });

        tl.to(".process-card img", {
            scale: 1,
            duration: 1,
            stagger: 0.2,
            ease: "power2.out"
        }, "<");
    }

    /* ── Navbar 10% Scroll Float & Appointment Trigger Logic ── */
    function initNavbarLogic() {
        const navbar = document.getElementById('demo-navbar');
        const appointmentBtn = document.getElementById('nav-appointment-btn');
        if (!navbar) return;

        function updateNavbarFloat() {
            // Keep navbar permanently attached to the top edge as requested
            navbar.classList.remove('is-floating');
        }

        window.addEventListener('scroll', updateNavbarFloat, { passive: true });
        updateNavbarFloat();

        // Appointment Button Trigger -> Open Chatbot & Send "I want to book an appointment."
        if (appointmentBtn) {
            appointmentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.openChatbotWithMessage === 'function') {
                    window.openChatbotWithMessage("I want to book an appointment.");
                }
            });
        }
    }

    /* ── Events ── */
    window.addEventListener('scroll', updateTargetFrame, { passive: true });
    window.addEventListener('resize', resize);

    /* ── Bootstrap ── */
    hero.style.height = SCROLL_LENGTH;
    resize();
    preloadAndDecodeAll();
    initSection2GSAP();
    initNavbarLogic();
})();

