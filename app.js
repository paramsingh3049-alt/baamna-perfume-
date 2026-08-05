document.addEventListener('DOMContentLoaded', () => {
    
    // Set Current Year in Footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Scroll Fade-in-up animations using Intersection Observer
    const animateOnScroll = () => {
        const fadeElements = document.querySelectorAll('.fade-in-up');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Trigger only once
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        fadeElements.forEach(el => observer.observe(el));
    };
    
    animateOnScroll();

    // Mobile Navigation Toggle
    const menuToggle = document.getElementById('menuToggle');
    const primaryNav = document.getElementById('primaryNav');

    if (menuToggle && primaryNav) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            primaryNav.classList.toggle('active');
            
            // Hamburger Animation
            menuToggle.classList.toggle('open');
        });

        // Close menu on nav link click
        const navLinks = primaryNav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.setAttribute('aria-expanded', 'false');
                primaryNav.classList.remove('active');
                menuToggle.classList.remove('open');
            });
        });
    }


    // Form Submission Handling
    const enquiryForm = document.getElementById('enquiryForm');
    const successMessage = document.getElementById('successMessage');

    if (enquiryForm && successMessage) {
        enquiryForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Intercept page reload to make it look premium
            
            // Simulate API submission
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.textContent = 'TRANSMITTING ENQUIRY...';
                submitBtn.disabled = true;
            }

            setTimeout(() => {
                enquiryForm.classList.add('hidden');
                successMessage.classList.remove('hidden');
                
                // Scroll into view of success box
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 1500);
        });
    }
});
