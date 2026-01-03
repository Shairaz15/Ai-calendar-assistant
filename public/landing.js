/**
 * NEXUS Landing Page - Scroll Animations
 * GPU-accelerated 3D effects for 120fps performance
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // PARTICLE FIELD
    // ═══════════════════════════════════════════════════════════════

    function initParticles() {
        const field = document.getElementById('particleField');
        if (!field) return;

        const particleCount = 40;

        // Create unique keyframes for visual variety
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random position
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';

            // Random size
            const size = 2 + Math.random() * 3;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';

            // Random opacity
            particle.style.opacity = String(0.2 + Math.random() * 0.4);

            // Unique animation per particle for variety
            const duration = 15 + Math.random() * 20;
            const delay = Math.random() * -20;
            const keyframeName = 'particle-drift-' + i;

            // Create unique keyframe for each particle
            const tx1 = 10 + Math.random() * 20;
            const ty1 = -20 - Math.random() * 30;
            const tx2 = -10 - Math.random() * 15;
            const ty2 = 10 + Math.random() * 20;
            const tx3 = 15 + Math.random() * 10;
            const ty3 = 5 + Math.random() * 10;

            const keyframeStyle = document.createElement('style');
            keyframeStyle.textContent = `
                @keyframes ${keyframeName} {
                    0% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(${tx1}px, ${ty1}px) scale(1.1); }
                    50% { transform: translate(${tx2}px, ${ty2}px) scale(0.9); }
                    75% { transform: translate(${tx3}px, ${ty3}px) scale(1.05); }
                    100% { transform: translate(0, 0) scale(1); }
                }
            `;
            document.head.appendChild(keyframeStyle);

            particle.style.animation = `${keyframeName} ${duration}s linear ${delay}s infinite`;
            field.appendChild(particle);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SCROLL-TRIGGERED ANIMATIONS
    // ═══════════════════════════════════════════════════════════════

    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -10% 0px'
        };

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe all feature elements
        const features = document.querySelectorAll('.feature-visual, .feature-text');
        features.forEach(function (el) {
            observer.observe(el);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3D ORB PARALLAX
    // ═══════════════════════════════════════════════════════════════

    function initOrbParallax() {
        const orb = document.getElementById('heroOrb');
        if (!orb) return;

        let ticking = false;

        function updateOrb() {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const scrollProgress = Math.min(scrollY / windowHeight, 1);

            // 3D rotation based on scroll
            const rotateX = scrollProgress * 30;
            const rotateY = scrollProgress * 45;
            const translateZ = 50 - scrollProgress * 30;
            const scale = 1 - scrollProgress * 0.3;
            const opacity = 1 - scrollProgress * 0.8;

            orb.style.transform = 'translateZ(' + translateZ + 'px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(' + scale + ')';
            orb.style.opacity = String(opacity);

            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(updateOrb);
                ticking = true;
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // MOUSE PARALLAX (Hero Section)
    // ═══════════════════════════════════════════════════════════════

    function initMouseParallax() {
        const orbContainer = document.getElementById('orbContainer');
        if (!orbContainer) return;

        const heroSection = document.getElementById('hero');
        if (!heroSection) return;

        let ticking = false;

        function handleMouseMove(e) {
            if (ticking) return;

            ticking = true;
            requestAnimationFrame(function () {
                const rect = heroSection.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                const rotateY = x * 20;
                const rotateX = -y * 20;

                orbContainer.style.transform = 'rotateY(' + rotateY + 'deg) rotateX(' + rotateX + 'deg)';
                ticking = false;
            });
        }

        function handleMouseLeave() {
            orbContainer.style.transform = 'rotateY(0deg) rotateX(0deg)';
        }

        heroSection.addEventListener('mousemove', handleMouseMove, { passive: true });
        heroSection.addEventListener('mouseleave', handleMouseLeave);
    }

    // ═══════════════════════════════════════════════════════════════
    // NAV SCROLL EFFECT
    // ═══════════════════════════════════════════════════════════════

    function initNavScroll() {
        const nav = document.querySelector('.nav-bar');
        if (!nav) return;

        let ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    if (window.scrollY > 100) {
                        nav.style.background = 'rgba(3, 7, 18, 0.95)';
                        nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
                    } else {
                        nav.style.background = 'linear-gradient(to bottom, rgba(3, 7, 18, 0.9), transparent)';
                        nav.style.boxShadow = 'none';
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // SMOOTH SCROLL FOR INTERNAL LINKS
    // ═══════════════════════════════════════════════════════════════

    function initSmoothScroll() {
        const anchors = document.querySelectorAll('a[href^="#"]');

        anchors.forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                // Handle empty hash or just "#"
                if (!href || href === '#') {
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // BUTTON RIPPLE EFFECT
    // ═══════════════════════════════════════════════════════════════

    function initRippleEffect() {
        const buttons = document.querySelectorAll('.cta-button, .nav-login-btn');

        buttons.forEach(function (button) {
            button.addEventListener('click', function (e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.style.cssText = 'position: absolute; width: 0; height: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.3); transform: translate(-50%, -50%); pointer-events: none; left: ' + x + 'px; top: ' + y + 'px;';

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                // Animate using GPU
                requestAnimationFrame(function () {
                    ripple.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                    ripple.style.width = '300px';
                    ripple.style.height = '300px';
                    ripple.style.opacity = '0';
                });

                setTimeout(function () {
                    ripple.remove();
                }, 600);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // SECTION VISIBILITY TRACKING
    // ═══════════════════════════════════════════════════════════════

    function initSectionTracking() {
        const sections = document.querySelectorAll('.section');

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('section-active');
                } else {
                    entry.target.classList.remove('section-active');
                }
            });
        }, { threshold: 0.5 });

        sections.forEach(function (section) {
            observer.observe(section);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // PERFORMANCE OPTIMIZATION
    // ═══════════════════════════════════════════════════════════════

    function checkReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════

    function init() {
        // Skip heavy animations if user prefers reduced motion
        if (checkReducedMotion()) {
            var features = document.querySelectorAll('.feature-visual, .feature-text');
            features.forEach(function (el) {
                el.classList.add('visible');
            });
            return;
        }

        initParticles();
        initScrollAnimations();
        initOrbParallax();
        initMouseParallax();
        initNavScroll();
        initSmoothScroll();
        initRippleEffect();
        initSectionTracking();

        console.log('✨ NEXUS Landing initialized');
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
