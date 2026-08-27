/*!
 * BAAMANN — Luxury Perfume Mist Intro  |  intro.js
 * ADD-ON ONLY — pure add-on opening animation.
 * Zero changes to any existing site content, layout, or functionality.
 */
(function () {
    'use strict';

    /* ── 1. Session Guard (Play once per session) ──────────────────── */
    const SESSION_KEY = 'baamann_intro_seen';
    if (sessionStorage.getItem(SESSION_KEY)) {
        return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');

    /* ── 2. Synthesize Luxury Perfume Spray Audio (Web Audio API) ─── */
    function playLuxurySpraySound() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const bufferSize = ctx.sampleRate * 0.95; // ~950ms spray duration
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            // Generate colored noise (pink/whisper spectrum for fine mist)
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99 * b0 + white * 0.05;
                b1 = 0.95 * b1 + white * 0.1;
                b2 = 0.85 * b2 + white * 0.2;
                output[i] = (b0 + b1 + b2 + white * 0.3) * 0.4;
            }

            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            // Bandpass filter for realistic aerosol atomization sound
            const bandpass = ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(3200, ctx.currentTime);
            bandpass.Q.setValueAtTime(1.2, ctx.currentTime);
            bandpass.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.8);

            // Highpass for silky airy hiss
            const highpass = ctx.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.setValueAtTime(1600, ctx.currentTime);

            // Gain envelope for soft realistic pressure burst and dissipation
            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.06); // fast soft attack
            gainNode.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.25); // sustained release
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9); // smooth tail

            noiseSource.connect(bandpass);
            bandpass.connect(highpass);
            highpass.connect(gainNode);
            gainNode.connect(ctx.destination);

            noiseSource.start();
        } catch (e) {
            // Audio policy fallback - silent run without interrupting animation
        }
    }

    /* ── 3. Build & Inject Intro Overlay DOM ────────────────────────── */
    const overlay = document.createElement('div');
    overlay.id = 'baamann-intro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Intro Animation');

    overlay.innerHTML = `
        <div id="intro-ambient"></div>
        <canvas id="intro-canvas"></canvas>

        <div id="intro-nozzle">
            <div class="nz-btn"></div>
            <div class="nz-barrel"></div>
            <div class="nz-head">
                <div class="nz-hole" id="intro-hole"></div>
            </div>
            <div class="nz-collar"></div>
        </div>

        <button id="intro-skip" aria-label="Skip Intro">Skip Intro</button>
    `;

    document.body.insertAdjacentElement('afterbegin', overlay);

    // Lock page scrolling while intro plays
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /* ── 4. Elements & Canvas Setup ────────────────────────────────── */
    const canvas     = document.getElementById('intro-canvas');
    const ctx        = canvas.getContext('2d');
    const ambientEl  = document.getElementById('intro-ambient');
    const nozzleEl   = document.getElementById('intro-nozzle');
    const skipBtn    = document.getElementById('intro-skip');

    let width  = (canvas.width  = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    function onResize() {
        width  = canvas.width  = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', onResize);

    /* ── 5. Advanced Particle & Mist Simulation Engine ─────────────── */
    const particles = [];      // 3D atomized droplets moving toward camera
    const mistClouds = [];     // Soft expanding volumetric vapor clouds
    const screenDrops = [];    // Droplets that hit and dissolve on screen
    let rafId = null;
    let isExiting = false;

    // Center nozzle origin
    function getNozzleCenter() {
        return {
            x: width / 2,
            y: height / 2 + (width < 600 ? -5 : 0)
        };
    }

    // 1. Mist Cloud / Vapor Particle (Volumetric luxury mist)
    class MistCloud {
        constructor(originX, originY) {
            this.x = originX + (Math.random() - 0.5) * 20;
            this.y = originY + (Math.random() - 0.5) * 20;
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.8 + Math.random() * 2.6;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed * 0.75 - 0.3; // subtle upward drift
            this.radius = 18 + Math.random() * 32;
            this.growth = 1.4 + Math.random() * 1.8;
            this.maxRadius = 260 + Math.random() * 280;
            this.opacity = 0.09 + Math.random() * 0.12;
            this.decay = 0.00075 + Math.random() * 0.0009;
            this.hue = Math.random() > 0.4 ? '232, 218, 195' : '245, 242, 235'; // ivory gold tones
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.985;
            this.vy *= 0.985;
            if (this.radius < this.maxRadius) {
                this.radius += this.growth;
                this.growth *= 0.975;
            }
            this.opacity -= this.decay;
        }

        draw() {
            if (this.opacity <= 0.002) return;
            const grad = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius
            );
            grad.addColorStop(0, `rgba(${this.hue}, ${this.opacity})`);
            grad.addColorStop(0.45, `rgba(${this.hue}, ${this.opacity * 0.5})`);
            grad.addColorStop(1, `rgba(${this.hue}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 2. 3D Spray Droplet (Moves towards camera Z-axis)
    class Droplet3D {
        constructor(originX, originY) {
            this.ox = originX;
            this.oy = originY;
            // 3D coordinates
            this.x = (Math.random() - 0.5) * 35;
            this.y = (Math.random() - 0.5) * 35;
            this.z = 260 + Math.random() * 80; // Distance away from screen
            
            // Conical velocity outward toward viewer
            const spreadAngle = Math.random() * Math.PI * 2;
            const spreadVel = 0.4 + Math.random() * 2.2;
            this.vx = Math.cos(spreadAngle) * spreadVel;
            this.vy = Math.sin(spreadAngle) * spreadVel - 0.2;
            this.vz = -(5.5 + Math.random() * 8.5); // Moves toward z=0 (the screen)

            this.baseSize = 0.8 + Math.random() * 1.6;
            this.opacity = 0.6 + Math.random() * 0.4;
            this.isScreenHitter = Math.random() < 0.18; // Chance to hit lens/screen
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;

            // Check if droplet hits the screen
            if (this.z <= 12) {
                if (this.isScreenHitter) {
                    // Create screen condensation droplet
                    const fov = 320;
                    const scale = fov / Math.max(12, this.z);
                    const screenX = this.ox + this.x * scale;
                    const screenY = this.oy + this.y * scale;
                    if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
                        screenDrops.push(new ScreenDrop(screenX, screenY, this.baseSize * (1.8 + Math.random() * 1.5)));
                    }
                }
                return false; // Remove 3D particle
            }
            return true;
        }

        draw() {
            if (this.z <= 15) return;
            const fov = 320;
            const scale = fov / this.z;
            const projX = this.ox + this.x * scale;
            const projY = this.oy + this.y * scale;
            const radius = Math.max(0.6, this.baseSize * scale * 0.42);

            if (projX < -50 || projX > width + 50 || projY < -50 || projY > height + 50) {
                return;
            }

            // Proximity glow
            const alpha = Math.min(1, this.opacity * (scale * 0.18));
            ctx.save();
            ctx.globalAlpha = alpha;

            if (scale > 1.8) {
                // Large droplet near camera: glowing soft orb
                const grad = ctx.createRadialGradient(projX, projY, 0, projX, projY, radius * 2.2);
                grad.addColorStop(0, 'rgba(255, 252, 245, 0.95)');
                grad.addColorStop(0.35, 'rgba(225, 205, 170, 0.45)');
                grad.addColorStop(1, 'rgba(197, 165, 120, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(projX, projY, radius * 2.2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Fine atomized particle
                ctx.fillStyle = 'rgba(245, 235, 215, 0.85)';
                ctx.beginPath();
                ctx.arc(projX, projY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // 3. Screen Hit Droplet (Dew / condensation that gently dissolves on screen)
    class ScreenDrop {
        constructor(x, y, radius) {
            this.x = x;
            this.y = y;
            this.radius = Math.max(2.5, radius);
            this.maxRadius = this.radius * (1.15 + Math.random() * 0.2);
            this.opacity = 0.7 + Math.random() * 0.25;
            this.decay = 0.009 + Math.random() * 0.007;
            this.drip = Math.random() < 0.25 ? 0.15 + Math.random() * 0.35 : 0; // slight luxury drip
        }

        update() {
            this.y += this.drip;
            this.opacity -= this.decay;
            if (this.radius < this.maxRadius) {
                this.radius += 0.08;
            }
        }

        draw() {
            if (this.opacity <= 0.01) return;
            ctx.save();
            ctx.globalAlpha = this.opacity;

            // Glass condensation droplet with luxury refractive ring
            const grad = ctx.createRadialGradient(
                this.x - this.radius * 0.3,
                this.y - this.radius * 0.3,
                0,
                this.x,
                this.y,
                this.radius
            );
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
            grad.addColorStop(0.5, 'rgba(220, 205, 180, 0.25)');
            grad.addColorStop(0.85, 'rgba(197, 165, 120, 0.45)'); // delicate gold rim
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Specular glint highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.22, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    /* ── 6. Spray Burst Controller ──────────────────────────────────── */
    function triggerSprayBlast() {
        const origin = getNozzleCenter();

        // 1. Burst of 3D droplets towards user (280 fine particles)
        for (let i = 0; i < 280; i++) {
            particles.push(new Droplet3D(origin.x, origin.y));
        }

        // 2. Volumetric soft mist clouds spreading over screen (45 expanding clouds)
        for (let i = 0; i < 45; i++) {
            mistClouds.push(new MistCloud(origin.x, origin.y));
        }
    }

    /* ── 7. Render Loop ────────────────────────────────────────────── */
    function loop() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw volumetric mist clouds
        for (let i = mistClouds.length - 1; i >= 0; i--) {
            const m = mistClouds[i];
            m.update();
            m.draw();
            if (m.opacity <= 0.002) {
                mistClouds.splice(i, 1);
            }
        }

        // 2. Draw 3D forward traveling droplets
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const active = p.update();
            if (active) {
                p.draw();
            } else {
                particles.splice(i, 1);
            }
        }

        // 3. Draw screen condensation droplets
        for (let i = screenDrops.length - 1; i >= 0; i--) {
            const s = screenDrops[i];
            s.update();
            s.draw();
            if (s.opacity <= 0.01) {
                screenDrops.splice(i, 1);
            }
        }

        if (!isExiting || mistClouds.length > 0 || particles.length > 0 || screenDrops.length > 0) {
            rafId = requestAnimationFrame(loop);
        }
    }

    /* ── 8. Dismiss / Clean Up (Seamless Unveiling of Homepage) ─────── */
    function dismissIntro() {
        if (isExiting) return;
        isExiting = true;

        overlay.classList.add('intro-exit');

        // Restore scroll and remove overlay after transition
        setTimeout(() => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', onResize);
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            document.body.style.overflow = originalOverflow;
        }, 1600);
    }

    // Skip button click handler
    skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissIntro();
    });

    /* ── 9. Choreographed Luxury Sequence Timeline ─────────────────── */
    function runIntroSequence() {
        // Start particle render loop
        rafId = requestAnimationFrame(loop);

        // T + 0.2s: Subtle ambient illumination appears
        setTimeout(() => {
            ambientEl.classList.add('amb-in');
        }, 200);

        // T + 0.35s: Minimal generic spray nozzle glides in smoothly
        setTimeout(() => {
            nozzleEl.classList.add('nozzle-in');
        }, 350);

        // T + 0.65s: Nozzle presses down, releases luxury spray & sound effect
        setTimeout(() => {
            nozzleEl.classList.add('is-pressed');
            playLuxurySpraySound();
            triggerSprayBlast();
        }, 650);

        // T + 0.85s: Nozzle returns up and gently fades away, leaving only the mist
        setTimeout(() => {
            nozzleEl.classList.remove('is-pressed');
            nozzleEl.classList.add('nozzle-out');
        }, 850);

        // T + 1.85s: Mist reaches full dispersion and begins unveiling homepage underneath
        setTimeout(() => {
            dismissIntro();
        }, 1900);
    }

    // Start on DOM ready or immediate if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runIntroSequence, { once: true });
    } else {
        runIntroSequence();
    }

})();
