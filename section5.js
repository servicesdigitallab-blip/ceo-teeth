/* ══════════════════════════════════════════════════════
   SECTION 5 – BEFORE & AFTER MULTI-SERVICE ENGINE
   ══════════════════════════════════════════════════════ */
(() => {
    'use strict';

    const section = document.getElementById('before-after-section');
    const mediaStage = document.getElementById('ba-media-stage');
    const handle = document.getElementById('ba-handle');
    const cardBox = document.getElementById('ba-card-box');
    const ctaBtn = document.getElementById('ba-cta-btn');

    if (!section || !mediaStage) return;

    /* Service Data for Right Card Box Animation Updates */
    const SERVICES = [
        {
            id: 1,
            badge: 'Service 01 / 03',
            title: 'Teeth Whitening',
            description: 'Professional laser whitening for a radiant, stain-free smile in a single 45-minute session.',
            metric1: '100% Pain-Free',
            metric2: 'Done in 1 Visit'
        },
        {
            id: 2,
            badge: 'Service 02 / 03',
            title: 'Teeth Alignment & Orthodontics',
            description: 'Invisible precision aligners and cosmetic correction for discreet, comfortable tooth alignment.',
            metric1: 'Invisible Aligners',
            metric2: 'Quick Results'
        },
        {
            id: 3,
            badge: 'Service 03 / 03',
            title: 'Dental Implants & Restoration',
            description: 'Permanent, natural-looking implant restorations designed for lifetime durability and perfect bite.',
            metric1: 'Lifetime Warranty',
            metric2: 'Done in 2 Visits'
        }
    ];

    let currentServiceIdx = 0;
    const layers = document.querySelectorAll('.ba-layer');
    const badgeEl = document.getElementById('ba-badge');
    const serviceTitleEl = document.getElementById('ba-service-title');
    const descEl = document.getElementById('ba-desc');
    const metric1Text = document.getElementById('ba-metric-1-text');
    const metric2Text = document.getElementById('ba-metric-2-text');

    /* ── Switch Active Service Layer & Animate Right Card Box ── */
    function switchService(targetIdx) {
        if (targetIdx === currentServiceIdx) return;
        if (targetIdx < 0 || targetIdx >= SERVICES.length) return;

        currentServiceIdx = targetIdx;
        const data = SERVICES[targetIdx];

        // Animate Layers inside Media Stage Box
        layers.forEach((layer, idx) => {
            layer.classList.remove('active', 'exit-up');
            if (idx === targetIdx) {
                layer.classList.add('active');
            } else if (idx < targetIdx) {
                layer.classList.add('exit-up');
            }
        });

        // Animate Right Text Card Box
        if (cardBox) {
            cardBox.style.transform = 'perspective(1000px) scale(0.98) translateY(6px)';
            cardBox.style.borderColor = 'rgba(47, 214, 168, 0.7)';
            setTimeout(() => {
                cardBox.style.transform = '';
            }, 350);
        }

        if (serviceTitleEl) {
            serviceTitleEl.style.opacity = '0';
            serviceTitleEl.style.transform = 'translateY(10px)';
            setTimeout(() => {
                serviceTitleEl.textContent = data.title;
                serviceTitleEl.style.opacity = '1';
                serviceTitleEl.style.transform = 'translateY(0)';
            }, 180);
        }

        if (descEl) {
            descEl.style.opacity = '0';
            descEl.style.transform = 'translateY(10px)';
            setTimeout(() => {
                descEl.textContent = data.description;
                descEl.style.opacity = '1';
                descEl.style.transform = 'translateY(0)';
            }, 200);
        }

        if (badgeEl) badgeEl.textContent = data.badge;
        if (metric1Text) metric1Text.textContent = data.metric1;
        if (metric2Text) metric2Text.textContent = data.metric2;

        // Update Stepper Tab active state
        const tabBtns = document.querySelectorAll('.ba-tab-btn');
        tabBtns.forEach((btn, idx) => {
            if (idx === targetIdx) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /* ── Stepper Tab Click Event Bindings ── */
    const tabBtns = document.querySelectorAll('.ba-tab-btn');
    tabBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const targetIdx = parseInt(e.currentTarget.getAttribute('data-tab'), 10);
            if (!isNaN(targetIdx)) {
                switchService(targetIdx);
            }
        });
    });

    /* ── Scroll-Driven Multi-Service Timeline ── */
    function updateScrollProgress() {
        const rect = section.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const totalScroll = section.offsetHeight - winHeight;

        if (totalScroll <= 0) return;

        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1.0, scrolled / totalScroll));

        if (progress < 0.35) {
            switchService(0);
        } else if (progress >= 0.35 && progress < 0.70) {
            switchService(1);
        } else {
            switchService(2);
        }
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    /* ── CTA Button Click -> Open Chatbot & Book Service ── */
    if (ctaBtn) {
        ctaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentService = SERVICES[currentServiceIdx];
            const msg = `I want to book an appointment for ${currentService.title}.`;

            if (typeof window.openChatbotWithMessage === 'function') {
                window.openChatbotWithMessage(msg);
            }
        });
    }
})();
