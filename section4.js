/* ══════════════════════════════════════════════════════
   SECTION 4 – LUMEN DENTAL TEAM (GSAP 3D SCROLL & CHROMA ENGINE)
   ══════════════════════════════════════════════════════ */
(() => {
    'use strict';

    const media = document.getElementById('chroma-team-media');
    const fade = document.getElementById('chroma-fade');
    const teamSection = document.getElementById('team');

    if (!media || !teamSection) return;
    if (typeof gsap === 'undefined') return;

    /* ── GSAP ScrollTrigger 3D & Mask Reveal Timeline ── */
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        gsap.timeline({
            scrollTrigger: {
                trigger: teamSection,
                start: 'top 85%',        // when top of section enters 85% of viewport
                end: 'top 20%',          // when top reaches 20%
                scrub: 1.2,              // smooth 1.2s scrub
            }
        })
        .to(media, {
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            opacity: 1,
            boxShadow: '0 40px 100px rgba(47, 214, 168, 0.25)',
            ease: 'power2.out',
            duration: 1.5
        });
    }

    /* ── Interactive Chroma Spotlight Engine ── */
    const setX = gsap.quickSetter(media, '--x', 'px');
    const setY = gsap.quickSetter(media, '--y', 'px');

    const pos = { x: 0, y: 0 };
    const rect = media.getBoundingClientRect();
    pos.x = rect.width / 2;
    pos.y = rect.height / 2;
    setX(pos.x);
    setY(pos.y);

    const moveTo = (targetX, targetY) => {
        gsap.to(pos, {
            x: targetX,
            y: targetY,
            duration: 0.45,
            ease: 'power3.out',
            onUpdate: () => {
                setX(pos.x);
                setY(pos.y);
            },
            overwrite: true
        });
    };

    const handlePointerMove = (e) => {
        const r = media.getBoundingClientRect();
        const mouseX = e.clientX - r.left;
        const mouseY = e.clientY - r.top;

        moveTo(mouseX, mouseY);

        media.style.setProperty('--mouse-x', `${mouseX}px`);
        media.style.setProperty('--mouse-y', `${mouseY}px`);

        if (fade) {
            gsap.to(fade, { opacity: 0, duration: 0.25, overwrite: true });
        }
    };

    const handlePointerLeave = () => {
        if (fade) {
            gsap.to(fade, { opacity: 1, duration: 0.6, overwrite: true });
        }
    };

    media.addEventListener('pointermove', handlePointerMove);
    media.addEventListener('pointerleave', handlePointerLeave);
})();
