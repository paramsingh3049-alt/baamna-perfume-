/*!
 * BAAMANN — Cinematic Perfume Intro Animation  |  intro.js
 * ADD-ON ONLY — injects a full-screen intro overlay, plays once per session.
 * Zero changes to existing site HTML, CSS, or JavaScript.
 */
(function () {
    'use strict';

    /* ── 1. Session guard ──────────────────────────────────────────── */
    const SESSION_KEY = 'baamann_intro_shown';
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');

    /* ── 2. Config ─────────────────────────────────────────────────── */
    const CFG = {
        bottleImg:       'images/baamann_bottle_only.jpg',
        logoImg:         'images/logo_transparent.png',
        // Timing (ms)
        bottleDelay:     200,   // bottle appears
        sweepDelay:      900,   // light sweep starts
        sprayDelay:      1300,  // particles begin
        logoDelay:       2400,  // logo fades in
        taglineDelay:    2700,  // tagline appears
        exitDelay:       3500,  // overlay begins exit
        removeDelay:     4500,  // overlay removed from DOM
        progressDur:     3500,  // progress bar fills over this duration
        // Particles
        PARTICLE_COUNT:  260,
        PARTICLE_WAVES:  6,     // staggered bursts
    };

    /* ── 3. Build overlay DOM ──────────────────────────────────────── */
    const overlay = document.createElement('div');
    overlay.id = 'baamann-intro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'BAAMANN Intro');

    overlay.innerHTML = `
        <canvas id="intro-canvas"></canvas>

        <!-- Ambient orbs -->
        <div class="intro-orb" style="
            width:320px;height:320px;
            top:12%;left:8%;
            background:radial-gradient(circle,rgba(197,165,120,0.055) 0%,transparent 70%);
            --orb-opacity:0.7;
            animation-duration:7s;animation-delay:-2s;
        "></div>
        <div class="intro-orb" style="
            width:260px;height:260px;
            bottom:14%;right:6%;
            background:radial-gradient(circle,rgba(197,165,120,0.04) 0%,transparent 70%);
            --orb-opacity:0.5;
            animation-duration:9s;animation-delay:-5s;
        "></div>

        <div id="intro-bottle-wrap">
            <div style="position:relative;display:inline-block;">
                <div id="intro-light-sweep"></div>
                <img id="intro-bottle-img"
                     src="${CFG.bottleImg}"
                     alt="BAAMANN Perfume"
                     draggable="false"
                >
            </div>
            <img id="intro-brand-logo"
                 src="${CFG.logoImg}"
                 alt="BAAMANN"
                 draggable="false"
            >
            <p id="intro-tagline">Private Fragrance Maison</p>
        </div>

        <button id="intro-skip-btn" aria-label="Skip intro">Skip Intro</button>
        <div id="intro-progress"></div>
    `;

    /* Insert as the very first child of <body> */
    document.body.insertAdjacentElement('afterbegin', overlay);

    /* Lock body scroll during intro */
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /* ── 4. Refs ───────────────────────────────────────────────────── */
    const canvas      = document.getElementById('intro-canvas');
    const ctx         = canvas.getContext('2d');
    const bottleWrap  = document.getElementById('intro-bottle-wrap');
    const bottleImg   = document.getElementById('intro-bottle-img');
    const lightSweep  = document.getElementById('intro-light-sweep');
    const logoEl      = document.getElementById('intro-brand-logo');
    const taglineEl   = document.getElementById('intro-tagline');
    const skipBtn     = document.getElementById('intro-skip-btn');
    const progressBar = document.getElementById('intro-progress');

    /* ── 5. Canvas sizing ──────────────────────────────────────────── */
    function resizeCanvas() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    /* ── 6. Particle system ────────────────────────────────────────── */
    const particles = [];
    let   rafId     = null;
    let   sprayActive = false;

    /**
     * Get the bottle nozzle position in screen coordinates.
     * The nozzle is roughly at the top-right area of the bottle image.
     */
    function getNozzlePos() {
        const rect = bottleImg.getBoundingClientRect();
        return {
            x: rect.left + rect.width  * 0.72,  // nozzle ~72% from left
            y: rect.top  + rect.height * 0.12,  // nozzle ~12% from top
        };
    }

    function randomBetween(a, b) {
        return a + Math.random() * (b - a);
    }

    function createParticle(nozzle) {
        // Spray angle: fan upward-right from the nozzle
        const angle  = randomBetween(-Math.PI * 0.85, -Math.PI * 0.15);
        const speed  = randomBetween(0.6, 3.2);
        const size   = randomBetween(1.0, 4.0);
        // Colour palette: ivory mist and champagne gold
        const palette = [
            `rgba(245,242,235,`,   // ivory
            `rgba(220,200,165,`,   // champagne
            `rgba(197,165,120,`,   // accent gold
            `rgba(255,248,230,`,   // warm white
            `rgba(180,160,130,`,   // muted bronze
        ];
        const col = palette[Math.floor(Math.random() * palette.length)];

        // Some particles float toward camera (grow + fade)
        const isDepth = Math.random() < 0.12;

        return {
            x:       nozzle.x,
            y:       nozzle.y,
            vx:      Math.cos(angle) * speed,
            vy:      Math.sin(angle) * speed,
            size:    size,
            opacity: randomBetween(0.3, 0.85),
            decay:   randomBetween(0.004, 0.012),
            col:     col,
            gravity: randomBetween(-0.012, 0.018),  // slight float or drift
            isDepth: isDepth,
            scale:   1,
            scaleV:  isDepth ? randomBetween(0.008, 0.022) : 0,
            // Swirl/turbulence
            angle:   angle,
            wobble:  randomBetween(-0.04, 0.04),
        };
    }

    function spawnWave(nozzle, count) {
        for (let i = 0; i < count; i++) {
            particles.push(createParticle(nozzle));
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            /* Update */
            p.angle += p.wobble * 0.05;
            p.vx += Math.cos(p.angle) * 0.008;
            p.vy += p.gravity;
            p.x  += p.vx;
            p.y  += p.vy;
            p.opacity -= p.decay;
            p.scale   += p.scaleV;
            // Slow down over time (air resistance feel)
            p.vx *= 0.995;
            p.vy *= 0.995;

            if (p.opacity <= 0) {
                particles.splice(i, 1);
                continue;
            }

            /* Draw */
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);

            const r = p.size * p.scale;

            if (p.isDepth) {
                /* Glowing depth droplet */
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
                grad.addColorStop(0,   p.col + '0.9)');
                grad.addColorStop(0.4, p.col + '0.4)');
                grad.addColorStop(1,   p.col + '0)');
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            } else {
                /* Fine mist droplet */
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
                grad.addColorStop(0, p.col + Math.min(1, p.opacity + 0.15) + ')');
                grad.addColorStop(1, p.col + '0)');
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }

            ctx.restore();
        }

        rafId = requestAnimationFrame(drawParticles);
    }

    /* ── 7. Spray sequence — staggered waves ───────────────────────── */
    let sprayTimers = [];

    function startSpray() {
        sprayActive = true;
        drawParticles();  // start rAF loop

        const perWave = Math.floor(CFG.PARTICLE_COUNT / CFG.PARTICLE_WAVES);

        for (let w = 0; w < CFG.PARTICLE_WAVES; w++) {
            const t = setTimeout(() => {
                if (!sprayActive) return;
                const nozzle = getNozzlePos();
                spawnWave(nozzle, perWave);
            }, w * 180);
            sprayTimers.push(t);
        }
    }

    /* ── 8. Cleanup ────────────────────────────────────────────────── */
    let allTimers = [];

    function cleanup() {
        sprayActive = false;
        if (rafId) cancelAnimationFrame(rafId);
        sprayTimers.forEach(clearTimeout);
        allTimers.forEach(clearTimeout);
        window.removeEventListener('resize', resizeCanvas);
    }

    function dismissIntro() {
        cleanup();
        overlay.classList.add('intro-exit');
        // After CSS transition, remove from DOM and restore scroll
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = origOverflow;
        }, 950);
    }

    /* ── 9. Progress bar animation ─────────────────────────────────── */
    function startProgress() {
        progressBar.style.transition = `width ${CFG.progressDur}ms linear`;
        // Force reflow before changing width
        void progressBar.offsetWidth;
        progressBar.style.width = '100%';
    }

    /* ── 10. Skip button ───────────────────────────────────────────── */
    skipBtn.addEventListener('click', dismissIntro);
    skipBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        dismissIntro();
    });
    // Mobile: also allow tap anywhere if no scroll
    let touchStartY = 0;
    overlay.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });

    /* ── 11. Animation timeline ────────────────────────────────────── */
    function scheduleTimer(fn, delay) {
        const id = setTimeout(fn, delay);
        allTimers.push(id);
        return id;
    }

    // Kick off once fonts/images are ready or after a short guard
    function startTimeline() {
        startProgress();

        // T+200ms: bottle appears
        scheduleTimer(() => {
            bottleWrap.classList.add('bottle-visible');
        }, CFG.bottleDelay);

        // T+900ms: light sweep
        scheduleTimer(() => {
            lightSweep.classList.add('sweep-active');
        }, CFG.sweepDelay);

        // T+1300ms: spray starts
        scheduleTimer(() => {
            startSpray();
        }, CFG.sprayDelay);

        // T+2400ms: BAAMANN logo
        scheduleTimer(() => {
            logoEl.classList.add('logo-visible');
        }, CFG.logoDelay);

        // T+2700ms: tagline
        scheduleTimer(() => {
            taglineEl.classList.add('tagline-visible');
        }, CFG.taglineDelay);

        // T+3500ms: begin exit
        scheduleTimer(() => {
            dismissIntro();
        }, CFG.exitDelay);
    }

    /* ── 12. Wait for DOM ready & bottle image to load ─────────────── */
    function init() {
        if (bottleImg.complete) {
            startTimeline();
        } else {
            bottleImg.addEventListener('load',  startTimeline, { once: true });
            // Fallback: start anyway after 800ms if image stalls
            const fallback = setTimeout(startTimeline, 800);
            bottleImg.addEventListener('load',  () => clearTimeout(fallback), { once: true });
            bottleImg.addEventListener('error', () => { clearTimeout(fallback); startTimeline(); }, { once: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

})();
